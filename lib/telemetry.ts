import { getMongoClient } from "@/lib/mongodb"
import { startOfMonth, subMonths } from "date-fns"
import type { Environment } from "@/contexts/environment-context"

export interface ResponseTimeMetric {
  service: string
  endpoint: string
  duration: number
  timestamp: Date
  traceId?: string
  userId?: string
  success: boolean
}

export async function recordResponseTime(metric: ResponseTimeMetric, environment: Environment = "PRODUCTION") {
  try {
    const client = await getMongoClient(environment)
    const db = client.db("connect_bank")
    const metricsCollection = db.collection("response_metrics")

    await metricsCollection.insertOne({
      ...metric,
      timestamp: new Date(metric.timestamp),
    })

    return { success: true }
  } catch (error) {
    console.error(`Erro ao registrar métrica de tempo de resposta (${environment}):`, error)
    return { success: false, error: String(error) }
  }
}

export async function getAverageResponseTime(
  environment: Environment = "PRODUCTION",
  service?: string,
  period: "day" | "week" | "month" = "month",
) {
  try {
    const client = await getMongoClient(environment)
    const db = client.db("connect_bank")
    const metricsCollection = db.collection("response_metrics")

    // Determinar a data de início com base no período
    const now = new Date()
    let startDate: Date

    switch (period) {
      case "day":
        startDate = new Date(now)
        startDate.setHours(0, 0, 0, 0)
        break
      case "week":
        startDate = new Date(now)
        startDate.setDate(now.getDate() - 7)
        break
      case "month":
        startDate = startOfMonth(now)
        break
    }

    // Construir a consulta
    const query: {
      timestamp: { $gte: Date }
      success: boolean
      service?: string
    } = {
      timestamp: { $gte: startDate },
      success: true, // Considerar apenas chamadas bem-sucedidas
    }

    if (service) {
      query.service = service
    }

    // Executar a agregação para obter a média
    const pipeline = [
      { $match: query },
      {
        $group: {
          _id: "$service",
          averageTime: { $avg: "$duration" },
          count: { $sum: 1 },
        },
      },
    ]

    const results = await metricsCollection.aggregate(pipeline).toArray()

    // Calcular a média geral se nenhum serviço específico foi solicitado
    if (!service) {
      const totalTime = results.reduce((sum, item) => sum + item.averageTime * item.count, 0)
      const totalCount = results.reduce((sum, item) => sum + item.count, 0)
      const overallAverage = totalCount > 0 ? totalTime / totalCount : 0

      return {
        averageTime: Math.round(overallAverage),
        serviceBreakdown: results.map((item) => ({
          service: item._id,
          averageTime: Math.round(item.averageTime),
          count: item.count,
        })),
        success: true,
      }
    }

    // Retornar resultado para um serviço específico
    const serviceResult = results.find((item) => item._id === service)
    return {
      averageTime: serviceResult ? Math.round(serviceResult.averageTime) : 0,
      count: serviceResult ? serviceResult.count : 0,
      success: true,
    }
  } catch (error) {
    console.error(`Erro ao calcular tempo médio de resposta (${environment}):`, error)

    // Dados simulados diferentes para cada ambiente
    const mockData = {
      DEV: {
        averageTime: 180,
        serviceBreakdown: [
          { service: "CBA", averageTime: 150, count: 800 },
          { service: "CBG", averageTime: 210, count: 650 },
          { service: "CBC", averageTime: 120, count: 700 },
          { service: "CBS", averageTime: 250, count: 500 },
          { service: "FPS", averageTime: 170, count: 600 },
        ],
      },
      HOMOLOG: {
        averageTime: 140,
        serviceBreakdown: [
          { service: "CBA", averageTime: 130, count: 1100 },
          { service: "CBG", averageTime: 180, count: 950 },
          { service: "CBC", averageTime: 100, count: 900 },
          { service: "CBS", averageTime: 190, count: 650 },
          { service: "FPS", averageTime: 150, count: 800 },
        ],
      },
      PRODUCTION: {
        averageTime: 105,
        serviceBreakdown: [
          { service: "CBA", averageTime: 90, count: 1500 },
          { service: "CBG", averageTime: 130, count: 1200 },
          { service: "CBC", averageTime: 70, count: 1100 },
          { service: "CBS", averageTime: 150, count: 800 },
          { service: "FPS", averageTime: 110, count: 950 },
        ],
      },
    }

    return {
      ...mockData[environment],
      success: false,
      error: String(error),
    }
  }
}

