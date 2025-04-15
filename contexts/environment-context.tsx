"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"

export type Environment = "DEV" | "HOMOLOG" | "PRODUCTION"

interface EnvironmentContextType {
  environment: Environment
  setEnvironment: (env: Environment) => void
}

const EnvironmentContext = createContext<EnvironmentContextType | undefined>(undefined)

export function EnvironmentProvider({ children }: { children: React.ReactNode }) {
  // Inicializa com o valor do localStorage ou padrão "DEV"
  const [environment, setEnvironment] = useState<Environment>("DEV")

  // Carrega a preferência do usuário do localStorage
  useEffect(() => {
    const savedEnvironment = localStorage.getItem("selected-environment")
    if (savedEnvironment && ["DEV", "HOMOLOG", "PRODUCTION"].includes(savedEnvironment)) {
      setEnvironment(savedEnvironment as Environment)
    }
  }, [])

  // Salva a preferência do usuário no localStorage
  const handleSetEnvironment = (env: Environment) => {
    setEnvironment(env)
    localStorage.setItem("selected-environment", env)
  }

  return (
    <EnvironmentContext.Provider value={{ environment, setEnvironment: handleSetEnvironment }}>
      {children}
    </EnvironmentContext.Provider>
  )
}

export function useEnvironment() {
  const context = useContext(EnvironmentContext)
  if (context === undefined) {
    throw new Error("useEnvironment must be used within an EnvironmentProvider")
  }
  return context
}
