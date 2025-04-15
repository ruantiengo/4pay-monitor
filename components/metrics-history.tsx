"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

// Simulação de dados históricos (em produção, busque do banco de dados ou CloudWatch)
const generateHistoricalData = (days: number, baseValue: number, variance: number) => {
  const data = []
  const now = new Date()

  for (let i = 0; i < days; i++) {
    const date = new Date(now)
    date.setDate(date.getDate() - i)

    // Gerar um valor aleatório em torno do valor base
    const value = baseValue + (Math.random() * variance * 2 - variance)

    data.push({
      date: date.toISOString().split("T")[0],
      value: Number(value.toFixed(2)),
    })
  }

  // Ordenar por data (mais antiga para mais recente)
  return data.reverse()
}

export function MetricsHistory() {
  const [timeRange, setTimeRange] = useState("7d")
  const [metricType, setMetricType] = useState("cpu")
  const [chartData, setChartData] = useState<any[]>([])

  useEffect(() => {
    // Configurações de métricas
    const metricConfigs = {
      cpu: { baseValue: 35, variance: 15 },
      memory: { baseValue: 45, variance: 10 },
      responseTime: { baseValue: 250, variance: 50 },
      successRate: { baseValue: 98, variance: 2 },
    }

    // Determinar número de dias com base no intervalo selecionado
    const daysMap: Record<string, number> = {
      "1d": 1,
      "7d": 7,
      "30d": 30,
      "90d": 90,
    }

    const days = daysMap[timeRange] || 7
    const config = metricConfigs[metricType as keyof typeof metricConfigs]

    // Gerar dados históricos
    const data = generateHistoricalData(days, config.baseValue, config.variance)
    setChartData(data)
  }, [timeRange, metricType])

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Histórico de Métricas</CardTitle>
            <CardDescription>Análise de tendências ao longo do tempo</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Select value={metricType} onValueChange={setMetricType}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Tipo de Métrica" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cpu">CPU</SelectItem>
                <SelectItem value="memory">Memória</SelectItem>
                <SelectItem value="responseTime">Tempo de Resposta</SelectItem>
                <SelectItem value="successRate">Taxa de Sucesso</SelectItem>
              </SelectContent>
            </Select>

            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1d">1 dia</SelectItem>
                <SelectItem value="7d">7 dias</SelectItem>
                <SelectItem value="30d">30 dias</SelectItem>
                <SelectItem value="90d">90 dias</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="chart">
          <TabsList className="mb-4">
            <TabsTrigger value="chart">Gráfico</TabsTrigger>
            <TabsTrigger value="table">Tabela</TabsTrigger>
          </TabsList>

          <TabsContent value="chart">
            <div className="h-[400px] w-full rounded-md bg-muted/30 flex items-center justify-center">
              <p className="text-muted-foreground">
                Gráfico de {getMetricName(metricType)} para os últimos {getTimeRangeName(timeRange)}
              </p>
              {/* Em um ambiente real, você usaria uma biblioteca como Recharts, Chart.js ou D3.js */}
            </div>
          </TabsContent>

          <TabsContent value="table">
            <div className="rounded-md border">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="p-2 text-left font-medium">Data</th>
                    <th className="p-2 text-right font-medium">{getMetricName(metricType)}</th>
                  </tr>
                </thead>
                <tbody>
                  {chartData.map((item, index) => (
                    <tr key={index} className="border-b">
                      <td className="p-2">{formatDate(item.date)}</td>
                      <td className="p-2 text-right">
                        {item.value}
                        {metricType === "successRate" ? "%" : metricType === "responseTime" ? "ms" : ""}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

// Funções auxiliares
function getMetricName(metricType: string): string {
  const names: Record<string, string> = {
    cpu: "Utilização de CPU",
    memory: "Utilização de Memória",
    responseTime: "Tempo de Resposta",
    successRate: "Taxa de Sucesso",
  }
  return names[metricType] || metricType
}

function getTimeRangeName(timeRange: string): string {
  const names: Record<string, string> = {
    "1d": "1 dia",
    "7d": "7 dias",
    "30d": "30 dias",
    "90d": "90 dias",
  }
  return names[timeRange] || timeRange
}

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString("pt-BR")
}
