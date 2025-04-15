import { type NextRequest, NextResponse } from "next/server"
import OpenAI from "openai"

// Inicializar o cliente OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    const { message, environment } = await request.json()

    if (!message) {
      return NextResponse.json({ error: "Mensagem não fornecida" }, { status: 400 })
    }

    // Criar um sistema de prompt baseado no ambiente
    const systemPrompt = `Você é um assistente de monitoramento para o ambiente ${environment} de uma aplicação de integração bancária.
    Você pode ajudar com informações sobre o sistema, status dos serviços, e sugestões para resolver problemas comuns.
    Os principais serviços são:
    - CBA: Camada de interação com o usuário (responsável por solicitações como geração de boletos)
    - CBG: Recebe as mensagens do CBA via RabbitMQ, se comunica com o provedor bancário e envia mensagem para envio de e-mail ao comprador
    - CBC: Responsável por enviar o e-mail para o cliente final
    - CBS: Serviço de estatísticas do sistema (quantidade de boletos gerados, sucesso, falha etc.)
    - FPS: Gera o PDF dos boletos
    Responda de forma concisa e útil.`

    // Chamar a API do OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message },
      ],
      max_tokens: 500,
    })

    const response = completion.choices[0].message.content

    return NextResponse.json({ response })
  } catch (error) {
    console.error("Erro ao processar mensagem:", error)
    return NextResponse.json({ error: "Erro ao processar mensagem" }, { status: 500 })
  }
}
