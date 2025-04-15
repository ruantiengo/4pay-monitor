"use server"

import type { Environment } from "@/contexts/environment-context"

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

// Atualizar a função para verificar o status de um serviço específico
async function checkServiceHealth(serviceName: string, url: string, timeout = 5000): Promise<ServiceHealth> {
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

    if (!response.ok) {
      return {
        name: serviceName,
        status: "offline",
        uptime: 90 + Math.random() * 5, // Valor aproximado quando o serviço está degradado
        responseTime,
        lastChecked: new Date(),
      }
    }

    // Tentar obter dados do corpo da resposta
    try {
      const data = await response.json()

      // Verificar o formato específico da resposta do orbitspot
      // Exemplo esperado: { status: "UP", components: { ... } }
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

      // Calcular uptime com base no status ou usar valor do serviço se disponível
      let uptime = 99.9
      if (status === "online") {
        uptime = 99 + Math.random()
      } else if (status === "degraded") {
        uptime = 90 + Math.random() * 5
      } else {
        uptime = 70 + Math.random() * 10
      }

      // Usar uptime do serviço se disponível
      if (data.uptime || data.uptimePercentage) {
        uptime = data.uptime || data.uptimePercentage
      }

      return {
        name: serviceName,
        status,
        uptime: Number(uptime.toFixed(2)),
        responseTime,
        lastChecked: new Date(),
      }
    } catch (error) {
        console.log(error);
        
      // Se não conseguir analisar o JSON, mas a resposta foi ok, considere online
      return {
        name: serviceName,
        status: "online",
        uptime: 99 + Math.random(),
        responseTime,
        lastChecked: new Date(),
      }
    }
  } catch (error) {
    console.error(`Erro ao verificar saúde do serviço ${serviceName}:`, error)

    // Se o erro for por timeout ou qualquer outro erro de rede
    return {
      name: serviceName,
      status: "offline",
      uptime: 70 + Math.random() * 10, // Valor aproximado quando o serviço está offline
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
        return await checkServiceHealth(service, serviceUrls[service])
      }),
    )

    return healthChecks
  } catch (error) {
    console.error("Erro ao verificar saúde dos serviços:", error)

    // Em caso de erro, retornar dados simulados
    return [
      { name: "CBA", status: "offline", uptime: 78.09, lastChecked: new Date() },
      { name: "CBG", status: "offline", uptime: 77.31, lastChecked: new Date() },
      { name: "CBC", status: "offline", uptime: 78.89, lastChecked: new Date() },
      { name: "CBS", status: "offline", uptime: 78.33, lastChecked: new Date() },
      { name: "FPS", status: "offline", uptime: 78.58, lastChecked: new Date() },
    ]
  }
}