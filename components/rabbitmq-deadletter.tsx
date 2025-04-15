"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { RefreshCw, AlertCircle, Clock, MessageSquare, ArrowRightCircle, Inbox } from "lucide-react"
import { useEnvironment } from "@/contexts/environment-context"
import { getDeadLetters, type DeadLetter } from "@/app/actions/rabbitmq-deadletters"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useNotifications, deadLetterToNotification } from "@/contexts/notification-context"

// Interface para armazenar no localStorage
interface DeadLetterCache {
  deadletters: DeadLetter[]
  lastLoadTime: string
  environment: string
}

export function RabbitMQDeadLetter() {
  const { environment } = useEnvironment()
  const [deadletters, setDeadletters] = useState<DeadLetter[]>([])
  const [loading, setLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [selectedMessage, setSelectedMessage] = useState<DeadLetter | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [lastLoadTime, setLastLoadTime] = useState<string | undefined>(undefined)

  // Referência para controlar o intervalo
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  // Referência para rastrear se é a primeira carga
  const isFirstLoadRef = useRef(true)

  // Usar o contexto de notificações global
  const { hasNotification, addNotifications, markAsRead } = useNotifications()

  // Chave para o localStorage
  const getStorageKey = useCallback(() => `deadletter-cache-${environment}`, [environment])

  // Carregar do localStorage na inicialização
  useEffect(() => {
    if (typeof window === "undefined") return

    const storageKey = getStorageKey()
    const cachedData = localStorage.getItem(storageKey)

    if (cachedData) {
      try {
        const parsedData: DeadLetterCache = JSON.parse(cachedData)

        // Verificar se o cache é do ambiente atual
        if (parsedData.environment === environment) {
          console.log(`Carregando ${parsedData.deadletters.length} mensagens do cache para o ambiente ${environment}`)
          setDeadletters(parsedData.deadletters)
          setLastLoadTime(parsedData.lastLoadTime)
          setLoading(false)
        } else {
          // Se o cache for de outro ambiente, limpar o estado
          setDeadletters([])
          setLastLoadTime(undefined)
        }
      } catch (error) {
        console.error("Erro ao carregar cache de deadletters:", error)
        setDeadletters([])
        setLastLoadTime(undefined)
      }
    } else {
      // Se não houver cache, limpar o estado
      setDeadletters([])
      setLastLoadTime(undefined)
    }
  }, [environment, getStorageKey])

  // Salvar no localStorage
  const saveToLocalStorage = useCallback(
    (newDeadletters: DeadLetter[], newLastLoadTime: string) => {
      if (typeof window === "undefined") return

      const storageKey = getStorageKey()
      const cacheData: DeadLetterCache = {
        deadletters: newDeadletters,
        lastLoadTime: newLastLoadTime,
        environment,
      }

      localStorage.setItem(storageKey, JSON.stringify(cacheData))
      console.log(`Salvando ${newDeadletters.length} mensagens no cache para o ambiente ${environment}`)
    },
    [environment, getStorageKey],
  )

  const fetchDeadLetters = useCallback(async () => {
    // Evitar múltiplas chamadas simultâneas
    if (isRefreshing) return

    try {
      setIsRefreshing(true)

      // Usar o lastLoadTime para buscar apenas mensagens novas
      const result = await getDeadLetters(environment, lastLoadTime)

      if (result.success) {
        console.log(`Buscadas ${result.deadletters.length} mensagens${lastLoadTime ? " novas" : ""}`)

        // Atualizar o lastLoadTime para a próxima busca
        const newLastLoadTime = new Date().toISOString()
        setLastLoadTime(newLastLoadTime)

        if (result.deadletters.length > 0) {
          // Verificar quais mensagens são realmente novas (não estão no estado atual)
          const currentIds = new Set(deadletters.map((msg) => msg._id))
          const newMessages = result.deadletters.filter((msg) => !currentIds.has(msg._id))

          if (newMessages.length > 0) {
            console.log(`${newMessages.length} mensagens são realmente novas`)

            // Criar notificações apenas para mensagens que não têm notificação existente
            const messagesToNotify = newMessages.filter((msg) => !hasNotification(msg._id))

            const oneWeekAgo = new Date()
            oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)

            const recentMessagesToNotify = messagesToNotify.filter((msg) => {
              const createdAt = new Date(msg.created_at)
              return createdAt >= oneWeekAgo
            })
            console.log(recentMessagesToNotify);
            
            if (recentMessagesToNotify.length > 0) {
              console.log(`Criando ${recentMessagesToNotify.length} novas notificações`)
              const newNotifications = recentMessagesToNotify.map((msg) => deadLetterToNotification(msg, environment))
              addNotifications(newNotifications)
            }

            // Atualizar o estado com todas as mensagens (antigas + novas)
            const updatedDeadletters = [...newMessages, ...deadletters]
            setDeadletters(updatedDeadletters)

            // Salvar no localStorage
            saveToLocalStorage(updatedDeadletters, newLastLoadTime)
          } else {
            // Se não há mensagens novas, apenas atualizar o lastLoadTime no localStorage
            saveToLocalStorage(deadletters, newLastLoadTime)
          }
        } else if (isFirstLoadRef.current) {
          // Na primeira carga, se não houver mensagens, salvar um array vazio
          saveToLocalStorage([], newLastLoadTime)
          isFirstLoadRef.current = false
        }
      } else {
        console.error("Erro ao buscar deadletters:", result.error)
      }
    } catch (error) {
      console.error("Erro ao buscar deadletters:", error)
    } finally {
      setLoading(false)
      setIsRefreshing(false)
    }
  }, [environment, lastLoadTime, deadletters, hasNotification, addNotifications, saveToLocalStorage, isRefreshing])

  // Configurar o efeito para buscar deadletters e limpar corretamente
  useEffect(() => {
    // Buscar deadletters imediatamente se não temos dados no cache
    if (deadletters.length === 0 && !isRefreshing) {
      fetchDeadLetters()
    } else {
      // Marcar como não sendo mais a primeira carga
      isFirstLoadRef.current = false
    }

    // Configurar o intervalo para verificar a cada 1 minuto
    intervalRef.current = setInterval(fetchDeadLetters, 60000)

    // Limpar o intervalo ao desmontar ou mudar de ambiente
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [environment, fetchDeadLetters, deadletters.length, isRefreshing])

  // Função manual de atualização
  const handleRefresh = useCallback(() => {
    fetchDeadLetters()
  }, [fetchDeadLetters])

  // Memoizar funções de formatação para evitar recálculos desnecessários
  const getTimeAgo = useCallback((timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)

    if (diffMins < 1) return "agora"
    if (diffMins < 60) return `${diffMins}m atrás`

    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours}h atrás`

    const diffDays = Math.floor(diffHours / 24)
    return `${diffDays}d atrás`
  }, [])

  const formatContent = useCallback((content: any) => {
    try {
      if (typeof content === "string") {
        return content
      }
      return JSON.stringify(content, null, 2)
    } catch {
      return "Erro ao formatar conteúdo"
    }
  }, [])

  const truncateContent = useCallback(
    (content: any, maxLength = 100) => {
      const formatted = formatContent(content)
      if (formatted.length <= maxLength) return formatted
      return formatted.substring(0, maxLength) + "..."
    },
    [formatContent],
  )

  // Função para extrair um título significativo do conteúdo da mensagem
  const extractTitle = useCallback((content: any): string => {
    try {
      if (typeof content === "object" && content !== null) {
        // Tentar encontrar campos comuns que poderiam servir como título
        const possibleTitleFields = ["id", "type", "action", "event", "subject", "title", "name"]
        for (const field of possibleTitleFields) {
          if (content[field] && typeof content[field] === "string") {
            return content[field]
          }
        }

        // Se não encontrar campos específicos, tentar o primeiro campo string
        for (const key in content) {
          if (typeof content[key] === "string" && content[key].length < 30) {
            return `${key}: ${content[key]}`
          }
        }
      }

      // Fallback
      return "Mensagem sem título"
    } catch {
      return "Mensagem sem título"
    }
  }, [])

  // Função para colorir diferentes partes do JSON
  const syntaxHighlight = useCallback((json: string) => {
    return json
      .replace(/"([^"]+)":/g, '<span class="text-blue-400">"$1"</span>:')
      .replace(/: "([^"]+)"/g, ': <span class="text-green-400">"$1"</span>')
      .replace(/: (\d+)/g, ': <span class="text-yellow-400">$1</span>')
      .replace(/: (true|false)/g, ': <span class="text-purple-400">$1</span>')
      .replace(/null/g, '<span class="text-red-400">null</span>')
  }, [])

  const viewMessageDetails = useCallback(
    (message: DeadLetter) => {
      setSelectedMessage(message)
      setIsModalOpen(true)

      // Marcar a notificação como lida no sistema global
      markAsRead(message._id)
    },
    [markAsRead],
  )

  // Função para obter uma cor baseada na fila
  const getQueueColor = useCallback((queue: string): string => {
    // Hash simples para gerar uma cor consistente baseada no nome da fila
    const hash = queue.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0)
    const hue = hash % 360
    return `hsl(${hue}, 70%, 50%)`
  }, [])

  // Verificar se uma mensagem é nova (tem uma notificação não lida)
  const isNewMessage = useCallback(
    (messageId: string) => {
      return !hasNotification(messageId)
    },
    [hasNotification],
  )

  return (
    <Card className="flex flex-col h-[500px] border-zinc-800">
      <CardHeader className="pb-2 pt-3 px-4 border-b border-zinc-800 flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <Inbox className="h-4 w-4 text-red-400" />
          <CardTitle className="text-sm font-medium text-zinc-400">DeadLetter Queue</CardTitle>
          {deadletters.length > 0 && (
            <Badge variant="destructive" className="ml-2 text-[10px] py-0 h-4">
              {deadletters.length}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  className="h-8 w-8 p-0 border-zinc-700 bg-zinc-900 hover:bg-zinc-800"
                >
                  <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
                  <span className="sr-only">Atualizar</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left">
                <p className="text-xs">Atualizar lista</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </CardHeader>
      <CardContent className="flex-grow overflow-hidden p-0">
        <ScrollArea className="h-[430px]">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <RefreshCw className="h-5 w-5 text-zinc-400 animate-spin mr-2" />
              <p className="text-xs text-zinc-400">Carregando mensagens...</p>
            </div>
          ) : deadletters.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-2">
              <Inbox className="h-12 w-12 text-zinc-700" />
              <p className="text-sm text-zinc-500">Nenhuma mensagem na fila de DeadLetter</p>
              <p className="text-xs text-zinc-600">Todas as mensagens estão sendo processadas corretamente</p>
            </div>
          ) : (
            <div className="space-y-0.5">
              {deadletters.map((message) => {
                const queueColor = getQueueColor(message.queue)
                const title = extractTitle(message.message_content)
                const timeAgo = getTimeAgo(message.created_at)
                const isNew = isNewMessage(message._id)

                return (
                  <div
                    key={message._id}
                    className={`border-l-2 hover:bg-zinc-900/50 transition-colors cursor-pointer px-4 py-3 ${
                      isNew ? "bg-zinc-900/30" : ""
                    }`}
                    style={{ borderLeftColor: queueColor }}
                    onClick={() => viewMessageDetails(message)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <AlertCircle className={`h-4 w-4 ${isNew ? "text-red-400" : "text-zinc-500"} shrink-0`} />
                        <div>
                          <h4 className="text-sm font-medium text-white truncate max-w-[250px]">
                            {title}
                            {isNew && <Badge className="ml-2 bg-red-500 text-[10px] py-0 h-4 px-1">Nova</Badge>}
                          </h4>
                          <div className="flex items-center gap-2 mt-0.5">
                            <Badge variant="outline" className="border-0 bg-zinc-800 text-[10px] py-0 h-4 px-1.5">
                              {message.queue}
                            </Badge>
                            <span className="text-[10px] text-zinc-500 flex items-center">
                              <Clock className="h-3 w-3 mr-1 inline" />
                              {timeAgo}
                            </span>
                          </div>
                        </div>
                      </div>
                      <ArrowRightCircle className="h-4 w-4 text-zinc-600 hover:text-zinc-400 transition-colors" />
                    </div>
                    <div className="bg-zinc-900/50 rounded-md p-2 border border-zinc-800 mt-1">
                      <p className="text-[10px] font-mono overflow-x-auto whitespace-pre-wrap text-zinc-400">
                        {truncateContent(message.message_content, 150)}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </ScrollArea>
      </CardContent>

      {/* Modal de detalhes da mensagem */}
      {selectedMessage && (
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className=" w-[1200px]  p-0">
            <DialogHeader className="p-4 border-b border-zinc-800 flex flex-row items-center">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-red-400" />
                <DialogTitle>Detalhes da Mensagem DeadLetter</DialogTitle>
              </div>
            </DialogHeader>
            <div className="flex-1 overflow-hidden">
              <ScrollArea className="">
                <div className="p-6 bg-zinc-950">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-zinc-900 p-4 rounded-lg border border-zinc-800">
                      <p className="text-xs text-zinc-500 mb-1">ID da Mensagem</p>
                      <p className="text-sm font-mono text-zinc-300 break-all">{selectedMessage._id}</p>
                    </div>
                    <div className="bg-zinc-900 p-4 rounded-lg border border-zinc-800">
                      <p className="text-xs text-zinc-500 mb-1">Fila</p>
                      <div className="flex items-center gap-2">
                        <Badge className="text-xs" style={{ backgroundColor: getQueueColor(selectedMessage.queue) }}>
                          {selectedMessage.queue}
                        </Badge>
                      </div>
                    </div>
                    <div className="bg-zinc-900 p-4 rounded-lg border border-zinc-800">
                      <p className="text-xs text-zinc-500 mb-1">Data de Criação</p>
                      <p className="text-sm text-zinc-300">{new Date(selectedMessage.created_at).toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="bg-zinc-900 p-4 rounded-lg border border-zinc-800">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium text-zinc-300">Conteúdo da Mensagem</p>
                      <Badge variant="outline" className="text-[10px]">
                        JSON
                      </Badge>
                    </div>
                    <pre className="font-mono text-sm whitespace-pre-wrap break-all bg-zinc-950 p-4 rounded border border-zinc-800 max-h-[400px] overflow-auto">
                      <code
                        dangerouslySetInnerHTML={{
                          __html: syntaxHighlight(formatContent(selectedMessage.message_content)),
                        }}
                      />
                    </pre>
                  </div>
                </div>
              </ScrollArea>
            </div>
            <div className="p-4 border-t border-zinc-800 flex justify-end">
              <Button
                variant="outline"
                onClick={() => setIsModalOpen(false)}
                className="border-zinc-700 hover:bg-zinc-800"
              >
                Fechar
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </Card>
  )
}
