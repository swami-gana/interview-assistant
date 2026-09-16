import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import { isAllowedEmail } from "@/lib/allowlist";

export default withAuth(
  function middleware(req) {
    const email = req.nextauth.token?.email as string | undefined;
    const path = req.nextUrl.pathname;

    if (path.startsWith("/api")) {
      if (!email || !isAllowedEmail(email)) {
        return new NextResponse(null, { status: 401 });
      }
      return NextResponse.next();
    }

    if (path === "/signin" || path === "/no-access") {
      return NextResponse.next();
    }

    if (!email) {
      return NextResponse.redirect(new URL("/signin", req.url));
    }

    if (!isAllowedEmail(email)) {
      return NextResponse.redirect(new URL("/no-access", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const path = req.nextUrl.pathname;
        if (path === "/signin" || path === "/no-access") return true;
        return Boolean(token);
      },
    },
  }
);

export const config = {
  matcher: [
    "/queue",
    "/candidate/:path*",
    "/snapshots/:path*",
    "/api/:path*",
  ],
};
