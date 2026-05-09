import NextAuth from "next-auth";
import authConfig from "@/auth.config";

const { auth } = NextAuth(authConfig);

const WRITE_METHODS = new Set(["POST", "DELETE"]);

function isWriteProtectedApiRoute(pathname: string, method: string) {
  if (!WRITE_METHODS.has(method)) return false;

  if (pathname === "/api/posts" && method === "POST") return true;
  if (/^\/api\/posts\/[^/]+\/like$/.test(pathname)) return true;
  if (/^\/api\/users\/[^/]+\/follow$/.test(pathname)) return true;

  return false;
}

export default auth((req) => {
  const pathname = req.nextUrl.pathname;
  const method = req.method.toUpperCase();

  if (isWriteProtectedApiRoute(pathname, method) && !req.auth) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
});

export const config = {
  matcher: ["/api/posts", "/api/posts/:path*", "/api/users/:path*/follow"],
};
