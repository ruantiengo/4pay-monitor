"use client"

import type React from "react"

import { useEffect, useRef, useState } from "react"
import { useChat } from "@ai-sdk/react"
import { Card, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Send, Loader2, Copy, User, Bot } from "lucide-react"
import { useEnvironment } from "@/contexts/environment-context"
import { toast } from "sonner"
import ReactMarkdown from "react-markdown"

export function AIChat() {
  const { environment } = useEnvironment()

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [mounted, setMounted] = useState(false)

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
      }
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

  // Ajustar altura do textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
      const scrollHeight = textareaRef.current.scrollHeight
      textareaRef.current.style.height = `${Math.min(scrollHeight, 120)}px`
    }
  }, [input])

  
  const scrollToBottom = () => {
   
  }

  // Rolar para o final quando novas mensagens são adicionadas
  useEffect(() => {
    scrollToBottom()
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

  return (
    <Card className="flex flex-col h-[800px] border-zinc-800">
      <CardHeader className="pb-2 pt-3 px-4 border-b border-zinc-800 flex-shrink-0">
        <CardTitle className="text-sm font-medium text-zinc-400">Assistente IA - {environment}</CardTitle>
      </CardHeader>

    
        <ScrollArea className="flex-grow overflow-hidden p-0 flex flex-col" >
          <div className="py-4 min-h-full flex flex-col">
            <div className="flex-grow">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`px-4 py-2 flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div className={`flex max-w-[50%] ${message.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                    <div
                      className={`
                        p-3 rounded-lg relative 
                        ${message.role === "user" ? "bg-green-500 text-white mr-2" : "bg-zinc-800 text-white ml-2"}
                      `}
                    >
                      <div className="chat-message-content">
                        {message.role === "user" ? (
                          <div className="text-xs overflow-x-auto">
                            <pre className="whitespace-pre-wrap break-words font-sans">{message.content}</pre>
                          </div>
                        ) : (
                          <div className="text-xs overflow-x-auto markdown-wrapper">
                            <ReactMarkdown>{message.content}</ReactMarkdown>
                          </div>
                        )}
                      </div>

                      <div className="flex justify-between items-center mt-2 pt-1 border-t border-white/10">
                        <span className="text-[10px] opacity-70">
                          {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                        <button
                          onClick={() => copyMessage(message.content)}
                          className="opacity-70 hover:opacity-100 transition-opacity"
                          aria-label="Copiar mensagem"
                        >
                          <Copy className="h-3 w-3" />
                        </button>
                      </div>
                    </div>

                    <div
                      className={`
                        flex items-center justify-center h-8 w-8 rounded-full flex-shrink-0 
                        ${message.role === "user" ? "bg-green-600" : "bg-zinc-700"}
                      `}
                    >
                      {message.role === "user" ? (
                        <User className="h-4 w-4 text-white" />
                      ) : (
                        <Bot className="h-4 w-4 text-white" />
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {isLoading && messages[messages.length - 1]?.role === "user" && (
                <div className="px-4 py-2 flex justify-start">
                  <div className="flex max-w-[50%]">
                    <div className="flex items-center justify-center h-8 w-8 rounded-full bg-zinc-700 flex-shrink-0">
                      <Bot className="h-4 w-4 text-white" />
                    </div>
                    <div className="bg-zinc-800 text-white ml-2 p-3 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <div
                          className="w-2 h-2 bg-white rounded-full animate-bounce"
                          style={{ animationDelay: "0ms" }}
                        ></div>
                        <div
                          className="w-2 h-2 bg-white rounded-full animate-bounce"
                          style={{ animationDelay: "300ms" }}
                        ></div>
                        <div
                          className="w-2 h-2 bg-white rounded-full animate-bounce"
                          style={{ animationDelay: "600ms" }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            {/* Elemento invisível para referência de rolagem */}
            <div ref={messagesEndRef} className="h-4" />
          </div>
        </ScrollArea>
     

      <div className="p-3 border-t border-zinc-800 flex-shrink-0">
        <div className="flex items-end space-x-2">
          <Textarea
            ref={textareaRef}
            placeholder="Digite sua mensagem..."
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            className="flex-1 min-h-[40px] max-h-[120px] bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus-visible:ring-0 focus-visible:ring-offset-0 text-xs resize-none overflow-y-auto py-2 rounded-md"
            rows={1}
          />
          {isLoading ? (
            <Button onClick={handleCancelRequest} size="sm" variant="destructive" className="h-10 px-3">
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              Cancelar
            </Button>
          ) : (
            <Button
              onClick={(e) => handleSubmit(e as any)}
              disabled={!input.trim()}
              size="sm"
              className="bg-green-500 hover:bg-green-600 text-white h-10 px-3"
            >
              <Send className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </Card>
  )
}
