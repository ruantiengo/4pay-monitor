"use server"

import type { Environment } from "@/contexts/environment-context"
import { getMongoClient } from "@/lib/mongodb"
import { differenceInHours, startOfMonth } from "date-fns"

export interface ServiceHealth {
  name: string
  status: "online" | "degraded" | "offline"
  uptime: number
  responseTime?: number
  lastChecked: Date
}

// Atualizar o mapeamento de URLs dos serviços por ambiente
const SERVICE_URLS = {
  DEV: {
    CBA: "https://ingress.dev.orbitspot.com/cba-service/health",
    CBG: "https://ingress.dev.orbitspot.com/cbg-service/health",
    CBC: "https://ingress.dev.orbitspot.com/cbc-service/health",
    CBS: "https://ingress.dev.orbitspot.com/cbs-service/health",
    FPS: "https://ingress.dev.orbitspot.com/fast-pdf-service/health",
  },
  HOMOLOG: {
    CBA: "https://ingress.hom.orbitspot.com/cba-service/health",
    CBG: "https://ingress.hom.orbitspot.com/cbg-service/health",
    CBC: "https://ingress.hom.orbitspot.com/cbc-service/health",
    CBS: "https://ingress.hom.orbitspot.com/cbs-service/health",
    FPS: "https://ingress.hom.orbitspot.com/fast-pdf-service/health",
  },
  PRODUCTION: {
    CBA: "https://ingress.orbitspot.com/cba-service/health",
    CBG: "https://ingress.orbitspot.com/cbg-service/health",
    CBC: "https://ingress.orbitspot.com/cbc-service/health",
    CBS: "https://ingress.orbitspot.com/cbs-service/health",
    FPS: "https://orbitspot.com/fast-pdf-service/health",
  },
}

// Função para calcular a disponibilidade com base nos incidentes
async function calculateServiceAvailability(environment: Environment, serviceName: string): Promise<number> {
  try {
    const client = await getMongoClient(environment)
    const db = client.db("connect_bank")
    const incidentsCollection = db.collection("accidents")

    // Buscar incidentes que afetaram este serviço específico
    const incidentsData = await incidentsCollection
      .find({
        affected_services: serviceName,
        // Considerar apenas incidentes do mês atual
        start_date: { $gte: startOfMonth(new Date()) },
      })
      .toArray()

    // Calcular o total de horas desde o início do mês até agora
    const now = new Date()
    const currentDay = now.getDate()
    const totalHoursInCurrentMonth = currentDay * 24

    // Calcular o total de horas de indisponibilidade
    let downtimeHours = 0

    incidentsData.forEach((incident) => {
      const incidentStart = new Date(incident.start_date)
      const incidentEnd = incident.end_date ? new Date(incident.end_date) : now

      // Calcular a duração do incidente em horas
      downtimeHours += differenceInHours(incidentEnd, incidentStart)
    })

    // Calcular a disponibilidade como porcentagem
    // Fórmula: (total de horas - horas de indisponibilidade) / total de horas * 100
    const availabilityPercentage = ((totalHoursInCurrentMonth - downtimeHours) / totalHoursInCurrentMonth) * 100

    // Garantir que o valor esteja entre 0 e 100
    return Math.max(0, Math.min(100, availabilityPercentage))
  } catch (error) {
    console.error(`Erro ao calcular disponibilidade para ${serviceName}:`, error)
    return 100 // Em caso de erro, assumir 100% de disponibilidade
  }
}

// Atualizar a função para verificar o status de um serviço específico
async function checkServiceHealth(
  environment: Environment,
  serviceName: string,
  url: string,
  timeout = 5000,
): Promise<ServiceHealth> {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)

    const startTime = Date.now()
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      cache: "no-store",
      signal: controller.signal,
    })
    const endTime = Date.now()
    clearTimeout(timeoutId)

    const responseTime = endTime - startTime

    // Calcular a disponibilidade real com base nos incidentes
    const uptime = await calculateServiceAvailability(environment, serviceName)

    if (!response.ok) {
      return {
        name: serviceName,
        status: "offline",
        uptime: Number(uptime.toFixed(2)),
        responseTime,
        lastChecked: new Date(),
      }
    }

    // Tentar obter dados do corpo da resposta
    try {
      const data = await response.json()

      // Verificar o formato específico da resposta do orbitspot
      let status: "online" | "degraded" | "offline" = "online"

      if (data.status) {
        if (data.status === "UP" || data.status === "up" || data.status === "online" || data.status === "healthy") {
          status = "online"
        } else if (
          data.status === "DOWN" ||
          data.status === "down" ||
          data.status === "offline" ||
          data.status === "unhealthy"
        ) {
          status = "offline"
        } else {
          status = "degraded"
        }
      }

      return {
        name: serviceName,
        status,
        uptime: Number(uptime.toFixed(2)),
        responseTime,
        lastChecked: new Date(),
      }
    } catch (error) {
      console.log(error)

      // Se não conseguir analisar o JSON, mas a resposta foi ok, considere online
      return {
        name: serviceName,
        status: "online",
        uptime: Number(uptime.toFixed(2)),
        responseTime,
        lastChecked: new Date(),
      }
    }
  } catch (error) {
    console.error(`Erro ao verificar saúde do serviço ${serviceName}:`, error)

    // Calcular a disponibilidade real mesmo em caso de erro de conexão
    const uptime = await calculateServiceAvailability(environment, serviceName)

    // Se o erro for por timeout ou qualquer outro erro de rede
    return {
      name: serviceName,
      status: "offline",
      uptime: Number(uptime.toFixed(2)),
      lastChecked: new Date(),
    }
  }
}

// Função principal para verificar todos os serviços
export async function checkServicesHealth(environment: Environment): Promise<ServiceHealth[]> {
  try {
    const serviceUrls = SERVICE_URLS[environment]
    const services = Object.keys(serviceUrls) as Array<keyof typeof serviceUrls>

    const healthChecks = await Promise.all(
      services.map(async (service) => {
        return await checkServiceHealth(environment, service, serviceUrls[service])
      }),
    )

    return healthChecks
  } catch (error) {
    console.error("Erro ao verificar saúde dos serviços:", error)

    // Em caso de erro, tentar pelo menos calcular a disponibilidade real
    try {
      const services = ["CBA", "CBG", "CBC", "CBS", "FPS"]
      const fallbackHealthChecks = await Promise.all(
        services.map(async (service) => {
          const uptime = await calculateServiceAvailability(environment, service)
          return {
            name: service,
            status: "offline" as const,
            uptime: Number(uptime.toFixed(2)),
            lastChecked: new Date(),
          }
        }),
      )
      return fallbackHealthChecks
    } catch (innerError) {
      console.error("Erro ao calcular disponibilidade de fallback:", innerError)

      // Se tudo falhar, retornar dados simulados
      return [
        { name: "CBA", status: "offline", uptime: 0, lastChecked: new Date() },
        { name: "CBG", status: "offline", uptime: 0, lastChecked: new Date() },
        { name: "CBC", status: "offline", uptime: 0, lastChecked: new Date() },
        { name: "CBS", status: "offline", uptime: 0, lastChecked: new Date() },
        { name: "FPS", status: "offline", uptime: 0, lastChecked: new Date() },
      ]
    }
  }
}

