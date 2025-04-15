import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function GET() {
  const ck = await cookies()
  const isLoggedIn = ck.get("isLoggedIn")?.value === "true"

  if (isLoggedIn) {
    return NextResponse.json({ authenticated: true })
  }

  return NextResponse.json({ authenticated: false, message: "Não autenticado" }, { status: 401 })
}
