// Only used by ui5 serve. The built index.html keeps its original CSP.
import type { IncomingMessage, ServerResponse } from 'node:http';

interface Resource { getString(): Promise<string>; }
interface MiddlewareOptions {
  resources: { rootProject: { byPath(path: string): Promise<Resource | null> } };
}
type Next = (error?: unknown) => void;

function devIndex({ resources }: MiddlewareOptions) {
  return async (req: IncomingMessage, res: ServerResponse, next: Next): Promise<void> => {
    if (!['/', '/index.html'].includes((req.url ?? '/').split('?')[0])) return next();
    try {
      const resource = await resources.rootProject.byPath('/index.html');
      if (!resource) return next();
      const html = (await resource.getString())
        .replace("script-src 'self';", "script-src 'self' 'unsafe-inline' 'unsafe-eval' http://localhost:35729;")
        .replace("connect-src 'self';", "connect-src 'self' ws://localhost:35729;");
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('Cache-Control', 'no-store');
      res.end(html);
    } catch (error) { next(error); }
  };
}
export = devIndex;
