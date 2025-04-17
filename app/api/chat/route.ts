import { openai } from "@ai-sdk/openai"
import { generateText } from "ai"
import { NextResponse } from "next/server"

// Allow streaming responses up to 30 seconds
export const maxDuration = 30

export async function POST(req: Request) {
  const { messages, environment } = await req.json()

  // Include environment in system message
const systemMessage = `Você é um assistente de IA para monitorar o ambiente ${environment}. Forneça informações úteis sobre monitoramento, status e consultas relacionadas a este ambiente.`
 // Adicione este código temporariamente ao seu arquivo route.ts para depuração

  try {
    const { text } = await generateText({
        model: openai("gpt-4o"),
        messages,
        system: systemMessage,
     
      })
  
      
    return  NextResponse.json({
        id: crypto.randomUUID(), // opcional, mas ajuda
        role: "assistant",
        content: text,
      })
 } catch(error){
    console.log(error);
    
 }

}
