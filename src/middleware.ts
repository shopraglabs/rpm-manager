import { NextResponse, type NextRequest } from "next/server"
import { createServerClient } from "@supabase/ssr"

// Routes that don't require authentication
const PUBLIC_ROUTES = ["/login", "/signup", "/forgot-password", "/reset-password"]
const PUBLIC_PREFIXES = ["/customer-portal/", "/api/webhooks/"]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow public routes and API webhooks without auth
  const isPublic =
    PUBLIC_ROUTES.includes(pathname) ||
    PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix))

  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Validate session (this also refreshes expired tokens)
  const { data: { user } } = await supabase.auth.getUser()

  if (isPublic) {
    // Redirect authenticated users away from auth pages
    if (user && PUBLIC_ROUTES.includes(pathname)) {
      return NextResponse.redirect(new URL("/", request.url))
    }
    return response
  }

  // Redirect unauthenticated users to login
  if (!user) {
    const loginUrl = new URL("/login", request.url)
    loginUrl.searchParams.set("redirectTo", pathname)
    return NextResponse.redirect(loginUrl)
  }

  return response
}

export const config = {
  matcher: [
    // Match all routes except Next.js internals and static files
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
