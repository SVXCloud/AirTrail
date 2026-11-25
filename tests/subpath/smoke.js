import assert from 'node:assert/strict';
import { randomUUID, createHash } from 'node:crypto';
import { test } from 'node:test';
import { normalizeBasePath } from '../../scripts/subpath/base-path.js';

const origin = process.env.TEST_ORIGIN ?? 'http://localhost:3000';
const base = normalizeBasePath(process.env.BASE_PATH);
/** @param {string} path */
const url = (path) => origin + base + path;
/** @param {string} path @param {RequestInit} [options] */
const get = (path, options) =>
  fetch(url(path), { redirect: 'manual', ...options });
const username = 'deploytest';
const password = 'Deployment-test123!';
let session = '';

/**
 * @param {string} path
 * @param {FormData | Record<string, string>} data
 * @param {string | null} [cookie]
 */
const form = (path, data, cookie, requestOrigin = origin) =>
  get(path, {
    method: 'POST',
    headers: { origin: requestOrigin, ...(cookie && { cookie }) },
    body: data instanceof FormData ? data : new URLSearchParams(data),
  });

/** @param {Response} response @param {number} status */
const body = async (response, status) => {
  const value = await response.text();
  assert.equal(response.status, status, value.slice(0, 500));
  return value;
};

/** @param {Response} response @param {number} status */
const json = async (response, status) =>
  JSON.parse(await body(response, status));
/** @param {string | undefined} cookie */
const assertCookie = (cookie) => {
  assert.ok(cookie, 'Expected a Set-Cookie header');
  assert.ok(cookie.split('; ').includes('Path=' + (base || '/')));
  return cookie;
};

/** @param {Response} response */
const redirectLocation = (response) => {
  const location = response.headers.get('location');
  assert.ok(location, 'Expected a Location header');
  return new URL(location, origin);
};

test('routing, generated assets, manifest, service worker, and API documentation', async () => {
  assert.equal(await body(await get('/api/ping'), 200), 'pong');
  if (base) {
    const root = await fetch(origin + '/api/ping', { redirect: 'manual' });
    assert.equal(root.status, 404);
  }
  const manifest = await json(await get('/manifest.webmanifest'), 200);
  assert.equal(manifest.scope, base + '/');
  assert.equal(manifest.start_url, base + '/');
  for (const icon of manifest.icons) {
    assert.ok(icon.src.startsWith(base + '/'));
    assert.equal((await fetch(origin + icon.src)).status, 200);
  }
  const worker = await body(await get('/sw.js'), 200);
  assert.doesNotMatch(worker, /__airtrail_deployment_base__/);
  assert.equal((await get('/countries-bounds.json')).status, 200);
  assert.match(
    await body(await get('/api/v1/openapi.yaml'), 200),
    /openapi: 3\.1\.0/,
  );
  const discovery = await json(await get('/api/v1'), 200);
  assert.equal(discovery.api.documentation, base + '/api/v1/openapi.yaml');
  const unauthenticated = await json(await get('/__data.json'), 200);
  assert.deepEqual(unauthenticated, {
    type: 'redirect',
    location: base + '/login',
  });
});

test('account setup or existing login, CSRF, tRPC, attachments, and public shares', async () => {
  const login = await json(await get('/login/__data.json'), 200);
  if (process.env.EXPECT_EMPTY_DB === '1') {
    assert.deepEqual(login, { type: 'redirect', location: base + '/setup' });
    const setup = await body(await get('/setup'), 200);
    assert.ok(
      setup.includes(base + '/api/users/setup') ||
        setup.includes(base + '/_app/'),
    );
    const result = await form('/api/users/setup', {
      username,
      password,
      displayName: 'Deployment Test',
    });
    assert.equal((await json(result, 303)).location, base + '/');
  } else {
    assert.equal(login.type, 'data');
    const html = await body(await get('/login'), 200);
    assert.ok(
      html.includes(base + '/_app/'),
      'HTML must reference the mounted client bundle',
    );
  }
  assert.equal(
    (
      await form(
        '/api/users/login',
        { username, password },
        null,
        'https://other.invalid',
      )
    ).status,
    403,
  );
  const result = await form('/api/users/login', { username, password });
  assert.equal((await json(result, 303)).location, base + '/');
  const cookie = result.headers
    .getSetCookie()
    .find((value) => /^auth_session=/.test(value));
  assert.ok(cookie);
  assertCookie(cookie);
  session = cookie.slice(0, cookie.indexOf(';'));
  const home = await body(
    await get('/', { headers: { cookie: session } }),
    200,
  );
  assert.ok(home.includes(base + '/_app/'));

  const trpc = await get('/api/trpc/calendar.get', {
    headers: { cookie: session },
  });
  assert.ok(
    (await json(trpc, 200)).result,
    'tRPC resolved the procedure under the mount',
  );

  const file = new FormData();
  file.append('airlineId', '999991');
  const content =
    '<svg xmlns="http://www.w3.org/2000/svg"><title>Deployment fixture</title></svg>';
  file.append(
    'file',
    new Blob([content], { type: 'image/svg+xml' }),
    'fixture.svg',
  );
  const upload = await json(
    await form('/api/airline/icon', file, session),
    200,
  );
  assert.equal(
    await body(await get('/api/uploads/' + upload.path), 200),
    content,
  );

  const slug = 'deployment-' + randomUUID();
  const share = await json(
    await form('/api/share/save/form', { slug, showMap: 'true' }, session),
    200,
  );
  assert.equal(share.type, 'success');
  assert.equal((await get('/share/' + slug)).status, 200);
});

