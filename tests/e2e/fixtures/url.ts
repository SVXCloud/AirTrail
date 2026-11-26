import { basePath } from '../../../scripts/subpath/base-path.js';

export const isPathname = (pathname: string) => {
  return (url: URL) => url.pathname === basePath + pathname;
};
