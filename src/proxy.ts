// Next.js 16 renamed `middleware.ts` to `proxy.ts` (same behavior, new file/export name).
// See: https://nextjs.org/docs/app/api-reference/file-conventions/proxy
import { withAuth } from "next-auth/middleware";

export default withAuth;

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/contacts/:path*",
    "/pipeline/:path*",
    "/tasks/:path*",
    "/quotes/:path*",
    "/settings/:path*",
    "/ex/:path*",
  ],
};
