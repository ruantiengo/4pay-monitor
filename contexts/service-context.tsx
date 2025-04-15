"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"

export type ServiceType = "CBA" | "CBG" | "CBC" | "CBS" | "FPS" | "ALL"

interface ServiceContextType {
  service: ServiceType
  setService: (service: ServiceType) => void
}

const ServiceContext = createContext<ServiceContextType | undefined>(undefined)

export function ServiceProvider({ children }: { children: React.ReactNode }) {
  // Inicializa com o valor do localStorage ou padrão "ALL"
  const [service, setService] = useState<ServiceType>("ALL")

  // Carrega a preferência do usuário do localStorage
  useEffect(() => {
    const savedService = localStorage.getItem("selected-service")
    if (savedService && ["CBA", "CBG", "CBC", "CBS", "FPS", "ALL"].includes(savedService)) {
      setService(savedService as ServiceType)
    }
  }, [])

  // Salva a preferência do usuário no localStorage
  const handleSetService = (svc: ServiceType) => {
    setService(svc)
    localStorage.setItem("selected-service", svc)
  }

  return <ServiceContext.Provider value={{ service, setService: handleSetService }}>{children}</ServiceContext.Provider>
}

export function useService() {
  const context = useContext(ServiceContext)
  if (context === undefined) {
    throw new Error("useService must be used within a ServiceProvider")
  }
  return context
}
