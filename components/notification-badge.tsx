"use client"

import { useState } from "react"
import { Bell } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { DeadLetter } from "@/app/actions/rabbitmq-deadletters"

interface NotificationBadgeProps {
  count: number
  notifications: DeadLetter[]
  onMarkAllAsRead: () => void
  onViewNotification: (message: DeadLetter) => void
}

export function NotificationBadge({
  count,
  notifications,
  onMarkAllAsRead,
  onViewNotification,
}: NotificationBadgeProps) {
  const [open, setOpen] = useState(false)

  const handleViewNotification = (message: DeadLetter) => {
    onViewNotification(message)
    setOpen(false)
  }

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

  // Função para extrair um título significativo do conteúdo da mensagem
  const extractTitle = (content: any): string => {
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
      return "Nova mensagem"
    } catch {
      return "Nova mensagem"
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="relative h-8 w-8 border-zinc-800 bg-zinc-900  hover:bg-zinc-800 cursor-pointer"
        >
          <Bell className="h-4 w-4" />
          {count > 0 && (
            <Badge className="absolute -top-1 -right-1 h-4 min-w-4 px-1 flex items-center justify-center bg-red-500 text-[10px]">
              {count > 99 ? "99+" : count}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0 bg-zinc-900 border-zinc-800" align="end">
        <div className="flex items-center justify-between p-3 border-b border-zinc-800">
          <h3 className="text-sm font-medium">Notificações</h3>
          {count > 0 && (
            <Button variant="ghost" size="sm" className="h-7 text-xs hover:bg-zinc-800" onClick={onMarkAllAsRead}>
              Marcar todas como lidas
            </Button>
          )}
        </div>

        <ScrollArea className="max-h-[300px]">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
              <Bell className="h-8 w-8 text-zinc-600 mb-2" />
              <p className="text-sm text-zinc-400">Nenhuma notificação</p>
              <p className="text-xs text-zinc-500 mt-1">Você será notificado quando novas mensagens chegarem</p>
            </div>
          ) : (
            <div className="py-1">
              {notifications.map((notification) => (
                <button
                  key={notification._id}
                  className="w-full text-left px-3 py-2 hover:bg-zinc-800 transition-colors"
                  onClick={() => handleViewNotification(notification)}
                >
                  <div className="flex items-start gap-2">
                    <div className="h-2 w-2 mt-1.5 rounded-full bg-red-500 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">
                        {extractTitle(notification.message_content?.metadata?.reason)}
                      </p>
                      <p className="text-xs text-zinc-400 truncate mt-0.5">{notification.queue}</p>
                      <p className="text-[10px] text-zinc-500 mt-1">{formatRelativeTime(notification.created_at)}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  )
}
