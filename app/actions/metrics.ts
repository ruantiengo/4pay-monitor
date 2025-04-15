"use server"

import { getEC2Metrics } from "@/lib/aws-metrics"
import { getPodsMetrics, getServiceMetrics } from "@/lib/k8s"
import type { Environment } from "@/contexts/environment-context"

export async function fetchSystemResources(environment: Environment) {
  // Obter métricas de instâncias EC2 (substitua com seus IDs reais)
  // Podemos ter diferentes IDs de instância para diferentes ambientes
  const ec2Instances = {
    DEV: ["i-dev12345678", "i-dev87654321"],
    HOMOLOG: ["i-hml12345678", "i-hml87654321"],
    PRODUCTION: ["i-1234567890abcdef0", "i-0987654321fedcba0"],
  }

  try {
    let allMetrics: any = []

    // Em produção, tente buscar métricas reais
    if (process.env.NODE_ENV === "production") {
      for (const instanceId of ec2Instances[environment]) {
        const metrics = await getEC2Metrics(instanceId, environment)
        allMetrics = [...allMetrics, ...metrics]
      }
    }

    // Se não temos métricas (desenvolvimento ou erro), use dados simulados
    if (allMetrics.length === 0) {
      // Simular métricas de CPU e memória
      allMetrics = [
        {
          name: "CPU",
          usage: Math.round(35 + Math.random() * 20),
          total: 100,
          unit: "%",
        },
        {
          name: "Memória",
          usage: Math.round(45 + Math.random() * 15),
          total: 100,
          unit: "%",
        },
      ]
    }

    // Adicionar métricas de disco e banco de dados (exemplo)
    // Podemos ter diferentes valores para diferentes ambientes
    const diskUsage = {
      DEV: 50,
      HOMOLOG: 75,
      PRODUCTION: 128,
    }

    const dbUsage = {
      DEV: 30,
      HOMOLOG: 45,
      PRODUCTION: 65,
    }

    allMetrics.push({
      name: "Disco",
      usage: diskUsage[environment],
      total: 512,
      unit: "GB",
    })

    allMetrics.push({
      name: "Banco de Dados",
      usage: dbUsage[environment],
      total: 100,
      unit: "%",
    })

    return allMetrics
  } catch (error) {
    console.error(`Erro ao buscar recursos do sistema (${environment}):`, error)

    // Retornar dados simulados em caso de erro
    return [
      {
        name: "CPU",
        usage: Math.round(35 + Math.random() * 20),
        total: 100,
        unit: "%",
      },
      {
        name: "Memória",
        usage: Math.round(45 + Math.random() * 15),
        total: 100,
        unit: "%",
      },
      {
        name: "Disco",
        usage: Math.round(50 + Math.random() * 30),
        total: 512,
        unit: "GB",
      },
      {
        name: "Banco de Dados",
        usage: Math.round(30 + Math.random() * 20),
        total: 100,
        unit: "%",
      },
    ]
  }
}

