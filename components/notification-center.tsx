"use client"

import { useState } from "react"
import { Bell, AlertTriangle, Clock } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useNotifications, type NotificationType } from "@/contexts/notification-context"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

export function   NotificationCenter() {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications()
  console.log("Cade os nots", notifications);
  
  const [open, setOpen] = useState(false)
  const [selectedNotification, setSelectedNotification] = useState<any>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Função para formatar a data relativa
  const formatRelativeTime = (timestamp: string) => {
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
  }

  // Função para obter ícone baseado no tipo de notificação
  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case "deadletter":
        return <AlertTriangle className="h-4 w-4 text-red-500" />
      case "alert":
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      case "system":
        return <AlertTriangle className="h-4 w-4 text-blue-500" />
      case "update":
        return <AlertTriangle className="h-4 w-4 text-green-500" />
      default:
        return <AlertTriangle className="h-4 w-4 text-zinc-500" />
    }
  }

  const handleNotificationClick = (notification: any) => {
    // Marcar como lida
    markAsRead(notification.id)

    // Se for uma notificação de deadletter, abrir o modal
    if (notification.type === "deadletter" && notification.data) {
      setSelectedNotification(notification.data)
      setIsModalOpen(true)
      setOpen(false)
    }
  }

  // Função para colorir diferentes partes do JSON
  const syntaxHighlight = (json: string) => {
    return json
      .replace(/"([^"]+)":/g, '<span class="text-blue-400">"$1"</span>:')
      .replace(/: "([^"]+)"/g, ': <span class="text-green-400">"$1"</span>')
      .replace(/: (\d+)/g, ': <span class="text-yellow-400">$1</span>')
      .replace(/: (true|false)/g, ': <span class="text-purple-400">$1</span>')
      .replace(/null/g, '<span class="text-red-400">null</span>')
  }

  const formatContent = (content: any) => {
    try {
      if (typeof content === "string") {
        return content
      }
      return JSON.stringify(content, null, 2)
    } catch {
      return "Erro ao formatar conteúdo"
    }
  }

  // Função para obter uma cor baseada na fila
  const getQueueColor = (queue: string): string => {
    // Hash simples para gerar uma cor consistente baseada no nome da fila
    const hash = queue.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0)
    const hue = hash % 360
    return `hsl(${hue}, 70%, 50%)`
  }

  // Extrair o nome curto da fila (apenas a última parte após o ponto)
  const getShortQueueName = (queue: string): string => {
    return queue.split(".").pop() || queue
  }

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="relative h-8 w-8 border-zinc-800 bg-zinc-900 hover:bg-zinc-800 cursor-pointer"
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <Badge className="absolute -top-1 -right-1 h-4 min-w-4 px-1 flex items-center justify-center bg-red-500 text-[10px]">
                {unreadCount > 99 ? "99+" : unreadCount}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[350px] p-0 bg-zinc-900 border-zinc-800" align="end" sideOffset={5}>
          <div className="flex items-center justify-between p-3 border-b border-zinc-800">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-medium">Notificações</h3>
              {unreadCount > 0 && (
                <Badge variant="destructive" className="text-[10px] py-0 h-4">
                  {unreadCount}
                </Badge>
              )}
            </div>
            {unreadCount > 0 && (
              <Button variant="ghost" size="sm" className="h-7 text-xs hover:bg-zinc-800" onClick={markAllAsRead}>
                Marcar todas como lidas
              </Button>
            )}
          </div>

          <ScrollArea className="h-[350px]">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
                <Bell className="h-8 w-8 text-zinc-600 mb-2" />
                <p className="text-sm text-zinc-400">Nenhuma notificação</p>
                <p className="text-xs text-zinc-500 mt-1">Você será notificado quando houver novidades</p>
              </div>
            ) : (
              <div className="py-1">
                {notifications.map((notification) => (
                  <button
                    key={notification.id}
                    className={`w-full text-left px-4 py-3 hover:bg-zinc-800/70 transition-colors border-b border-zinc-800/30 last:border-0 ${
                      !notification.read ? "bg-zinc-800/30" : ""
                    }`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 shrink-0">{getNotificationIcon(notification.type)}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className={`text-sm font-medium ${!notification.read ? "text-white" : "text-zinc-300"}`}>
                            {notification.title}
                          </p>
                          {!notification.read && <div className="h-2 w-2 rounded-full bg-red-500 shrink-0" />}
                        </div>
                        <p className="text-xs text-zinc-400 mt-0.5 line-clamp-1">{notification.message}</p>
                        <div className="flex items-center gap-2 mt-1.5">
                          {notification.type === "deadletter" && notification.data?.queue && (
                            <Badge
                              className="text-[10px] py-0 h-5 px-1.5"
                              style={{
                                backgroundColor: getQueueColor(notification.data.queue),
                              }}
                            >
                              {getShortQueueName(notification.data.queue)}
                            </Badge>
                          )}
                          <span className="text-[10px] text-zinc-500 flex items-center">
                            <Clock className="h-3 w-3 mr-1 inline" />
                            {formatRelativeTime(notification.timestamp)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>
        </PopoverContent>
      </Popover>

      {/* Modal de detalhes da mensagem */}
      {selectedNotification && (
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="max-w-[95vw] w-[1200px] max-h-[90vh] p-0">
            <DialogHeader className="p-4 border-b border-zinc-800 flex flex-row items-center">
              <div className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-red-400" />
                <DialogTitle>Detalhes da Mensagem DeadLetter</DialogTitle>
              </div>
            </DialogHeader>
            <div className="flex-1 overflow-hidden">
              <ScrollArea className="h-[calc(90vh-120px)]">
                <div className="p-6 bg-zinc-950">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-zinc-900 p-4 rounded-lg border border-zinc-800">
                      <p className="text-xs text-zinc-500 mb-1">ID da Mensagem</p>
                      <p className="text-sm font-mono text-zinc-300 break-all">{selectedNotification._id}</p>
                    </div>
                    <div className="bg-zinc-900 p-4 rounded-lg border border-zinc-800">
                      <p className="text-xs text-zinc-500 mb-1">Fila</p>
                      <div className="flex items-center gap-2">
                        <Badge
                          className="text-xs"
                          style={{ backgroundColor: getQueueColor(selectedNotification.queue) }}
                        >
                          {selectedNotification.queue}
                        </Badge>
                      </div>
                    </div>
                    <div className="bg-zinc-900 p-4 rounded-lg border border-zinc-800">
                      <p className="text-xs text-zinc-500 mb-1">Data de Criação</p>
                      <p className="text-sm text-zinc-300">
                        {new Date(selectedNotification.created_at).toLocaleString()}
                      </p>
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
                          __html: syntaxHighlight(formatContent(selectedNotification.message_content)),
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
    </>
  )
}
