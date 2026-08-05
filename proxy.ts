import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

export default createMiddleware(routing);

export const config = {
  // On applique le middleware à toutes les routes sauf les fichiers statiques,
  // les assets Next.js et les routes API.
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
