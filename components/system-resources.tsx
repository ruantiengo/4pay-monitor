"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Cpu, Database, HardDrive, MemoryStickIcon as Memory } from "lucide-react"
import { fetchSystemResources } from "@/app/actions/metrics"
import { useEnvironment } from "@/contexts/environment-context"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface ResourceUsage {
  name: string
  usage: number
  total: number
  unit: string
}

const iconMap: Record<string, any> = {
  CPU: Cpu,
  Memória: Memory,
  Disco: HardDrive,
  "Banco de Dados": Database,
}

// Dados simulados para desenvolvimento
const getMockResources = (environment: string, service: string): ResourceUsage[] => {
  // Multiplicador baseado no ambiente
  const envMultiplier = environment === "PRODUCTION" ? 1 : environment === "HOMOLOG" ? 0.7 : 0.4

  // Valores base para cada serviço
  const serviceBaseValues: Record<string, any> = {
    CBA: { cpu: 40, memory: 50, disk: 150, db: 70 },
    CBG: { cpu: 35, memory: 45, disk: 120, db: 65 },
    CBC: { cpu: 25, memory: 35, disk: 100, db: 55 },
    CBS: { cpu: 30, memory: 40, disk: 110, db: 60 },
    FPS: { cpu: 45, memory: 55, disk: 160, db: 75 },
  }

  // Selecionar valores base do serviço escolhido
  const baseValues = serviceBaseValues[service]

  // Adicionar variação aleatória
  const randomVariation = () => Math.random() * 20 - 10

  return [
    {
      name: "CPU",
      usage: Math.round(baseValues.cpu * envMultiplier + randomVariation()),
      total: 100,
      unit: "%",
    },
    {
      name: "Memória",
      usage: Math.round(baseValues.memory * envMultiplier + randomVariation()),
      total: 100,
      unit: "%",
    },
    {
      name: "Disco",
      usage: Math.round(baseValues.disk * envMultiplier + randomVariation()),
      total: 512,
      unit: "GB",
    },
    {
      name: "Banco de Dados",
      usage: Math.round(baseValues.db * envMultiplier + randomVariation()),
      total: 100,
      unit: "%",
    },
  ]
}

export function SystemResources() {
  const [resources, setResources] = useState<ResourceUsage[]>([])
  const [loading, setLoading] = useState(true)
  const { environment } = useEnvironment()
  const [selectedService, setSelectedService] = useState("CBA")

  useEffect(() => {
    async function loadResources() {
      try {
        setLoading(true)

        // Em produção, buscar dados reais do servidor
        // Em desenvolvimento, usar dados simulados
        if (process.env.NODE_ENV === "production") {
          const data = await fetchSystemResources(environment)
          setResources(data)
        } else {
          // Simular um atraso de rede
          await new Promise((resolve) => setTimeout(resolve, 800))
          setResources(getMockResources(environment, selectedService))
        }
      } catch (error) {
        console.error("Erro ao carregar recursos:", error)
        // Em caso de erro, usar dados simulados
        setResources(getMockResources(environment, selectedService))
      } finally {
        setLoading(false)
      }
    }

    loadResources()

    // Atualizar a cada 60 segundos
    const interval = setInterval(loadResources, 60000)
    return () => clearInterval(interval)
  }, [environment, selectedService]) // Recarregar quando o ambiente ou serviço mudar

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Recursos do Sistema</CardTitle>
          <CardDescription>Utilização atual dos recursos ({environment})</CardDescription>
        </div>
        <Select value={selectedService} onValueChange={setSelectedService}>
          <SelectTrigger className="w-[120px]">
            <SelectValue placeholder="Serviço" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="CBA">CBA</SelectItem>
            <SelectItem value="CBG">CBG</SelectItem>
            <SelectItem value="CBC">CBC</SelectItem>
            <SelectItem value="CBS">CBS</SelectItem>
            <SelectItem value="FPS">FPS</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="h-4 w-24 animate-pulse rounded bg-muted"></div>
                  <div className="h-4 w-16 animate-pulse rounded bg-muted"></div>
                </div>
                <div className="h-2 w-full animate-pulse rounded bg-muted"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-6">
            {resources.map((resource) => {
              const Icon = iconMap[resource.name] || Cpu
              const percentage = (resource.usage / resource.total) * 100
              const isHighUsage = percentage > 80

              return (
                <div key={resource.name} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">{resource.name}</span>
                    </div>
                    <div className="text-sm">
                      <span className={isHighUsage ? "text-red-500 font-medium" : ""}>{resource.usage}</span>
                      <span className="text-muted-foreground">
                        {" / "}
                        {resource.total}
                        {resource.unit}
                      </span>
                    </div>
                  </div>
                  <Progress
                    value={percentage}
                    className="h-2"
                    indicatorClassName={
                      percentage > 80 ? "bg-red-500" : percentage > 60 ? "bg-yellow-500" : "bg-green-500"
                    }
                  />
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
