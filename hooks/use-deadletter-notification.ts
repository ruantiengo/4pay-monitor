"use client"

import { DeadLetter } from "@/app/actions/rabbitmq-deadletters"
import { useState, useEffect, useRef } from "react"

interface DeadLetterNotificationState {
  lastCheckedCount: number
  lastCheckedIds: string[]
  newMessages: DeadLetter[]
}

export function useDeadLetterNotifications(deadletters: DeadLetter[], environment: string) {
  const [notifications, setNotifications] = useState<DeadLetter[]>([])
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [hasNewMessages, setHasNewMessages] = useState(false)

  // Inicializar o elemento de áudio
  useEffect(() => {
    if (typeof window !== "undefined") {
      audioRef.current = new Audio("/sounds/notification.wav")
    }
    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
    }
  }, [])

  // Carregar o estado anterior do localStorage
  useEffect(() => {
    if (typeof window === "undefined") return

    const storageKey = `deadletter-notifications-${environment}`
    const savedState = localStorage.getItem(storageKey)

    if (!savedState) {
      // Se não houver estado salvo, inicializar com os valores atuais
      const initialState: DeadLetterNotificationState = {
        lastCheckedCount: deadletters.length,
        lastCheckedIds: deadletters.map((msg) => msg._id),
        newMessages: [],
      }
      localStorage.setItem(storageKey, JSON.stringify(initialState))
      return
    }

    try {
      const parsedState: DeadLetterNotificationState = JSON.parse(savedState)


      const previousIds = new Set(parsedState.lastCheckedIds)

      // Encontrar mensagens que existem agora mas não existiam antes
      const newMessages = deadletters.filter((msg) => !previousIds.has(msg._id))

      if (newMessages.length > 0) {
        setNotifications(newMessages)
        setHasNewMessages(true)

        // Tocar o som de notificação
        if (audioRef.current) {
          audioRef.current.play().catch((err) => console.error("Erro ao reproduzir som:", err))
        }
      }
    } catch (error) {
      console.error("Erro ao processar estado de notificações:", error)
    }
  }, [deadletters, environment])

  // Função para marcar todas as notificações como lidas
  const markAllAsRead = () => {
    if (typeof window === "undefined") return

    const storageKey = `deadletter-notifications-${environment}`
    const newState: DeadLetterNotificationState = {
      lastCheckedCount: deadletters.length,
      lastCheckedIds: deadletters.map((msg) => msg._id),
      newMessages: [],
    }

    localStorage.setItem(storageKey, JSON.stringify(newState))
    setNotifications([])
    setHasNewMessages(false)
  }

  // Função para marcar uma notificação específica como lida
  const markAsRead = (messageId: string) => {
    if (typeof window === "undefined") return

    const storageKey = `deadletter-notifications-${environment}`
    const savedState = localStorage.getItem(storageKey)

    if (savedState) {
      try {
        const parsedState: DeadLetterNotificationState = JSON.parse(savedState)

        // Adicionar o ID à lista de IDs já vistos
        if (!parsedState.lastCheckedIds.includes(messageId)) {
          parsedState.lastCheckedIds.push(messageId)
        }

        localStorage.setItem(storageKey, JSON.stringify(parsedState))

        // Atualizar o estado local
        setNotifications((prev) => prev.filter((msg) => msg._id !== messageId))

        if (notifications.length <= 1) {
          setHasNewMessages(false)
        }
      } catch (error) {
        console.error("Erro ao marcar notificação como lida:", error)
      }
    }
  }

  return {
    notifications,
    hasNewMessages,
    markAllAsRead,
    markAsRead,
    notificationCount: notifications.length,
  }
}
