"use server"


import { startOfDay, startOfWeek, startOfMonth, subDays, subWeeks, subMonths } from "date-fns"
import type { Environment } from "@/contexts/environment-context"
import { getMongoClient } from "@/lib/mongodb"

export async function getFailedEmailsStats(environment: Environment, period: "today" | "week" | "month") {
  try {
    const client = await getMongoClient(environment)
    const db = client.db("connect_bank")
    // Definir períodos de tempo
    const now = new Date()
    let currentPeriodStart: Date
    let previousPeriodStart: Date
    let previousPeriodEnd: Date

    switch (period) {
      case "today":
        currentPeriodStart = startOfDay(now)
        previousPeriodStart = startOfDay(subDays(now, 1))
        previousPeriodEnd = currentPeriodStart
        break
      case "week":
        currentPeriodStart = startOfWeek(now, { weekStartsOn: 1 }) // Semana começa na segunda
        previousPeriodStart = startOfWeek(subWeeks(now, 1), { weekStartsOn: 1 })
        previousPeriodEnd = currentPeriodStart
        break
      case "month":
        currentPeriodStart = startOfMonth(now)
        previousPeriodStart = startOfMonth(subMonths(now, 1))
        previousPeriodEnd = currentPeriodStart
        break
    }

    // Consultar boletos que deveriam ter enviado email mas não enviaram
    // Assumimos que todos os boletos deveriam ter email, então contamos os que têm email_logs vazio
    const emailsFalhados = await db.collection("bankslips").countDocuments({
      created_at: { $gte: currentPeriodStart },
      email_logs: { $eq: [] }, // Array vazio
    })

    // Consultar emails que falharam no período anterior
    const emailsFalhadosAnterior = await db.collection("bankslips").countDocuments({
      created_at: { $gte: previousPeriodStart, $lt: previousPeriodEnd },
      email_logs: { $eq: [] }, // Array vazio
    })

    // Calcular variação percentual
    const calcularVariacao = (
      atual: number,
      anterior: number,
    ): { change: number; changeType: "increase" | "decrease" } => {
      if (anterior === 0) return { change: 0, changeType: "increase" }

      const variacao = ((atual - anterior) / anterior) * 100
      return {
        change: Math.abs(Math.round(variacao)),
        changeType: variacao >= 0 ? "increase" : "decrease",
      }
    }

    const emailsFalhadosVariacao = calcularVariacao(emailsFalhados, emailsFalhadosAnterior)

    return {
      success: true,
      failedEmails: emailsFalhados,
      change: emailsFalhadosVariacao.change,
      changeType: emailsFalhadosVariacao.changeType,
    }
  } catch (error) {
    console.error(`Erro ao buscar estatísticas de emails falhados (${environment}):`, error)
    return {
      success: false,
      failedEmails: 0,
      change: 0,
      changeType: "increase" as const,
      error: String(error),
    }
  }
}
