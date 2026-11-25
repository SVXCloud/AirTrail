import { appPath, cookiePath } from '$lib/app-path';
import { error, redirect } from '@sveltejs/kit';

import type { RequestHandler } from './$types';

import { lucia } from '$lib/server/auth';

export const POST: RequestHandler = async (event) => {
  if (!event.locals.session) {
    return error(401, 'Unauthorized');
  }

  await lucia.invalidateSession(event.locals.session.id);

  const sessionCookie = lucia.createBlankSessionCookie();
  event.cookies.set(sessionCookie.name, sessionCookie.value, {
    ...sessionCookie.attributes,
    path: cookiePath,
  });

  redirect(302, appPath('/login'));
};
