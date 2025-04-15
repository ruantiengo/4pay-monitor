"use client"

import { useEffect, useState } from "react"
import { AlertCircle, AlertTriangle, CheckCircle2, Clock, XCircle } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { checkAlerts } from "@/app/actions/alerts"
import { useEnvironment } from "@/contexts/environment-context"

type AlertSeverity = "critical" | "high" | "medium" | "low" | "resolved"

interface Alert {
  id: string
  service: string
  message: string
  timestamp: string
  severity: AlertSeverity
  value?: number
  threshold?: number
}

// Função para gerar alertas simulados
const generateMockAlerts = (environment: string): Alert[] => {
  const services = ["CBA", "CBG", "CBC", "CBS", "FPS"]
  const severities: AlertSeverity[] = ["critical", "high", "medium", "low", "resolved"]
  const alertCount = Math.floor(Math.random() * 4) // 0 a 3 alertas

  // Em produção, gerar mais alertas
  const multiplier = environment === "PRODUCTION" ? 1 : environment === "HOMOLOG" ? 0.7 : 0.4

  if (Math.random() > multiplier) {
    return [] // Sem alertas
  }

  const alerts: Alert[] = []

  for (let i = 0; i < alertCount; i++) {
    const service = services[Math.floor(Math.random() * services.length)]
    const severity = severities[Math.floor(Math.random() * 3)] // Mais chance de severidades altas
    const value = Math.round(Math.random() * 100)
    const threshold = severity === "critical" ? 90 : severity === "high" ? 80 : 70

    alerts.push({
      id: `alert-${Date.now()}-${i}`,
      service,
      message: `${service}: ${getAlertMessage(severity)}`,
      timestamp: new Date().toISOString(),
      severity,
      value,
      threshold,
    })
  }

  return alerts
}

// Função para gerar mensagens de alerta
const getAlertMessage = (severity: AlertSeverity): string => {
  switch (severity) {
    case "critical":
      return `Utilização de CPU crítica (${Math.round(Math.random() * 10 + 90)}%)`
    case "high":
      return `Tempo de resposta elevado (${Math.round(Math.random() * 200 + 500)}ms)`
    case "medium":
      return `Taxa de erros acima do normal (${Math.round(Math.random() * 5 + 5)}%)`
    case "low":
      return `Utilização de memória aumentando (${Math.round(Math.random() * 20 + 70)}%)`
    case "resolved":
      return "Problema resolvido automaticamente"
    default:
      return "Alerta não especificado"
  }
}

export function AlertsPanel() {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)
  const { environment } = useEnvironment()

  useEffect(() => {
    async function loadAlerts() {
      try {
        setLoading(true)

        // Em produção, buscar dados reais do servidor
        // Em desenvolvimento, usar dados simulados
        if (process.env.NODE_ENV === "production") {
          const data = await checkAlerts()
          setAlerts(data)
        } else {
          // Simular um atraso de rede
          await new Promise((resolve) => setTimeout(resolve, 800))
          setAlerts(generateMockAlerts(environment))
        }
      } catch (error) {
        console.error("Erro ao carregar alertas:", error)
        // Em caso de erro, usar dados simulados
        setAlerts(generateMockAlerts(environment))
      } finally {
        setLoading(false)
      }
    }

    loadAlerts()

    // Atualizar a cada 60 segundos
    const interval = setInterval(loadAlerts, 60000)
    return () => clearInterval(interval)
  }, [environment]) // Recarregar quando o ambiente mudar

  const severityConfig = {
    critical: {
      icon: XCircle,
      color: "text-red-500",
      bgColor: "bg-red-100 dark:bg-red-900/20",
      label: "Crítico",
      badgeVariant: "destructive",
    },
    high: {
      icon: AlertCircle,
      color: "text-orange-500",
      bgColor: "bg-orange-100 dark:bg-orange-900/20",
      label: "Alto",
      badgeVariant: "destructive",
    },
    medium: {
      icon: AlertTriangle,
      color: "text-yellow-500",
      bgColor: "bg-yellow-100 dark:bg-yellow-900/20",
      label: "Médio",
      badgeVariant: "default",
    },
    low: {
      icon: Clock,
      color: "text-blue-500",
      bgColor: "bg-blue-100 dark:bg-blue-900/20",
      label: "Baixo",
      badgeVariant: "secondary",
    },
    resolved: {
      icon: CheckCircle2,
      color: "text-green-500",
      bgColor: "bg-green-100 dark:bg-green-900/20",
      label: "Resolvido",
      badgeVariant: "outline",
    },
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-orange-500" />
          Alertas Ativos
        </CardTitle>
        <CardDescription>Alertas e incidentes que precisam de atenção</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px] pr-4">
          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-20 animate-pulse rounded-lg bg-muted"></div>
              ))}
            </div>
          ) : alerts.length === 0 ? (
            <div className="flex h-20 items-center justify-center">
              <p className="text-muted-foreground">Nenhum alerta ativo no momento</p>
            </div>
          ) : (
            <div className="space-y-4">
              {alerts.map((alert) => {
                const { icon: Icon, color, bgColor, label, badgeVariant } = severityConfig[alert.severity]
                return (
                  <div key={alert.id} className={`flex items-start gap-3 rounded-lg p-3 ${bgColor}`}>
                    <Icon className={`mt-0.5 h-5 w-5 flex-shrink-0 ${color}`} />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{alert.service}</span>
                          <Badge variant={badgeVariant as any}>{label}</Badge>
                        </div>
                        <span className="text-xs text-muted-foreground">{formatDate(alert.timestamp)}</span>
                      </div>
                      <p className="mt-1 text-sm">{alert.message}</p>
                      {alert.value !== undefined && alert.threshold !== undefined && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          Valor: {alert.value.toFixed(2)} | Limite: {alert.threshold}
                        </p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
