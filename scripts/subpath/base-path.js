export const basePath = '/air';

// OAuth discovery inserts the issuer/resource path after the well-known name.
/**
 * @param {{ url?: string }} request
 */
export function rewriteDiscoveryUrl(request) {
  if (!request.url) return;
  const queryIndex = request.url.indexOf('?');
  const pathname =
    queryIndex === -1 ? request.url : request.url.slice(0, queryIndex);
  const search = queryIndex === -1 ? '' : request.url.slice(queryIndex);
  const issuer = '/.well-known/oauth-authorization-server';
  const resource = '/.well-known/oauth-protected-resource';

  if (pathname === issuer + basePath) {
    request.url = basePath + issuer + search;
  } else if (
    ['/api/v1', '/api/mcp'].some(
      (endpoint) => pathname === resource + basePath + endpoint,
    )
  ) {
    request.url =
      basePath +
      resource +
      pathname.slice((resource + basePath).length) +
      search;
  }
}
