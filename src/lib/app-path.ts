import { base } from '$app/paths';

export const appPath = (path: `/${string}`) => `${base}${path}`;
export const cookiePath = base || '/';

export const appRelativePath = (pathname: string) =>
  base && (pathname === base || pathname.startsWith(`${base}/`))
    ? pathname.slice(base.length) || '/'
    : pathname;
