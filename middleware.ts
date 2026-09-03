import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

export default createMiddleware(routing);

export const config = {
  // /admin lives outside the [locale] segment (its own root layout, no
  // i18n) — without excluding it here, next-intl redirects it to a
  // /en/admin/... path that doesn't exist, 404ing the whole admin route.
  matcher: ["/((?!api|admin|_next|_vercel|fonts|.*\\..*).*)"],
};
