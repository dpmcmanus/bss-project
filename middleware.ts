
import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"

export async function middleware(request: NextRequest) {
    /* Implement a redirecting middleware YOUR CODE HERE */

    const { pathname } = request.nextUrl;
    
    if (pathname.startsWith("/todos")) {
      const session = await auth.api.getSession({ headers: request.headers });
      
        // If there is no session, redirect to /auth/sign-in.
        if (!session) {
            const url = request.nextUrl.clone();
            url.pathname = "/auth/sign-in";
            return NextResponse.redirect(url);
        }
    }

    return NextResponse.next()
}

export const config = {
    runtime: "nodejs",
    matcher: ["/todos/:path*"]
}
