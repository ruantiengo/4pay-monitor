import type { Environment } from "@/contexts/environment-context"

// Removemos a importação do @kubernetes/client-node que estava causando problemas
// import * as k8s from "@kubernetes/client-node"

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

// Simulação de métricas de pods
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

// Simulação de métricas de serviços
export async function getServiceMetrics(environment: Environment): Promise<ServiceMetrics[]> {
  // Mapeamento de serviços para pods/deployments
  // Podemos ter diferentes namespaces e deployments para diferentes ambientes
  const serviceMapping = {
    DEV: {
      CBA: { namespace: "dev", deployment: "cba-deployment-dev" },
      CBG: { namespace: "dev", deployment: "cbg-deployment-dev" },
      CBC: { namespace: "dev", deployment: "cbc-deployment-dev" },
      CBS: { namespace: "dev", deployment: "cbs-deployment-dev" },
      FPS: { namespace: "dev", deployment: "fps-deployment-dev" },
    },
    HOMOLOG: {
      CBA: { namespace: "homolog", deployment: "cba-deployment-hml" },
      CBG: { namespace: "homolog", deployment: "cbg-deployment-hml" },
      CBC: { namespace: "homolog", deployment: "cbc-deployment-hml" },
      CBS: { namespace: "homolog", deployment: "cbs-deployment-hml" },
      FPS: { namespace: "homolog", deployment: "fps-deployment-hml" },
    },
    PRODUCTION: {
      CBA: { namespace: "default", deployment: "cba-deployment" },
      CBG: { namespace: "default", deployment: "cbg-deployment" },
      CBC: { namespace: "default", deployment: "cbc-deployment" },
      CBS: { namespace: "default", deployment: "cbs-deployment" },
      FPS: { namespace: "default", deployment: "fps-deployment" },
    },
  }

  const servicesMetrics: ServiceMetrics[] = []

  for (const [serviceName] of Object.entries(serviceMapping[environment])) {
    // Simular status do deployment
    const uptime = Math.min(99.99, 95 + Math.random() * 5)

    // Determinar status do serviço
    let serviceStatus: "online" | "degraded" | "offline" = "online"
    if (uptime < 90) {
      serviceStatus = "offline"
    } else if (uptime < 98) {
      serviceStatus = "degraded"
    }

    // Simular tempo de resposta
    const responseTime = Math.floor(Math.random() * 200) + 50

    servicesMetrics.push({
      name: serviceName,
      status: serviceStatus,
      uptime: Number(uptime.toFixed(2)),
      responseTime,
    })
  }

  return servicesMetrics
}
