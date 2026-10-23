import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export async function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname;

  const isAdminRoute = path.startsWith("/admin");
  const isDashboardRoute = path.startsWith("/kundenportal");
  const isPanelRoute = path === "/panel" || path.startsWith("/panel/");

  if (!isAdminRoute && !isDashboardRoute && !isPanelRoute) {
    return NextResponse.next();
  }

  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (!token) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const role = token.role as string;

  // /panel → redirect to admin panel or kundenportal based on role
  if (isPanelRoute) {
    if (role === "CUSTOMER") {
      return NextResponse.redirect(new URL("/kundenportal", req.url));
    }
    return NextResponse.redirect(new URL("/admin/orders", req.url));
  }

  // Customers can only access kundenportal
  if (isAdminRoute && role === "CUSTOMER") {
    return NextResponse.redirect(new URL("/kundenportal", req.url));
  }

  // Non-customers cannot access kundenportal (redirect to admin panel)
  if (isDashboardRoute && role !== "CUSTOMER") {
    return NextResponse.redirect(new URL("/admin/orders", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/kundenportal/:path*", "/panel", "/panel/:path*"],
};
