import type { Environment } from "@/contexts/environment-context"

export interface PodMetrics {
  name: string
  namespace: string
  cpu: {
    usage: number
    limit: number
    percentage: number
  }
  memory: {
    usage: number
    limit: number
    percentage: number
  }
}

export interface ServiceMetrics {
  name: string
  status: "online" | "degraded" | "offline"
  uptime: number
  responseTime: number
}

// Função para simular métricas de pods
export async function getPodsMetrics(namespace: string, environment: Environment): Promise<PodMetrics[]> {
  // Em um ambiente real, você usaria o cliente Kubernetes para obter métricas reais
  // Aqui estamos simulando dados para evitar dependências externas

  const services = ["cba", "cbg", "cbc", "cbs", "fps"]
  const pods: PodMetrics[] = []

  services.forEach((service) => {
    // Criar 2 pods para cada serviço
    for (let i = 1; i <= 2; i++) {
      const cpuPercentage = Math.random() * 70 + (environment === "PRODUCTION" ? 20 : 10)
      const memoryPercentage = Math.random() * 60 + (environment === "PRODUCTION" ? 30 : 15)

      pods.push({
        name: `${service}-pod-${i}`,
        namespace,
        cpu: {
          usage: Number(((cpuPercentage / 100) * 2).toFixed(2)),
          limit: 2,
          percentage: cpuPercentage,
        },
        memory: {
          usage: Math.round((memoryPercentage / 100) * 512),
          limit: 512,
          percentage: memoryPercentage,
        },
      })
    }
  })

  return pods
}

// Função para simular métricas de serviços
export async function getServiceMetrics(environment: Environment): Promise<ServiceMetrics[]> {
  const services = ["CBA", "CBG", "CBC", "CBS", "FPS"]

  return services.map((name) => {
    const uptime =
      Math.min(99.99, 95 + Math.random() * 5) *
      (environment === "PRODUCTION" ? 1 : environment === "HOMOLOG" ? 0.95 : 0.9)

    let status: "online" | "degraded" | "offline" = "online"
    if (uptime < 90) status = "offline"
    else if (uptime < 98) status = "degraded"

    return {
      name,
      status,
      uptime: Number(uptime.toFixed(2)),
      responseTime: Math.floor(100 + Math.random() * 200),
    }
  })
}
