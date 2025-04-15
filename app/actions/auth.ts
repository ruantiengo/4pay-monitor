"use server"

import { cookies } from "next/headers"

export async function login(username: string, password: string) {
  // Verificar credenciais
  if (username === "4pay" && password === "4pay") {
    // Definir cookie de autenticação
    const ck = await cookies();
    ck.set("isLoggedIn", "true", {
      httpOnly: true,
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 dias
      sameSite: "lax", // Alterado para lax para permitir redirecionamentos
    })

    ck.set("user", username, {
      httpOnly: true,
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 dias
      sameSite: "lax", // Alterado para lax para permitir redirecionamentos
    })

    return { success: true }
  }

  return { success: false, error: "Usuário ou senha inválidos" }
}

export async function logout() {
  const ck = await cookies();
  ck.delete("isLoggedIn")
  ck.delete("user")
  return { success: true }
}
