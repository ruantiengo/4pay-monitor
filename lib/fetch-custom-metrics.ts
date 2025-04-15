// Removemos a importação do AWS SDK
// import { CloudWatch } from "@aws-sdk/client-cloudwatch"

// Função para simular a obtenção de métricas de serviço
export async function getServiceMetrics(
  serviceName: string,
  metricName: string,
  period = 300, // 5 minutos
  timeRange = 3600000, // 1 hora
) {
  try {
    // Em um ambiente real, você usaria o AWS SDK para obter métricas
    // Aqui estamos simulando dados para evitar dependências externas

    // Gerar valores aleatórios para simular métricas
    const count = Math.floor(timeRange / period)
    const values = Array.from({ length: count }, () => Math.random() * 100)
    const timestamps = Array.from({ length: count }, (_, i) => new Date(Date.now() - timeRange + i * period))

    return {
      values,
      timestamps,
    }
  } catch (error) {
    console.error(`Erro ao buscar métricas para ${serviceName}/${metricName}:`, error)
    return { values: [], timestamps: [] }
  }
}

export async function getAllServicesMetric(metricName: string, period = 300, timeRange = 3600000) {
  const services = ["CBA", "CBG", "CBC", "CBS", "FPS"]
  const results: Record<string, { values: number[]; timestamps: Date[] }> = {}

  await Promise.all(
    services.map(async (service) => {
      results[service] = await getServiceMetrics(service, metricName, period, timeRange)
    }),
  )

  return results
}
