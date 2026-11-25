import { base } from '$app/paths';
import type { RequestHandler } from './$types';
import document from '$lib/api/v1/openapi.yaml?raw';
export const GET: RequestHandler = async () =>
  new Response(
    base
      ? document.replace(
          /^servers:\n[\s\S]*?(?=^security:)/m,
          `servers:\n  - url: '${base}'\n`,
        )
      : document,
    {
      headers: {
        'Content-Type': 'application/yaml; charset=utf-8',
        'Cache-Control': 'public, max-age=300',
      },
    },
  );
