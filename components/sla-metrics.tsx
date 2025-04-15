"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

interface SLAMetric {
  name: string
  target: number
  current: number
  unit: string
}

const mockSLAMetrics: SLAMetric[] = [
  {
    name: "Disponibilidade",
    target: 99.9,
    current: 99.95,
    unit: "%",
  },
  {
    name: "Tempo de Resposta",
    target: 300,
    current: 245,
    unit: "ms",
  },
  {
    name: "Taxa de Sucesso",
    target: 99.5,
    current: 99.8,
    unit: "%",
  },
  {
    name: "Tempo de Processamento",
    target: 5000,
    current: 3200,
    unit: "ms",
  },
]

export function SLAMetrics() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Métricas de SLA</CardTitle>
        <CardDescription>Desempenho em relação aos acordos de nível de serviço</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {mockSLAMetrics.map((metric) => {
            const isPercentage = metric.unit === "%"
            const isGood = metric.unit === "%" ? metric.current >= metric.target : metric.current <= metric.target

            const progressValue = isPercentage ? metric.current : 100 - (metric.current / metric.target) * 100

            return (
              <div key={metric.name} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{metric.name}</span>
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-medium ${isGood ? "text-green-500" : "text-red-500"}`}>
                      {metric.current}
                      {metric.unit}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Meta: {metric.target}
                      {metric.unit}
                    </span>
                  </div>
                </div>
                <Progress
                  value={progressValue}
                  className={isGood ? "bg-muted" : "bg-red-100 dark:bg-red-900/20"}
                  indicatorClassName={isGood ? "bg-green-500" : "bg-red-500"}
                />
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
