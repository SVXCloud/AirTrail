import assert from 'node:assert/strict';
import { test } from 'node:test';

import { rewriteDiscoveryUrl } from '../../scripts/subpath/base-path.js';

test('rewrites only the standard metadata paths for /air', () => {
  for (const [url, expected] of [
    [
      '/.well-known/oauth-authorization-server/air?test=1',
      '/air/.well-known/oauth-authorization-server?test=1',
    ],
    [
      '/.well-known/oauth-protected-resource/air/api/mcp',
      '/air/.well-known/oauth-protected-resource/api/mcp',
    ],
    [
      '/.well-known/oauth-protected-resource/air/api/v1',
      '/air/.well-known/oauth-protected-resource/api/v1',
    ],
    [
      '/.well-known/oauth-protected-resource/air/api/v1/me',
      '/.well-known/oauth-protected-resource/air/api/v1/me',
    ],
    [
      '/.well-known/oauth-authorization-server/air-other',
      '/.well-known/oauth-authorization-server/air-other',
    ],
    ['/air/login', '/air/login'],
  ]) {
    const request = { url };
    rewriteDiscoveryUrl(request);
    assert.equal(request.url, expected);
  }
});
