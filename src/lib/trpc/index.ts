import { appPath } from '$lib/app-path';
import { createTRPCClient, httpBatchLink } from '@trpc/client';
import { createTRPCSvelte } from 'trpc-svelte-query';

import { transformer } from './transformer';

import type { AppRouter } from '$lib/server/routes/_app';

export const trpc = createTRPCSvelte<AppRouter>({
  links: [
    httpBatchLink({
      url: appPath('/api/trpc'),
      transformer,
    }),
  ],
});

export const api = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url: appPath('/api/trpc'),
      transformer,
    }),
  ],
});
