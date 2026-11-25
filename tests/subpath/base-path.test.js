import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  normalizeBasePath,
  rewriteDiscoveryUrl,
  templateBase,
} from '../../scripts/subpath/base-path.js';

test('normalizes root and nested paths and rejects ambiguous paths', () => {
  for (const value of [undefined, '', '/'])
    assert.equal(normalizeBasePath(value), '');
  assert.equal(normalizeBasePath('/airtrail'), '/airtrail');
  assert.equal(normalizeBasePath('/apps/airtrail/'), '/apps/airtrail');
  for (const value of [
    'app',
    '//app',
    '/a//b',
    '/a/../b',
    '/a?b',
    '/a#b',
    '/%2fa',
    '/a\\b',
    templateBase,
  ]) {
    assert.throws(() => normalizeBasePath(value), /BASE_PATH/);
  }
});

test('rewrites only the standard metadata paths for the configured mount', () => {
  const base = '/apps/airtrail';
  for (const [url, expected] of [
    [
      '/.well-known/oauth-authorization-server/apps/airtrail?test=1',
      '/apps/airtrail/.well-known/oauth-authorization-server?test=1',
    ],
    [
      '/.well-known/oauth-protected-resource/apps/airtrail/api/mcp',
      '/apps/airtrail/.well-known/oauth-protected-resource/api/mcp',
    ],
    [
      '/.well-known/oauth-protected-resource/apps/airtrail/api/v1',
      '/apps/airtrail/.well-known/oauth-protected-resource/api/v1',
    ],
    [
      '/.well-known/oauth-protected-resource/apps/airtrail/api/v1/me',
      '/.well-known/oauth-protected-resource/apps/airtrail/api/v1/me',
    ],
    [
      '/.well-known/oauth-authorization-server/apps/airtrail-other',
      '/.well-known/oauth-authorization-server/apps/airtrail-other',
    ],
    ['/apps/airtrail/login', '/apps/airtrail/login'],
  ]) {
    const request = { url };
    rewriteDiscoveryUrl(request, base);
    assert.equal(request.url, expected);
  }
});
