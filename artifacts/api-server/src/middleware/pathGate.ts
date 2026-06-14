import type { Request, RequestHandler } from "express";

/** True when `req.path` equals `prefix` or is under `prefix/`. */
export function matchesPathPrefix(req: Request, prefix: string): boolean {
  const path = req.path;
  return path === prefix || path.startsWith(`${prefix}/`);
}

export function matchesAnyPathPrefix(req: Request, prefixes: readonly string[]): boolean {
  return prefixes.some((p) => matchesPathPrefix(req, p));
}

/**
 * Run middleware only for requests whose path matches one of the prefixes.
 * Other requests skip straight to the next layer (so feature gates do not
 * block unrelated modules — e.g. medicine upload when branches is disabled).
 */
export function onlyForPaths(prefixes: string | readonly string[], ...handlers: RequestHandler[]): RequestHandler {
  const list = (typeof prefixes === "string" ? [prefixes] : prefixes) as string[];
  return (req, res, next) => {
    if (!matchesAnyPathPrefix(req, list)) {
      next();
      return;
    }
    let i = 0;
    const run = (err?: unknown) => {
      if (err) {
        next(err);
        return;
      }
      const fn = handlers[i++];
      if (!fn) {
        next();
        return;
      }
      fn(req, res, run);
    };
    run();
  };
}
