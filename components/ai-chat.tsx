"use client"

import type React from "react"
import { useEffect, useRef, useState } from "react"
import { useChat } from "@ai-sdk/react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Send, Loader2, Copy } from "lucide-react"
import { useEnvironment } from "@/contexts/environment-context"
import { toast } from "sonner"
import ReactMarkdown from "react-markdown"
import { Textarea } from "@/components/ui/textarea"

export function AIChat() {
  const { environment } = useEnvironment()
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const [mounted, setMounted] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const { messages, input, handleInputChange, handleSubmit, isLoading, stop, setMessages } = useChat({
    api: "/api/chat",
    body: { environment },
    initialMessages: [
      {
        id: "welcome-message",
        content: `Olá! 👋

Sou o assistente inteligente responsável pelo monitoramento do ambiente **${environment}**. 

Estou aqui para fornecer **suporte técnico**, **explicações detalhadas** ou até **relatórios analíticos**. Sinta-se à vontade para perguntar qualquer coisa!`,
        role: "assistant",
      },
    ],
    onResponse(response) {
      const reader = response.body?.getReader()
      if (reader) {
        const decoder = new TextDecoder("utf-8")
        let result = ""

        const readStream = async () => {
          while (true) {
            const { done, value } = await reader.read()
            if (done) break
            result += decoder.decode(value, { stream: true })
          }
          try {
            const parsed = JSON.parse(result)
            setMessages((old) => [
              ...old,
              {
                id: crypto.randomUUID(),
                role: "assistant",
                content: parsed?.content || "Erro ao processar resposta.",
              },
            ])
          } catch (err) {
            console.error("Erro ao interpretar resposta:", err)
          }
        }

        readStream().catch((error) => {
          console.error("Erro ao ler o stream:", error)
        })
      }
    },
  })

  // Ajustar a altura do textarea conforme o conteúdo
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
      const scrollHeight = textareaRef.current.scrollHeight
      textareaRef.current.style.height = `${Math.min(scrollHeight, 120)}px`
    }
  }, [input])

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
    }
  }, [messages])

  useEffect(() => {
    toast("Ambiente alterado", {
      description: `Agora conversando no ambiente ${environment}`,
    })
  }, [environment])

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  const handleCancelRequest = () => {
    stop()
    toast("Requisição cancelada", {
      description: "A geração da resposta foi interrompida.",
    })
  }

  const copyMessage = (content: string) => {
    navigator.clipboard.writeText(content)
    toast("Copiado!", {
      description: "Mensagem copiada para a área de transferência",
    })
  }

  if (!mounted) return null

  const currentTime = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })

  return (
    <Card className="flex flex-col h-[500px] border-zinc-800">
      <CardHeader className="pb-2 pt-3 px-4 border-b border-zinc-800">
        <CardTitle className="text-sm font-medium text-zinc-400">Assistente IA - {environment}</CardTitle>
      </CardHeader>

      <CardContent className="flex-grow overflow-hidden p-0">
        <ScrollArea className="h-[400px] px-4 py-2" ref={scrollAreaRef}>
          <div className="space-y-3">
            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`flex items-start gap-2 ${message.role === "user" ? "flex-row-reverse" : ""}`}
                  style={{ maxWidth: "85%" }}
                >
                  <Avatar className="h-6 w-6 flex-shrink-0">
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
                    } relative group`}
                  >
                    <div
                      className="whitespace-pre-wrap break-all overflow-x-auto max-w-full"
                      style={{ wordBreak: "break-word" }}
                    >
                      {message.role === "user" ? (
                        <pre className="text-xs font-sans">{message.content}</pre>
                      ) : (
                        <ReactMarkdown>{message.content}</ReactMarkdown>
                      )}
                    </div>
                    <div className="flex justify-between items-center mt-1">
                      <p className="text-[10px] opacity-50">{currentTime}</p>
                      <button
                        onClick={() => copyMessage(message.content)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                        aria-label="Copiar mensagem"
                      >
                        <Copy className="h-3 w-3 text-white/50 hover:text-white/80" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {isLoading && messages[messages.length - 1]?.role === "user" && (
              <div className="flex justify-start">
                <div className="flex items-start gap-2" style={{ maxWidth: "85%" }}>
                  <Avatar className="h-6 w-6 flex-shrink-0">
                    <div className="flex h-full w-full items-center justify-center rounded-full bg-zinc-700">AI</div>
                  </Avatar>
                  <div className="rounded-lg p-2 bg-zinc-800">
                    <p className="text-xs text-white">Digitando...</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>

      <div className="p-2 border-t border-zinc-800">
        <div className="flex w-full items-center space-x-2">
          <Textarea
            ref={textareaRef}
            placeholder="Digite sua mensagem..."
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            className="flex-1 min-h-8 max-h-[120px] bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus-visible:ring-0 focus-visible:ring-offset-0 text-xs resize-none overflow-y-auto py-2"
            rows={1}
          />
          {isLoading ? (
            <Button onClick={handleCancelRequest} size="sm" variant="destructive" className="h-8 px-2 self-start">
              <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
              Cancelar
            </Button>
          ) : (
            <Button
              onClick={(e) => handleSubmit(e as any)}
              disabled={!input.trim()}
              size="sm"
              className="bg-green-500 hover:bg-green-600 text-white h-8 px-2 self-start"
            >
              <Send className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>
    </Card>
  )
}
