"use server"

import { checkAlerts } from "./alerts"
import { sendEmailNotification } from "@/lib/notifications"

// Armazenamento em memória para alertas já notificados (em produção, use um banco de dados)
const notifiedAlerts = new Set<string>()

export async function processAndNotifyAlerts() {
  try {
    // Verificar alertas ativos
    const activeAlerts = await checkAlerts()

    // Filtrar apenas alertas críticos e altos que ainda não foram notificados
    const alertsToNotify = activeAlerts.filter(
      (alert) => (alert.severity === "critical" || alert.severity === "high") && !notifiedAlerts.has(alert.id),
    )

    // Processar cada alerta
    for (const alert of alertsToNotify) {
      // Enviar notificações
      await Promise.all([
        sendEmailNotification(alert),
        // Adicione aqui seus webhooks (Slack, Teams, etc.)
        // sendWebhookNotification(alert, "https://hooks.slack.com/services/your/webhook/url"),
      ])

      // Marcar como notificado
      notifiedAlerts.add(alert.id)

      // Limitar o tamanho do conjunto para evitar vazamento de memória
      if (notifiedAlerts.size > 1000) {
        const iterator = notifiedAlerts.values()
        notifiedAlerts.delete(iterator.next().value!  )
      }
    }

    return {
      processed: alertsToNotify.length,
      total: activeAlerts.length,
    }
  } catch (error) {
    console.error("Erro ao processar e notificar alertas:", error)
    return {
      processed: 0,
      total: 0,
      error: String(error),
    }
  }
}