export async function fetchServiceStatus(environment: Environment) {
  try {
    return await getServiceMetrics(environment)
  } catch (error) {
    console.error(`Erro ao buscar status dos serviços (${environment}):`, error)

    // Retornar dados simulados em caso de erro
    const services = ["CBA", "CBG", "CBC", "CBS", "FPS"]

    return services.map((name) => {
      const uptime = Math.min(99.99, 95 + Math.random() * 5)

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
}


export async function fetchResponseTimeMetrics() {
  // Mocked response time metrics
  return Promise.resolve({
    currentAvg: Math.round(100 + Math.random() * 50), // Current average response time in ms
    lastMonthAvg: Math.round(120 + Math.random() * 40), // Last month's average response time in ms
    difference: Math.round(Math.random() * 20 - 10), // Difference in ms
    trend: Math.random() > 0.5 ? "increase" : "decrease", // Trend: increase or decrease
    serviceBreakdown: [
      {
        service: "Service A",
        responseTime: Math.round(100 + Math.random() * 50),
      },
      {
        service: "Service B",
        responseTime: Math.round(120 + Math.random() * 40),
      },
      {
        service: "Service C",
        responseTime: Math.round(90 + Math.random() * 30),
      },
    ],
    success: true
  })

}

export async function fetchPodsMetrics(environment: Environment) {
  try {
    // Podemos ter diferentes namespaces para diferentes ambientes
    const namespaces = {
      DEV: ["dev", "monitoring-dev"],
      HOMOLOG: ["homolog", "monitoring-homolog"],
      PRODUCTION: ["default", "monitoring"],
    }

    let allPodMetrics: any[] = []

    for (const namespace of namespaces[environment]) {
      const metrics = await getPodsMetrics(namespace, environment)
      allPodMetrics = [...allPodMetrics, ...metrics]
    }

    return allPodMetrics
  } catch (error) {
    console.error(`Erro ao buscar métricas de pods (${environment}):`, error)

    // Retornar dados simulados em caso de erro
    const services = ["cba", "cbg", "cbc", "cbs", "fps"]
    const namespace = environment.toLowerCase() === "production" ? "default" : environment.toLowerCase()
    const pods: any[] = []

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
}

export async function fetchTransactionStats(environment: Environment) {
  try {
    // Em um ambiente real, você buscaria esses dados de um banco de dados ou API
    // Este é apenas um exemplo simulado
    // Podemos ter diferentes valores para diferentes ambientes

    const multiplier = {
      DEV: 0.3,
      HOMOLOG: 0.7,
      PRODUCTION: 1,
    }

    const baseToday = {
      boletosGerados: Math.floor(Math.random() * 300) + 200,
      pagamentosProcessados: Math.floor(Math.random() * 250) + 150,
      emailsEnviados: Math.floor(Math.random() * 280) + 180,
      pdfsGerados: Math.floor(Math.random() * 300) + 200,
    }

    const today = {
      boletosGerados: Math.floor(baseToday.boletosGerados * multiplier[environment]),
      pagamentosProcessados: Math.floor(baseToday.pagamentosProcessados * multiplier[environment]),
      emailsEnviados: Math.floor(baseToday.emailsEnviados * multiplier[environment]),
      pdfsGerados: Math.floor(baseToday.pdfsGerados * multiplier[environment]),
    }

    const week = {
      boletosGerados: today.boletosGerados * 7 + Math.floor(Math.random() * 100),
      pagamentosProcessados: today.pagamentosProcessados * 7 + Math.floor(Math.random() * 80),
      emailsEnviados: today.emailsEnviados * 7 + Math.floor(Math.random() * 90),
      pdfsGerados: today.pdfsGerados * 7 + Math.floor(Math.random() * 100),
    }

    const month = {
      boletosGerados: week.boletosGerados * 4 + Math.floor(Math.random() * 400),
      pagamentosProcessados: week.pagamentosProcessados * 4 + Math.floor(Math.random() * 320),
      emailsEnviados: week.emailsEnviados * 4 + Math.floor(Math.random() * 360),
      pdfsGerados: week.pdfsGerados * 4 + Math.floor(Math.random() * 400),
    }

    return {
      today: [
        {
          name: "Boletos Gerados",
          value: today.boletosGerados,
          change: Math.floor(Math.random() * 20) + 1,
          changeType: Math.random() > 0.3 ? "increase" : "decrease",
        },
        {
          name: "Pagamentos Processados",
          value: today.pagamentosProcessados,
          change: Math.floor(Math.random() * 15) + 1,
          changeType: Math.random() > 0.3 ? "increase" : "decrease",
        },
        {
          name: "E-mails Enviados",
          value: today.emailsEnviados,
          change: Math.floor(Math.random() * 10) + 1,
          changeType: Math.random() > 0.3 ? "increase" : "decrease",
        },
        {
          name: "PDFs Gerados",
          value: today.pdfsGerados,
          change: Math.floor(Math.random() * 20) + 1,
          changeType: Math.random() > 0.3 ? "increase" : "decrease",
        },
      ],
      week: [
        {
          name: "Boletos Gerados",
          value: week.boletosGerados,
          change: Math.floor(Math.random() * 20) + 1,
          changeType: Math.random() > 0.3 ? "increase" : "decrease",
        },
        {
          name: "Pagamentos Processados",
          value: week.pagamentosProcessados,
          change: Math.floor(Math.random() * 15) + 1,
          changeType: Math.random() > 0.3 ? "increase" : "decrease",
        },
        {
          name: "E-mails Enviados",
          value: week.emailsEnviados,
          change: Math.floor(Math.random() * 10) + 1,
          changeType: Math.random() > 0.3 ? "increase" : "decrease",
        },
        {
          name: "PDFs Gerados",
          value: week.pdfsGerados,
          change: Math.floor(Math.random() * 20) + 1,
          changeType: Math.random() > 0.3 ? "increase" : "decrease",
        },
      ],
      month: [
        {
          name: "Boletos Gerados",
          value: month.boletosGerados,
          change: Math.floor(Math.random() * 20) + 1,
          changeType: Math.random() > 0.3 ? "increase" : "decrease",
        },
        {
          name: "Pagamentos Processados",
          value: month.pagamentosProcessados,
          change: Math.floor(Math.random() * 15) + 1,
          changeType: Math.random() > 0.3 ? "increase" : "decrease",
        },
        {
          name: "E-mails Enviados",
          value: month.emailsEnviados,
          change: Math.floor(Math.random() * 10) + 1,
          changeType: Math.random() > 0.3 ? "increase" : "decrease",
        },
        {
          name: "PDFs Gerados",
          value: month.pdfsGerados,
          change: Math.floor(Math.random() * 20) + 1,
          changeType: Math.random() > 0.3 ? "increase" : "decrease",
        },
      ],
    }
  } catch (error) {
    console.error(`Erro ao buscar estatísticas de transações (${environment}):`, error)

    // Retornar dados simulados em caso de erro
    return {
      today: [
        {
          name: "Boletos Gerados",
          value: 150,
          change: 5,
          changeType: "increase",
        },
        {
          name: "Pagamentos Processados",
          value: 120,
          change: 3,
          changeType: "increase",
        },
        {
          name: "E-mails Enviados",
          value: 140,
          change: 2,
          changeType: "decrease",
        },
        {
          name: "PDFs Gerados",
          value: 150,
          change: 4,
          changeType: "increase",
        },
      ],
      week: [
        {
          name: "Boletos Gerados",
          value: 1050,
          change: 7,
          changeType: "increase",
        },
        {
          name: "Pagamentos Processados",
          value: 840,
          change: 5,
          changeType: "increase",
        },
        {
          name: "E-mails Enviados",
          value: 980,
          change: 3,
          changeType: "decrease",
        },
        {
          name: "PDFs Gerados",
          value: 1050,
          change: 6,
          changeType: "increase",
        },
      ],
      month: [
        {
          name: "Boletos Gerados",
          value: 4200,
          change: 10,
          changeType: "increase",
        },
        {
          name: "Pagamentos Processados",
          value: 3360,
          change: 8,
          changeType: "increase",
        },
        {
          name: "E-mails Enviados",
          value: 3920,
          change: 5,
          changeType: "decrease",
        },
        {
          name: "PDFs Gerados",
          value: 4200,
          change: 9,
          changeType: "increase",
        },
      ],
    }
  }
}

