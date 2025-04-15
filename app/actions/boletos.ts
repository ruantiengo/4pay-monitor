"use server"

import { startOfMonth, subMonths } from "date-fns"
import { getMongoClient } from "@/lib/mongodb"
import type { Environment } from "@/contexts/environment-context"

export async function getBoletoStats(environment: Environment) {
  try {
    const client = await getMongoClient(environment)
    const db = client.db("connect_bank")
    const boletosCollection = db.collection("bankslips")

    // Data atual e primeiro dia do mês atual
    const now = new Date()
    const firstDayCurrentMonth = startOfMonth(now)

    // Primeiro dia do mês anterior
    const firstDayLastMonth = startOfMonth(subMonths(now, 1))

    // Primeiro dia de dois meses atrás
    const firstDayTwoMonthsAgo = startOfMonth(subMonths(now, 2))

    // Total de boletos
    const totalBoletos = await boletosCollection.countDocuments()

    // Total de boletos criados no mês atual
    const boletosThisMonth = await boletosCollection.countDocuments({
      created_at: { $gte: firstDayCurrentMonth },
    })

    // Total de boletos criados no mês anterior
    const boletosLastMonth = await boletosCollection.countDocuments({
      created_at: {
        $gte: firstDayLastMonth,
        $lt: firstDayCurrentMonth,
      },
    })

    // Total de boletos criados dois meses atrás
    const boletosTwoMonthsAgo = await boletosCollection.countDocuments({
      created_at: {
        $gte: firstDayTwoMonthsAgo,
        $lt: firstDayLastMonth,
      },
    })

    // Calcular a variação percentual
    let percentChange = 0
    if (boletosLastMonth > 0) {
      percentChange = ((boletosThisMonth - boletosLastMonth) / boletosLastMonth) * 100
    }

    // Formatar a variação percentual com uma casa decimal
    const formattedPercentChange = percentChange.toFixed(1)

    // Determinar se é aumento ou diminuição
    const changeType = percentChange >= 0 ? "increase" : "decrease"

    return {
      totalBoletos,
      boletosThisMonth,
      boletosLastMonth,
      boletosTwoMonthsAgo,
      percentChange: Number(formattedPercentChange),
      changeType,
      success: true,
    }
  } catch (error) {
    console.error(`Erro ao buscar estatísticas de boletos (${environment}):`, error)

    // Dados simulados diferentes para cada ambiente
    const mockData = {
      DEV: {
        totalBoletos: 1248,
        boletosThisMonth: 320,
        boletosLastMonth: 380,
        boletosTwoMonthsAgo: 290,
        percentChange: -15.8,
        changeType: "decrease",
      },
      HOMOLOG: {
        totalBoletos: 1876,
        boletosThisMonth: 450,
        boletosLastMonth: 420,
        boletosTwoMonthsAgo: 380,
        percentChange: 7.1,
        changeType: "increase",
      },
      PRODUCTION: {
        totalBoletos: 2453,
        boletosThisMonth: 520,
        boletosLastMonth: 850,
        boletosTwoMonthsAgo: 780,
        percentChange: -38.8,
        changeType: "decrease",
      },
    }

    return {
      ...mockData[environment],
      success: false,
      error: String(error),
    }
  }
}

export async function getBoletoSuccessRate(environment: Environment) {
  try {
    console.log(environment);
    
    const client = await getMongoClient(environment)
    const db = client.db("connect_bank")
    const boletosCollection = db.collection("bankslips")

    // Total de boletos
    const totalBoletos = await boletosCollection.countDocuments()

    // Total de boletos com falha na criação
    const failedBoletos = await boletosCollection.countDocuments({
      status: "creation_failed",
    })

    // Boletos criados com sucesso (todos exceto os que falharam)
    const successfulBoletos = totalBoletos - failedBoletos

    // Calcular a taxa de sucesso
    const successRate = totalBoletos > 0 ? (successfulBoletos / totalBoletos) * 100 : 0

    // Dados do mês anterior para comparação
    const now = new Date()
    const firstDayCurrentMonth = startOfMonth(now)
    const firstDayLastMonth = startOfMonth(subMonths(now, 1))

    // Total de boletos do mês anterior
    const totalBoletosLastMonth = await boletosCollection.countDocuments({
      created_at: {
        $gte: firstDayLastMonth,
        $lt: firstDayCurrentMonth,
      },
    })

    // Total de boletos com falha do mês anterior
    const failedBoletosLastMonth = await boletosCollection.countDocuments({
      created_at: {
        $gte: firstDayLastMonth,
        $lt: firstDayCurrentMonth,
      },
      status: "creation_failed",
    })

    // Boletos criados com sucesso no mês anterior
    const successfulBoletosLastMonth = totalBoletosLastMonth - failedBoletosLastMonth

    // Taxa de sucesso do mês anterior
    const successRateLastMonth =
      totalBoletosLastMonth > 0 ? (successfulBoletosLastMonth / totalBoletosLastMonth) * 100 : 0

    // Calcular a variação percentual
    let percentChange = 0
    if (successRateLastMonth > 0) {
      percentChange = successRate - successRateLastMonth
    }

    // Determinar se é aumento ou diminuição
    const changeType = percentChange >= 0 ? "increase" : "decrease"

    return {
      totalBoletos,
      successfulBoletos,
      failedBoletos,
      successRate: Number(successRate.toFixed(1)),
      successRateLastMonth: Number(successRateLastMonth.toFixed(1)),
      percentChange: Number(percentChange.toFixed(1)),
      changeType,
      success: true,
    }
  } catch (error) {
    console.error(`Erro ao calcular taxa de sucesso dos boletos (${environment}):`, error)

    // Dados simulados diferentes para cada ambiente
    const mockData = {
      DEV: {
        totalBoletos: 1248,
        successfulBoletos: 1230,
        failedBoletos: 18,
        successRate: 98.6,
        successRateLastMonth: 97.2,
        percentChange: 1.4,
        changeType: "increase",
      },
      HOMOLOG: {
        totalBoletos: 1876,
        successfulBoletos: 1850,
        failedBoletos: 26,
        successRate: 98.6,
        successRateLastMonth: 98.1,
        percentChange: 0.5,
        changeType: "increase",
      },
      PRODUCTION: {
        totalBoletos: 2453,
        successfulBoletos: 2445,
        failedBoletos: 8,
        successRate: 99.7,
        successRateLastMonth: 50.0,
        percentChange: 49.7,
        changeType: "increase",
      },
    }

    return {
      ...mockData[environment],
      success: false,
      error: String(error),
    }
  }
}
