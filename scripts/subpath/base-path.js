// This reserved base is built into the container's relocatable SvelteKit output.
export const templateBase = '/__airtrail_deployment_base__';

/** @returns {'' | `/${string}`} */
export function normalizeBasePath(value = '') {
  const base = value.replace(/\/$/, '');
  if (!base) return '';
  if (
    !/^\/(?:[A-Za-z0-9._~-]+\/)*[A-Za-z0-9._~-]+$/.test(base) ||
    base.split('/').some((segment) => segment === '.' || segment === '..') ||
    base.includes(templateBase)
  ) {
    throw new Error(
      'BASE_PATH must be empty or a path such as /airtrail or /apps/airtrail',
    );
  }
  return /** @type {`/${string}`} */ (base);
}

// OAuth discovery inserts the issuer/resource path after the well-known name.
/**
 * @param {{ url?: string }} request
 * @param {string} base
 */
export function rewriteDiscoveryUrl(request, base) {
  if (!base || !request.url) return;
  const queryIndex = request.url.indexOf('?');
  const pathname =
    queryIndex === -1 ? request.url : request.url.slice(0, queryIndex);
  const search = queryIndex === -1 ? '' : request.url.slice(queryIndex);
  const issuer = '/.well-known/oauth-authorization-server';
  const resource = '/.well-known/oauth-protected-resource';

  if (pathname === issuer + base) {
    request.url = base + issuer + search;
  } else if (
    ['/api/v1', '/api/mcp'].some(
      (endpoint) => pathname === resource + base + endpoint,
    )
  ) {
    request.url =
      base + resource + pathname.slice((resource + base).length) + search;
  }
}

export const buildBasePath = (env = process.env) =>
  env.AIRTRAIL_TEMPLATE_BUILD === '1'
    ? templateBase
    : normalizeBasePath(env.BASE_PATH);
