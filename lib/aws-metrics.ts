import type { Environment } from "@/contexts/environment-context"

// Removemos a importação do AWS SDK
// import { CloudWatch } from "@aws-sdk/client-cloudwatch"

export interface ResourceMetric {
  name: string
  usage: number
  total: number
  unit: string
}

// Função para simular métricas de EC2
export async function getEC2Metrics(instanceId: string, environment: Environment): Promise<ResourceMetric[]> {
  try {
    // Em um ambiente real, você usaria o AWS SDK para obter métricas
    // Aqui estamos simulando dados para evitar dependências externas

    // Gerar valores aleatórios com base no ambiente
    const multiplier = environment === "PRODUCTION" ? 1 : environment === "HOMOLOG" ? 0.7 : 0.4

    const cpuValue = Math.round(35 * multiplier + Math.random() * 20)
    const memoryValue = Math.round(45 * multiplier + Math.random() * 15)

    return [
      {
        name: "CPU",
        usage: Number.parseFloat(cpuValue.toFixed(1)),
        total: 100,
        unit: "%",
      },
      {
        name: "Memória",
        usage: Number.parseFloat(memoryValue.toFixed(1)),
        total: 100,
        unit: "%",
      },
    ]
  } catch (error) {
    console.error(`Erro ao obter métricas da AWS (${environment}):`, error)
    return []
  }
}