test('OAuth discovery, protected-resource challenges, PKCE request, and scoped login/consent cookies', async () => {
  const issuer = await json(
    await fetch(origin + '/.well-known/oauth-authorization-server' + base),
    200,
  );
  assert.equal(issuer.issuer, origin + base);
  assert.equal(issuer.authorization_endpoint, url('/oauth/authorize'));
  assert.equal(issuer.token_endpoint, url('/oauth/token'));
  const metadataUrl =
    origin + '/.well-known/oauth-protected-resource' + base + '/api/v1';
  const metadata = await json(await fetch(metadataUrl), 200);
  assert.equal(metadata.resource, url('/api/v1'));
  assert.deepEqual(metadata.authorization_servers, [origin + base]);

  const auth = await get('/api/v1/me');
  assert.equal(auth.status, 401);
  assert.ok(auth.headers.get('www-authenticate')?.includes(metadataUrl));
  assert.equal(auth.headers.get('access-control-allow-origin'), '*');
  const token = await get('/oauth/token', {
    method: 'POST',
    body: new URLSearchParams({ grant_type: 'authorization_code' }),
  });
  assert.equal((await json(token, 400)).error, 'invalid_request');

  const redirectUri = 'http://127.0.0.1:45455/callback';
  const registration = await json(
    await get('/oauth/register', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        client_name: 'Deployment Test',
        redirect_uris: [redirectUri],
        token_endpoint_auth_method: 'none',
      }),
    }),
    201,
  );
  const verifier = 'a'.repeat(64);
  const challenge = createHash('sha256').update(verifier).digest('base64url');
  const query = new URLSearchParams({
    client_id: registration.client_id,
    redirect_uri: redirectUri,
    response_type: 'code',
    resource: url('/api/v1'),
    scope: 'profile.read',
    code_challenge: challenge,
    code_challenge_method: 'S256',
  });
  const authorize = await get('/oauth/authorize?' + query);
  assert.equal(authorize.status, 303, await authorize.text());
  assert.equal(redirectLocation(authorize).pathname, base + '/login');
  const pending = assertCookie(authorize.headers.getSetCookie()[0]);
  const cookies = session + '; ' + pending.split(';', 1)[0];
  const requestId = new URLSearchParams(pending.split(';', 1)[0])
    .values()
    .next().value;
  assert.ok(requestId);
  const consentPath = '/oauth/consent?id=' + encodeURIComponent(requestId);
  await body(await get(consentPath, { headers: { cookie: cookies } }), 200);
  const consent = await form(
    consentPath,
    {
      id: requestId,
      decision: 'approve',
      scope: 'profile.read',
    },
    cookies,
  );
  const decision = await json(consent, 200);
  assert.equal(decision.type, 'redirect');
  assert.equal(decision.status, 303);
  assertCookie(consent.headers.getSetCookie()[0]);
  const callback = new URL(decision.location);
  assert.equal(callback.origin + callback.pathname, redirectUri);
  const code = callback.searchParams.get('code');
  assert.ok(code);
  const tokens = await json(
    await get('/oauth/token', {
      method: 'POST',
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: registration.client_id,
        redirect_uri: redirectUri,
        code,
        code_verifier: verifier,
        resource: url('/api/v1'),
      }),
    }),
    200,
  );
  assert.equal(
    (
      await get('/api/v1/me', {
        headers: { authorization: 'Bearer ' + tokens.access_token },
      })
    ).status,
    200,
  );

  const logout = await form('/log-out', {}, session);
  assert.equal(logout.status, 302);
  assert.equal(redirectLocation(logout).pathname, base + '/login');
  assertCookie(logout.headers.getSetCookie()[0]);
});

test('OIDC round trip respects the login callback and scoped PKCE cookies', async () => {
  const providerOrigin = process.env.OIDC_TEST_ORIGIN;
  assert.ok(
    providerOrigin,
    'OIDC_TEST_ORIGIN must point to the disposable provider',
  );
  const authorize = await get('/api/trpc/oauth.authorize', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(JSON.stringify([url('/login')])),
  });
  const result = await json(authorize, 200);
  // The upstream tRPC output transformer encodes this object as a JS literal.
  const match = result.result.data.match(/https?:[^"']+/);
  assert.ok(match);
  assert.ok(match[0]);
  const endpoint = new URL(match[0]);
  assert.equal(endpoint.searchParams.get('redirect_uri'), url('/login'));
  const cookies = authorize.headers.getSetCookie();
  assert.equal(cookies.length, 2);
  cookies.forEach(assertCookie);
  const browserRedirect = await fetch(
    providerOrigin + endpoint.pathname + endpoint.search,
    { redirect: 'manual' },
  );
  assert.equal(browserRedirect.status, 302);
  const callback = redirectLocation(browserRedirect);
  assert.equal(callback.origin + callback.pathname, url('/login'));
  const resultResponse = await get('/api/oauth/callback', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      cookie: cookies.map((cookie) => cookie.split(';', 1)[0]).join('; '),
    },
    body: JSON.stringify({ url: callback.href }),
  });
  assert.deepEqual(await json(resultResponse, 200), {
    success: true,
    redirectTo: base + '/',
  });
  const cookiesAfterCallback = resultResponse.headers.getSetCookie();
  assert.equal(cookiesAfterCallback.length, 3);
  cookiesAfterCallback.forEach(assertCookie);
});
