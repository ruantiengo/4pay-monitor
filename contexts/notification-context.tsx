"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect, useRef, useCallback } from "react"
import { useEnvironment } from "./environment-context"
import { DeadLetter } from "@/app/actions/rabbitmq-deadletters"


// Tipo genérico para notificações
export type NotificationType = "deadletter" | "alert" | "system" | "update"

export interface Notification {
  id: string
  type: NotificationType
  title: string
  message: string
  timestamp: string
  read: boolean
  data?: any // Dados adicionais específicos do tipo de notificação
  environment?: string // Ambiente da notificação
}

interface NotificationContextType {
  notifications: Notification[]
  allNotifications: Notification[] // Todas as notificações, incluindo as de outros ambientes
  unreadCount: number
  addNotification: (notification: Omit<Notification, "read">) => void
  addNotifications: (notifications: Omit<Notification, "read">[]) => void
  markAsRead: (id: string) => void
  markAllAsRead: () => void
  clearNotifications: () => void
  hasNotification: (id: string) => boolean // Nova função para verificar se uma notificação existe
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [allNotifications, setAllNotifications] = useState<Notification[]>([]) 
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const { environment } = useEnvironment()
  const initialLoadRef = useRef<Record<string, boolean>>({})
  const initialLoadAllRef = useRef(false)

