"use client"

import { useCallback, useEffect, useState } from "react"

import { checkServicesHealth } from "@/app/actions/health-check"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Loader2 } from "lucide-react"
import { useEnvironment } from "@/contexts/environment-context"

export type ServiceStatus = "online" | "degraded" | "offline"

interface ServiceStatusData {
  name: string
  status: ServiceStatus
  uptime: number
  responseTime?: number
  lastChecked?: Date
}

const serviceDescriptions: Record<string, string> = {
  CBA: "Camada de interação com o usuário",
  CBG: "Comunicação com provedor bancário",
  CBC: "Envio de e-mail para cliente",
  CBS: "Serviço de estatísticas",
  FPS: "Geração de PDF dos boletos",
}

export function ServiceStatusCards() {
  const [services, setServices] = useState<ServiceStatusData[]>([])
  const [loading, setLoading] = useState(true)

  const { environment } = useEnvironment()

  const loadServices = useCallback(async () => {
    try {
      setLoading(true)
      const healthData = await checkServicesHealth(environment)
      setServices(healthData)
     
    } catch (error) {
      console.error("Erro ao verificar status dos serviços:", error)
    } finally {
      setLoading(false)
    }
  }, [environment])

  useEffect(() => {
    loadServices()
    const interval = setInterval(loadServices, 60000)
    return () => clearInterval(interval)
  }, [environment, loadServices])

  if (loading) {
    return (
      <TooltipProvider>
        <div className="flex justify-between items-center w-full gap-2 px-1 py-2">
          {["CBA", "CBG", "CBC", "CBS", "FPS"].map((serviceName) => (
            <Tooltip key={serviceName}>
              <TooltipTrigger asChild>
                <div className="flex flex-col items-center border rounded px-4 py-2 w-full">
                  <div className="flex items-center justify-between w-full mb-1">
                    <span className="font-medium text-sm">{serviceName}</span>
                    <Loader2 className="h-3 w-3 text-zinc-500 animate-spin" />
                  </div>
                  <div className="flex justify-between w-full text-xs text-zinc-400">
                    <span><Loader2 className="h-3 w-3 text-zinc-500 animate-spin" /></span>
                    <span><Loader2 className="h-3 w-3 text-zinc-500 animate-spin" /></span>
                  </div>
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="bg-zinc-800 border-zinc-700">
                <div className="text-xs">
                  <p className="font-medium">{serviceDescriptions[serviceName]}</p>
                  <p className="text-zinc-400 mt-1">Carregando...</p>
                </div>
              </TooltipContent>
            </Tooltip>
          ))}
        </div>
      </TooltipProvider>
    )
  }

  return (
    <TooltipProvider>
      <div className="flex justify-between items-center w-full gap-2 px-1 py-2">
        {services.map((service) => (
          <Tooltip key={service.name}>
            <TooltipTrigger asChild>
              <div className="flex flex-col items-center border rounded px-4 py-2 w-full">
                <div className="flex items-center justify-between w-full mb-1">
                  <span className="font-medium text-sm">{service.name}</span>
                  <StatusIndicator status={service.status} />
                </div>
                <div className="flex justify-between w-full text-xs text-zinc-400">
                  <span>{service.uptime}%</span>
                  {service.responseTime && <span>{service.responseTime}ms</span>}
                </div>
              </div>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="bg-zinc-800 border-zinc-700">
              <div className="text-xs text-zinc-400 pt-4">
                <p className="font-medium">{serviceDescriptions[service.name]}</p>
                <p className="text-zinc-400 mt-1">Uptime: {service.uptime}%</p>
                {service.responseTime && <p className="text-zinc-400">Resposta: {service.responseTime}ms</p>}
                <p className="text-zinc-400">Ambiente: {environment}</p>
              </div>
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </TooltipProvider>
  )
}

function StatusIndicator({ status }: { status: ServiceStatus }) {
  if (status === "online") {
    return <Badge className="bg-green-500 hover:bg-green-500 h-2 w-2 rounded-full p-0" />
  } else if (status === "degraded") {
    return <Badge className="bg-yellow-500 hover:bg-yellow-500 h-2 w-2 rounded-full p-0" />
  } else {
    return <Badge className="bg-red-500 hover:bg-red-500 h-2 w-2 rounded-full p-0" />
  }
}
