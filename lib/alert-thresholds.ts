// Definição de limiares para alertas
export const alertThresholds = {
  cpu: {
    warning: 70, // percentual
    critical: 90,
  },
  memory: {
    warning: 70, // percentual
    critical: 90,
  },
  disk: {
    warning: 80, // percentual
    critical: 95,
  },
  responseTime: {
    warning: 300, // ms
    critical: 500,
  },
  errorRate: {
    warning: 5, // percentual
    critical: 10,
  },
  successRate: {
    warning: 95, // percentual (abaixo deste valor)
    critical: 90,
  },
}

export type AlertSeverity = "critical" | "high" | "medium" | "low" | "resolved"

export interface AlertRule {
  id: string
  service: string
  metricName: string
  condition: ">" | "<" | "=" | ">=" | "<="
  threshold: number
  severity: AlertSeverity
  message: string
}

// Regras de alerta pré-definidas
export const alertRules: AlertRule[] = [
  {
    id: "cpu-high",
    service: "all",
    metricName: "CPUUtilization",
    condition: ">",
    threshold: alertThresholds.cpu.critical,
    severity: "critical",
    message: "Utilização de CPU crítica",
  },
  {
    id: "memory-high",
    service: "all",
    metricName: "MemoryUtilization",
    condition: ">",
    threshold: alertThresholds.memory.critical,
    severity: "critical",
    message: "Utilização de memória crítica",
  },
  {
    id: "response-time-high",
    service: "all",
    metricName: "ResponseTime",
    condition: ">",
    threshold: alertThresholds.responseTime.critical,
    severity: "high",
    message: "Tempo de resposta elevado",
  },
  {
    id: "error-rate-high",
    service: "all",
    metricName: "ErrorRate",
    condition: ">",
    threshold: alertThresholds.errorRate.critical,
    severity: "critical",
    message: "Taxa de erros elevada",
  },
  {
    id: "success-rate-low",
    service: "all",
    metricName: "SuccessRate",
    condition: "<",
    threshold: alertThresholds.successRate.critical,
    severity: "critical",
    message: "Taxa de sucesso abaixo do esperado",
  },
]

// Função para avaliar se uma métrica viola uma regra de alerta
export function evaluateAlert(rule: AlertRule, value: number): boolean {
  switch (rule.condition) {
    case ">":
      return value > rule.threshold
    case "<":
      return value < rule.threshold
    case "=":
      return value === rule.threshold
    case ">=":
      return value >= rule.threshold
    case "<=":
      return value <= rule.threshold
    default:
      return false
  }
}