export async function getResponseTimeComparison(environment: Environment = "PRODUCTION") {
  try {
    const client = await getMongoClient(environment)
    const db = client.db("connect_bank")
    const metricsCollection = db.collection("response_metrics")

    // Datas para os períodos de comparação
    const now = new Date()
    const currentMonthStart = startOfMonth(now)
    const lastMonthStart = startOfMonth(subMonths(now, 1))
    const twoMonthsAgoStart = startOfMonth(subMonths(now, 2))

    // Pipeline para o mês atual
    const currentMonthPipeline = [
      {
        $match: {
          timestamp: { $gte: currentMonthStart },
          success: true,
        },
      },
      {
        $group: {
          _id: null,
          averageTime: { $avg: "$duration" },
          count: { $sum: 1 },
        },
      },
    ]

    // Pipeline para o mês anterior
    const lastMonthPipeline = [
      {
        $match: {
          timestamp: { $gte: lastMonthStart, $lt: currentMonthStart },
          success: true,
        },
      },
      {
        $group: {
          _id: null,
          averageTime: { $avg: "$duration" },
          count: { $sum: 1 },
        },
      },
    ]

    // Pipeline para dois meses atrás
    const twoMonthsAgoPipeline = [
      {
        $match: {
          timestamp: { $gte: twoMonthsAgoStart, $lt: lastMonthStart },
          success: true,
        },
      },
      {
        $group: {
          _id: null,
          averageTime: { $avg: "$duration" },
          count: { $sum: 1 },
        },
      },
    ]

    // Executar as consultas
    const currentMonthResults = await metricsCollection.aggregate(currentMonthPipeline).toArray()
    const lastMonthResults = await metricsCollection.aggregate(lastMonthPipeline).toArray()
    const twoMonthsAgoResults = await metricsCollection.aggregate(twoMonthsAgoPipeline).toArray()

    // Extrair os valores
    const currentMonthAvg = currentMonthResults.length > 0 ? Math.round(currentMonthResults[0].averageTime) : 0
    const lastMonthAvg = lastMonthResults.length > 0 ? Math.round(lastMonthResults[0].averageTime) : 0
    const twoMonthsAgoAvg = twoMonthsAgoResults.length > 0 ? Math.round(twoMonthsAgoResults[0].averageTime) : 0

    // Calcular a diferença
    const difference = currentMonthAvg - lastMonthAvg

    // Determinar a tendência
    const trend = difference <= 0 ? "improvement" : "degradation"

    return {
      currentMonthAvg,
      lastMonthAvg,
      twoMonthsAgoAvg,
      difference,
      trend,
      success: true,
    }
  } catch (error) {
    console.error(`Erro ao comparar tempos de resposta (${environment}):`, error)

    // Dados simulados diferentes para cada ambiente
    const mockData = {
      DEV: {
        currentMonthAvg: 180,
        lastMonthAvg: 195,
        twoMonthsAgoAvg: 210,
        difference: -15,
        trend: "improvement",
      },
      HOMOLOG: {
        currentMonthAvg: 140,
        lastMonthAvg: 155,
        twoMonthsAgoAvg: 170,
        difference: -15,
        trend: "improvement",
      },
      PRODUCTION: {
        currentMonthAvg: 105,
        lastMonthAvg: 115,
        twoMonthsAgoAvg: 130,
        difference: -10,
        trend: "improvement",
      },
    }

    return {
      ...mockData[environment],
      success: false,
      error: String(error),
    }
  }
}
