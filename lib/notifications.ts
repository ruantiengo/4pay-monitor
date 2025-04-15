import type { Alert } from "@/app/actions/alerts"

// Função para enviar notificações por email
export async function sendEmailNotification(alert: Alert) {
  // Em um ambiente real, você usaria um serviço de email como SendGrid, AWS SES, etc.
  // Este é apenas um exemplo simulado
  console.log(`[EMAIL] Enviando notificação para alerta: ${alert.service} - ${alert.message}`)

  try {
    // Simulação de envio de email
    await new Promise((resolve) => setTimeout(resolve, 500))

    console.log(`[EMAIL] Notificação enviada com sucesso para alerta: ${alert.id}`)
    return true
  } catch (error) {
    console.error(`[EMAIL] Erro ao enviar notificação para alerta: ${alert.id}`, error)
    return false
  }
}

// Função para enviar notificações para webhook (ex: Slack, Discord, Teams)
export async function sendWebhookNotification(alert: Alert, webhookUrl: string) {
  try {
    // Formatar a mensagem para o webhook
    const payload = {
      text: `[${alert.severity.toUpperCase()}] ${alert.service}: ${alert.message}`,
      attachments: [
        {
          color: getColorForSeverity(alert.severity),
          fields: [
            {
              title: "Serviço",
              value: alert.service,
              short: true,
            },
            {
              title: "Severidade",
              value: alert.severity,
              short: true,
            },
            {
              title: "Timestamp",
              value: new Date(alert.timestamp).toLocaleString("pt-BR"),
              short: true,
            },
          ],
        },
      ],
    }

    // Enviar para o webhook
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      throw new Error(`Erro ao enviar para webhook: ${response.status} ${response.statusText}`)
    }

    console.log(`[WEBHOOK] Notificação enviada com sucesso para alerta: ${alert.id}`)
    return true
  } catch (error) {
    console.error(`[WEBHOOK] Erro ao enviar notificação para alerta: ${alert.id}`, error)
    return false
  }
}

// Função auxiliar para determinar a cor com base na severidade
function getColorForSeverity(severity: string): string {
  switch (severity) {
    case "critical":
      return "#FF0000" // Vermelho
    case "high":
      return "#FFA500" // Laranja
    case "medium":
      return "#FFFF00" // Amarelo
    case "low":
      return "#0000FF" // Azul
    case "resolved":
      return "#00FF00" // Verde
    default:
      return "#808080" // Cinza
  }
}
