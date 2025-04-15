import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  // Verificar se o usuário está autenticado
  const isLoggedIn = request.cookies.get("isLoggedIn")?.value === "true"
  const isLoginPage = request.nextUrl.pathname === "/"
  const isDashboardPage = request.nextUrl.pathname.startsWith("/dashboard")

  // Se estiver tentando acessar o dashboard sem estar logado
  if (isDashboardPage && !isLoggedIn) {
    return NextResponse.redirect(new URL("/", request.url))
  }

  // Se estiver logado e tentando acessar a página de login
  if (isLoginPage && isLoggedIn) {
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  // Para rotas de API, processar métricas
  if (request.nextUrl.pathname.startsWith("/api/")) {
    const startTime = Date.now()
    let service = "Unknown"

    if (request.nextUrl.pathname.includes("/api/cba")) {
      service = "CBA"
    } else if (request.nextUrl.pathname.includes("/api/cbg")) {
      service = "CBG"
    } else if (request.nextUrl.pathname.includes("/api/cbc")) {
      service = "CBC"
    } else if (request.nextUrl.pathname.includes("/api/cbs")) {
      service = "CBS"
    } else if (request.nextUrl.pathname.includes("/api/fps")) {
      service = "FPS"
    }

    const response = NextResponse.next()
    response.headers.append("X-Response-Time", `${Date.now() - startTime}ms`)

    if (service !== "Unknown") {
     
    }

    return response
  }

  return NextResponse.next()
}

// Configuração para aplicar o middleware apenas em rotas específicas
export const config = {
  matcher: ["/", "/dashboard/:path*", "/api/:path*"],
}
