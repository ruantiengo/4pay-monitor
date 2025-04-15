"use server"

import { alertRules, evaluateAlert, type AlertSeverity } from "@/lib/alert-thresholds"
// import { getServiceMetrics } from "@/lib/fetch-custom-metrics" // Removemos esta importação

export interface Alert {
  id: string
  service: string
  message: string
  timestamp: string
  severity: AlertSeverity
  value?: number
  threshold?: number
}

export async function checkAlerts(): Promise<Alert[]> {
  // Em um ambiente real, você buscaria métricas reais e avaliaria alertas
  // Aqui estamos simulando dados para evitar dependências externas

  const alerts: Alert[] = []
  const services = ["CBA", "CBG", "CBC", "CBS", "FPS"]

  // Simular alguns alertas aleatórios
  const alertCount = Math.floor(Math.random() * 3) // 0 a 2 alertas

  for (let i = 0; i < alertCount; i++) {
    const rule = alertRules[Math.floor(Math.random() * alertRules.length)]
    const service = services[Math.floor(Math.random() * services.length)]
    const value = Math.random() * 100

    // Verificar se a métrica viola a regra de alerta
    if (evaluateAlert(rule, value)) {
      alerts.push({
        id: `${rule.id}-${service}-${Date.now()}`,
        service,
        message: `${service}: ${rule.message} (${value.toFixed(2)})`,
        timestamp: new Date().toISOString(),
        severity: rule.severity,
        value,
        threshold: rule.threshold,
      })
    }
  }

  return alerts
}
