"use server"

import { getMongoClient } from "@/lib/mongodb"
import { startOfDay, startOfWeek, startOfMonth, subDays, subWeeks, subMonths } from "date-fns"
import type { Environment } from "@/contexts/environment-context"

export interface TransactionStat {
  name: string
  value: number
  change: number
  changeType: "increase" | "decrease"
}

export async function getTransactionStats(environment: Environment, period: "today" | "week" | "month") {
  try {
    const client = await getMongoClient(environment)
    const db = client.db("connect_bank")
    
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

    // Consultar boletos gerados no período atual
    const boletosGerados = await db.collection("bankslips").countDocuments({
      created_at: { $gte: currentPeriodStart },
    })

    // Consultar boletos gerados no período anterior
    const boletosGeradosAnterior = await db.collection("bankslips").countDocuments({
      created_at: { $gte: previousPeriodStart, $lt: previousPeriodEnd },
    })

    // Consultar pagamentos processados no período atual
    const pagamentosProcessados = await db.collection("bankslips").countDocuments({
      created_at: { $gte: currentPeriodStart },
        status: 'approved'
    })

    // Consultar pagamentos processados no período anterior
    const pagamentosProcessadosAnterior = await db.collection("payments").countDocuments({
        created_at: { $gte: previousPeriodStart, $lt: previousPeriodEnd },
        status: 'approved'
    })

    // Consultar emails enviados automaticamente no período atual
    // Verificamos os documentos que têm pelo menos um email_log com email_sent: true
    const emailsEnviados = await db.collection("bankslips").countDocuments({
      created_at: { $gte: currentPeriodStart },
      email_logs: {
        $elemMatch: {
          email_sent: true,
        },
      },
    })


    const emailsEnviadosAnterior = await db.collection("bankslips").countDocuments({
      created_at: { $gte: previousPeriodStart, $lt: previousPeriodEnd },
      email_logs: {
        $elemMatch: {
          email_sent: true,
        },
      },
    })

  

   
    // Calcular variações percentuais
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

    const boletosVariacao = calcularVariacao(boletosGerados, boletosGeradosAnterior)
    const pagamentosVariacao = calcularVariacao(pagamentosProcessados, pagamentosProcessadosAnterior)
    const emailsVariacao = calcularVariacao(emailsEnviados, emailsEnviadosAnterior)
  
    // Montar resultado
    const stats: TransactionStat[] = [
      {
        name: "Boletos Gerados",
        value: boletosGerados,
        change: boletosVariacao.change,
        changeType: boletosVariacao.changeType,
      },
      {
        name: "Pagamentos Processados",
        value: pagamentosProcessados,
        change: pagamentosVariacao.change,
        changeType: pagamentosVariacao.changeType,
      },
      {
        name: "E-mails enviados automaticamente",
        value: emailsEnviados,
        change: emailsVariacao.change,
        changeType: emailsVariacao.changeType,
      },
   
    ]

    return { success: true, stats }
  } catch (error) {
    console.error(`Erro ao buscar estatísticas de transações (${environment}):`, error)

    // Dados simulados para fallback
    const mockData = {
      today: [
        { name: "Boletos Gerados", value: 118, change: 3, changeType: "increase" as const },
        { name: "Pagamentos Processados", value: 99, change: 1, changeType: "increase" as const },
        { name: "E-mails enviados automaticamente", value: 110, change: 2, changeType: "increase" as const },
        { name: "PDFs Gerados", value: 110, change: 4, changeType: "increase" as const },
      ],
      week: [
        { name: "Boletos Gerados", value: 825, change: 5, changeType: "increase" as const },
        { name: "Pagamentos Processados", value: 693, change: 2, changeType: "increase" as const },
        { name: "E-mails enviados automaticamente", value: 770, change: 3, changeType: "increase" as const },
        { name: "PDFs Gerados", value: 770, change: 6, changeType: "increase" as const },
      ],
      month: [
        { name: "Boletos Gerados", value: 3300, change: 7, changeType: "increase" as const },
        { name: "Pagamentos Processados", value: 2772, change: 4, changeType: "increase" as const },
        { name: "E-mails enviados automaticamente", value: 3080, change: 1, changeType: "decrease" as const },
        { name: "PDFs Gerados", value: 3080, change: 5, changeType: "increase" as const },
      ],
    }

    return { success: false, stats: mockData[period], error: String(error) }
  }
}
