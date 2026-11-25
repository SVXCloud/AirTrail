import { appPath } from '$lib/app-path';
import { createTRPCSvelteServer } from 'trpc-svelte-query/server';

import { createContext } from './context';
import { appRouter } from './routes/_app';

export const trpcServer = createTRPCSvelteServer({
  endpoint: appPath('/api/trpc'),
  router: appRouter,
  createContext,
});
