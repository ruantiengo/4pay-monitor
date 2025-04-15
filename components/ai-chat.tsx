"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Send } from "lucide-react"
import { useEnvironment } from "@/contexts/environment-context"


type Message = {
  id: string
  content: string
  role: "user" | "assistant"
  timestamp: Date
}

export function AIChat() {
  const { environment } = useEnvironment()
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      content: `Olá! Sou o assistente de monitoramento para o ambiente ${environment}. Como posso ajudar?`,
      role: "assistant",
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const scrollAreaRef = useRef<HTMLDivElement>(null)

  // Rolar para o final quando novas mensagens são adicionadas
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
    }
  }, [messages])

  const handleSendMessage = async () => {
    if (!input.trim()) return

    // Adicionar mensagem do usuário
    const userMessage: Message = {
      id: Date.now().toString(),
      content: input,
      role: "user",
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    try {
      // Enviar mensagem para a API do ChatGPT
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: input,
          environment,
        }),
      })

      if (!response.ok) {
        throw new Error("Falha ao comunicar com a IA")
      }

      const data = await response.json()

      // Adicionar resposta da IA
      const assistantMessage: Message = {
        id: Date.now().toString(),
        content: data.response,
        role: "assistant",
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, assistantMessage])
    } catch (error) {
      console.error("Erro ao enviar mensagem:", error)

      // Adicionar mensagem de erro
      const errorMessage: Message = {
        id: Date.now().toString(),
        content: "Desculpe, ocorreu um erro ao processar sua mensagem. Por favor, tente novamente.",
        role: "assistant",
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <Card className="flex flex-col h-[600px]  rounded-lg">
      <CardHeader className="pb-2 border-b border-zinc-800 flex flex-col gap-1">
        <CardTitle className="text-white text-lg">Assistente IA</CardTitle>
        <CardDescription className="text-zinc-400 text-sm">
          Converse com o assistente para obter informações sobre o sistema
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow overflow-hidden p-0">
        <ScrollArea className="h-[450px] px-4 py-2" ref={scrollAreaRef}>
          <div className="space-y-4">
            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`flex items-start gap-3 max-w-[80%] ${message.role === "user" ? "flex-row-reverse" : ""}`}
                >
                  <Avatar className="h-8 w-8">
                    <div
                      className={`flex h-full w-full items-center justify-center rounded-full ${
                        message.role === "user" ? "bg-green-500" : "bg-zinc-700"
                      }`}
                    >
                      {message.role === "user" ? "U" : "AI"}
                    </div>
                  </Avatar>
                  <div
                    className={`rounded-lg p-3 ${
                      message.role === "user" ? "bg-green-500 text-white" : "bg-zinc-800 text-white"
                    }`}
                  >
                    <p className="text-sm">{message.content}</p>
                    <p className="text-xs opacity-50 mt-1">
                      {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="flex items-start gap-3 max-w-[80%]">
                  <Avatar className="h-8 w-8">
                    <div className="flex h-full w-full items-center justify-center rounded-full bg-zinc-700">AI</div>
                  </Avatar>
                  <div className="rounded-lg p-3 bg-zinc-800">
                    <p className="text-sm text-white">Digitando...</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
      <CardFooter className="pt-0 border-t border-zinc-800 p-4">
        <div className="flex w-full items-center space-x-2">
          <Input
            placeholder="Digite sua mensagem..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            className="flex-1 bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-400 focus-visible:ring-0 focus-visible:ring-offset-0"
          />
          <Button
            onClick={handleSendMessage}
            disabled={isLoading || !input.trim()}
            size="icon"
            className="bg-green-500 hover:bg-green-600 text-white"
          >
            <Send className="h-4 w-4" />
            <span className="sr-only">Enviar mensagem</span>
          </Button>
        </div>
      </CardFooter>
    </Card>
  )
}