  // Inicializar o elemento de áudio apenas uma vez
  useEffect(() => {
    if (typeof window !== "undefined" && !audioRef.current) {
      audioRef.current = new Audio("/sounds/notification.mkv")
    }
    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
    }
  }, [])

  // Calcular o número de notificações não lidas
  const unreadCount = notifications.filter((n) => !n.read).length

  // Verificar se uma notificação existe (por ID)
  const hasNotification = useCallback(
    (id: string) => {
      return allNotifications.some((n) => n.id === id)
    },
    [allNotifications],
  )

  // Adicionar uma única notificação - usando useCallback para evitar recriações desnecessárias
  const addNotification = useCallback(
    (notification: Omit<Notification, "read">) => {
      // Verificar se a notificação já existe em TODAS as notificaç��es
      if (hasNotification(notification.id)) return

      // Adicionar o ambiente atual se não estiver definido
      const notificationWithEnv = {
        ...notification,
        environment: notification.environment || environment,
      }

      // Tocar o som de notificação
      if (audioRef.current) {
        audioRef.current.play().catch((err) => console.error("Erro ao reproduzir som:", err))
      }

      // Adicionar à lista de todas as notificações
      setAllNotifications((prev) => [{ ...notificationWithEnv, read: false }, ...prev])

      // Adicionar à lista filtrada por ambiente
      setNotifications((prev) => {
        if (notificationWithEnv.environment === environment) {
          return [{ ...notificationWithEnv, read: false }, ...prev]
        }
        return prev
      })
    },
    [environment, hasNotification],
  )

  // Adicionar múltiplas notificações - usando useCallback para evitar recriações desnecessárias
  const addNotifications = useCallback(
    (newNotifications: Omit<Notification, "read">[]) => {
      if (newNotifications.length === 0) return

      // Filtrar apenas notificações que ainda não existem em TODAS as notificações
      const uniqueNotifications = newNotifications.filter((newNotif) => !hasNotification(newNotif.id))

      if (uniqueNotifications.length === 0) return

      // Adicionar o ambiente atual se não estiver definido
      const notificationsWithEnv = uniqueNotifications.map((n) => ({
        ...n,
        environment: n.environment || environment,
        read: false,
      }))

      // Tocar o som de notificação apenas uma vez para o lote
      if (uniqueNotifications.length > 0 && audioRef.current) {
        audioRef.current.play().catch((err) => console.error("Erro ao reproduzir som:", err))
      }

      // Adicionar à lista de todas as notificações
      setAllNotifications((prev) => [...notificationsWithEnv, ...prev])

      // Adicionar à lista filtrada por ambiente
      setNotifications((prev) => {
        const forCurrentEnv = notificationsWithEnv.filter((n) => n.environment === environment)
        if (forCurrentEnv.length > 0) {
          return [...forCurrentEnv, ...prev]
        }
        return prev
      })
    },
    [environment, hasNotification],
  )

  // Marcar uma notificação como lida - usando useCallback
  const markAsRead = useCallback((id: string) => {
    // Atualizar em todas as notificações
    setAllNotifications((prev) =>
      prev.map((notification) => (notification.id === id ? { ...notification, read: true } : notification)),
    )

    // Atualizar na lista filtrada
    setNotifications((prev) =>
      prev.map((notification) => (notification.id === id ? { ...notification, read: true } : notification)),
    )
  }, [])

  // Marcar todas as notificações como lidas - usando useCallback
  const markAllAsRead = useCallback(() => {
    // Atualizar em todas as notificações
    setAllNotifications((prev) =>
      prev.map((notification) =>
        notification.environment === environment ? { ...notification, read: true } : notification,
      ),
    )

    // Atualizar na lista filtrada
    setNotifications((prev) => prev.map((notification) => ({ ...notification, read: true })))
  }, [environment])

  // Limpar todas as notificações - usando useCallback
  const clearNotifications = useCallback(() => {
    // Remover do ambiente atual em todas as notificações
    setAllNotifications((prev) => prev.filter((notification) => notification.environment !== environment))

    // Limpar a lista filtrada
    setNotifications([])
  }, [environment])

  // Carregar TODAS as notificações do localStorage uma única vez na inicialização
  useEffect(() => {
    if (typeof window === "undefined" || initialLoadAllRef.current) return

    initialLoadAllRef.current = true

    // Carregar notificações de todos os ambientes
    const environments = ["DEV", "HOMOLOG", "PRODUCTION"]
    let allLoadedNotifications: Notification[] = []

    environments.forEach((env) => {
      const storageKey = `notifications-${env}`
      const savedNotifications = localStorage.getItem(storageKey)

      if (savedNotifications) {
        try {
          const parsedNotifications = JSON.parse(savedNotifications) as Notification[]
          allLoadedNotifications = [...allLoadedNotifications, ...parsedNotifications]
        } catch (error) {
          console.error(`Erro ao carregar notificações do ambiente ${env}:`, error)
        }
      }
    })

    // Definir todas as notificações carregadas
    setAllNotifications(allLoadedNotifications)

    console.log(`Carregadas ${allLoadedNotifications.length} notificações de todos os ambientes`)
  }, [])

  // Carregar notificações do localStorage ao iniciar ou quando o ambiente mudar
  useEffect(() => {
    if (typeof window === "undefined") return

    const storageKey = `notifications-${environment}`

    // Verificar se já carregamos este ambiente antes para evitar carregamentos duplicados
    if (initialLoadRef.current[environment]) return

    const savedNotifications = localStorage.getItem(storageKey)
    if (savedNotifications) {
      try {
        const parsedNotifications = JSON.parse(savedNotifications) as Notification[]

        // Atualizar as notificações do ambiente atual
        setNotifications(parsedNotifications)

        // Marcar que já carregamos este ambiente
        initialLoadRef.current[environment] = true

        console.log(`Carregadas ${parsedNotifications.length} notificações do ambiente ${environment}`)
      } catch (error) {
        console.error("Erro ao carregar notificações:", error)
        // Não limpar as notificações existentes em caso de erro
      }
    } else {
      // Se não houver notificações para este ambiente, apenas marcar como carregado
      initialLoadRef.current[environment] = true
      setNotifications([])
    }
  }, [environment])

  // Remover notificações de deadletter com mais de 7 dias que já foram lidas
  // Usando um efeito separado com uma dependência estável
  useEffect(() => {
    if (allNotifications.length === 0) return

    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const filteredAllNotifications = allNotifications.filter((notification) => {
      // Manter todas as notificações que não são do tipo deadletter
      if (notification.type !== "deadletter") return true

      // Manter todas as notificações não lidas, independentemente da idade
      if (!notification.read) return true

      // Para notificações lidas do tipo deadletter, verificar se têm menos de 7 dias
      const notificationDate = new Date(notification.timestamp)
      return notificationDate > sevenDaysAgo
    })

    // Atualizar as notificações se alguma foi removida
    if (filteredAllNotifications.length < allNotifications.length) {
      setAllNotifications(filteredAllNotifications)

      // Também atualizar a lista filtrada por ambiente
      setNotifications((prev) => {
        const filteredIds = new Set(filteredAllNotifications.map((n) => n.id))
        return prev.filter((n) => filteredIds.has(n.id))
      })
    }
  }, [allNotifications.length]) // Dependência mais estável

  // Atualizar a lista filtrada quando o ambiente mudar
  useEffect(() => {
    const filteredNotifications = allNotifications.filter((n) => n.environment === environment)
    setNotifications(filteredNotifications)
  }, [environment, allNotifications])

  // Salvar notificações no localStorage quando mudar
  // Usando um efeito com debounce para evitar escritas frequentes
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (typeof window === "undefined" || allNotifications.length === 0) return

    // Limpar timeout anterior se existir
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }

    // Configurar um novo timeout para salvar (debounce)
    saveTimeoutRef.current = setTimeout(() => {
      // Agrupar notificações por ambiente
      const notificationsByEnv: Record<string, Notification[]> = {}

      allNotifications.forEach((notification) => {
        const env = notification.environment || "unknown"
        if (!notificationsByEnv[env]) {
          notificationsByEnv[env] = []
        }
        notificationsByEnv[env].push(notification)
      })

      // Salvar cada grupo no seu próprio localStorage
      Object.entries(notificationsByEnv).forEach(([env, envNotifications]) => {
        const storageKey = `notifications-${env}`
        localStorage.setItem(storageKey, JSON.stringify(envNotifications))
      })

      saveTimeoutRef.current = null
    }, 300) // Debounce de 300ms

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [allNotifications])

  // Limitar o número máximo de notificações armazenadas
  useEffect(() => {
    const MAX_NOTIFICATIONS = 100
    if (allNotifications.length > MAX_NOTIFICATIONS) {
      // Agrupar notificações por ambiente
      const notificationsByEnv: Record<string, Notification[]> = {}

      allNotifications.forEach((notification) => {
        const env = notification.environment || "unknown"
        if (!notificationsByEnv[env]) {
          notificationsByEnv[env] = []
        }
        notificationsByEnv[env].push(notification)
      })

      // Para cada ambiente, manter apenas as notificações mais recentes
      const limitedNotifications: Notification[] = []

      Object.entries(notificationsByEnv).forEach(([env, envNotifications]) => {
        // Ordenar por timestamp (mais recente primeiro)
        const sorted = [...envNotifications].sort(
          (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
        )

        // Manter apenas as MAX_NOTIFICATIONS/3 mais recentes por ambiente (ou menos)
        const limit = Math.floor(MAX_NOTIFICATIONS / 3)
        limitedNotifications.push(...sorted.slice(0, limit))
      })

      setAllNotifications(limitedNotifications)

      // Também atualizar a lista filtrada por ambiente
      setNotifications(limitedNotifications.filter((n) => n.environment === environment))
    }
  }, [allNotifications.length, environment])

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        allNotifications,
        unreadCount,
        addNotification,
        addNotifications,
        markAsRead,
        markAllAsRead,
        clearNotifications,
        hasNotification,
      }}
    >
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotifications() {
  const context = useContext(NotificationContext)
  if (context === undefined) {
    throw new Error("useNotifications must be used within a NotificationProvider")
  }
  return context
}

// Utilitário para converter DeadLetter para Notification
export function deadLetterToNotification(deadletter: DeadLetter, env?: string): Omit<Notification, "read"> {
  // Extrair o nome curto da fila (apenas a última parte após o ponto)
  
  const queueName = deadletter.queue.split(".").pop() || deadletter.queue

  return {
    id: deadletter._id,
    type: "deadletter",
    title: "Nova mensagem na fila",
    message: `Nova mensagem na fila ${queueName}`,
    timestamp: deadletter.created_at,
    data: deadletter,
    environment: env, // Incluir o ambiente passado como parâmetro
  }
}
