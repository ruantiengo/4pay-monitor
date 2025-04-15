"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Loader2 } from "lucide-react"
import { fetchPodsMetrics } from "@/app/actions/metrics"
import { useEnvironment } from "@/contexts/environment-context"

interface PodMetric {
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

// Dados simulados para desenvolvimento
const getMockPodsMetrics = (environment: string): PodMetric[] => {
  const services = ["cba", "cbg", "cbc", "cbs", "fps"]
  const namespaces = {
    DEV: "dev",
    HOMOLOG: "homolog",
    PRODUCTION: "default",
  }
  const namespace = namespaces[environment as keyof typeof namespaces]

  const pods: PodMetric[] = []

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

export function KubernetesPods() {
  const [pods, setPods] = useState<PodMetric[]>([])
  const [loading, setLoading] = useState(true)
  const { environment } = useEnvironment()

  useEffect(() => {
    async function loadPods() {
      try {
        setLoading(true)

        // Em produção, buscar dados reais do servidor
        // Em desenvolvimento, usar dados simulados
        if (process.env.NODE_ENV === "production") {
          const data = await fetchPodsMetrics(environment)
          setPods(data)
        } else {
          // Simular um atraso de rede
          await new Promise((resolve) => setTimeout(resolve, 800))
          setPods(getMockPodsMetrics(environment))
        }
      } catch (error) {
        console.error("Erro ao carregar métricas dos pods:", error)
        // Em caso de erro, usar dados simulados
        setPods(getMockPodsMetrics(environment))
      } finally {
        setLoading(false)
      }
    }

    loadPods()

    // Atualizar a cada 30 segundos
    const interval = setInterval(loadPods, 30000)
    return () => clearInterval(interval)
  }, [environment]) // Recarregar quando o ambiente mudar

  // Função para determinar o status do pod com base no uso de recursos
  const getPodStatus = (pod: PodMetric) => {
    if (pod.cpu.percentage > 90 || pod.memory.percentage > 90) {
      return { status: "critical", label: "Crítico" }
    } else if (pod.cpu.percentage > 70 || pod.memory.percentage > 70) {
      return { status: "warning", label: "Alerta" }
    } else {
      return { status: "healthy", label: "Saudável" }
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pods Kubernetes</CardTitle>
        <CardDescription>Status e utilização de recursos dos pods ({environment})</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex h-40 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Pod</TableHead>
                  <TableHead>Namespace</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>CPU</TableHead>
                  <TableHead>Memória</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pods.map((pod) => {
                  const { status, label } = getPodStatus(pod)
                  return (
                    <TableRow key={`${pod.namespace}-${pod.name}`}>
                      <TableCell className="font-medium">{pod.name}</TableCell>
                      <TableCell>{pod.namespace}</TableCell>
                      <TableCell>
                        <Badge
                          variant={status === "critical" ? "destructive" : status === "warning" ? "default" : "outline"}
                        >
                          {label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span
                            className={
                              pod.cpu.percentage > 90
                                ? "text-red-500"
                                : pod.cpu.percentage > 70
                                  ? "text-yellow-500"
                                  : ""
                            }
                          >
                            {pod.cpu.usage.toFixed(2)}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            / {pod.cpu.limit} cores ({pod.cpu.percentage.toFixed(1)}%)
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span
                            className={
                              pod.memory.percentage > 90
                                ? "text-red-500"
                                : pod.memory.percentage > 70
                                  ? "text-yellow-500"
                                  : ""
                            }
                          >
                            {pod.memory.usage.toFixed(0)} MB
                          </span>
                          <span className="text-xs text-muted-foreground">
                            / {pod.memory.limit} MB ({pod.memory.percentage.toFixed(1)}%)
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
