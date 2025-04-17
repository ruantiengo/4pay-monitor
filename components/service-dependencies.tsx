"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Network } from "lucide-react"
import { useEnvironment } from "@/contexts/environment-context"
import { fetchServiceStatus } from "@/app/actions/metrics"
import type { ServiceStatus } from "@/components/service-status-card"

export function ServiceDependencies() {
  const { environment } = useEnvironment()
  const [services, setServices] = useState<Record<string, ServiceStatus>>({
    CBA: "online",
    CBG: "online",
    CBC: "online",
    CBS: "online",
    FPS: "online",
    Shipay: "online",
  })

  useEffect(() => {
    async function loadServiceStatus() {
      try {
      
        // Em produção, buscar dados reais do servidor
        if (process.env.NODE_ENV === "production") {
          const data = await fetchServiceStatus(environment)
          const statusMap: Record<string, ServiceStatus> = {}
          data.forEach((service) => {
            statusMap[service.name] = service.status
          })

          // Adicionar Shipay (simular status com base no ambiente)
          if (environment === "PRODUCTION") {
            statusMap["Shipay"] = Math.random() > 0.95 ? "degraded" : "online"
          } else if (environment === "HOMOLOG") {
            statusMap["Shipay"] = Math.random() > 0.85 ? "degraded" : "online"
          } else {
            statusMap["Shipay"] = Math.random() > 0.7 ? "degraded" : Math.random() > 0.9 ? "offline" : "online"
          }

          setServices(statusMap)
        } else {
          // Simular um atraso de rede
          await new Promise((resolve) => setTimeout(resolve, 800))

          // Gerar status aleatórios para simulação
        
          const statusMap: Record<string, ServiceStatus> = {}

          // Maior probabilidade de estar online em produção
          const onlineChance = environment === "PRODUCTION" ? 0.9 : environment === "HOMOLOG" ? 0.7 : 0.6

          // Gerar status para cada serviço
          const serviceNames = ["CBA", "CBG", "CBC", "CBS", "FPS"]
          serviceNames.forEach((name) => {
            const random = Math.random()
            if (random < onlineChance) {
              statusMap[name] = "online"
            } else if (random < onlineChance + 0.2) {
              statusMap[name] = "degraded"
            } else {
              statusMap[name] = "offline"
            }
          })

          // Adicionar Shipay (simular status com base no ambiente)
          if (environment === "PRODUCTION") {
            statusMap["Shipay"] = Math.random() > 0.95 ? "degraded" : "online"
          } else if (environment === "HOMOLOG") {
            statusMap["Shipay"] = Math.random() > 0.85 ? "degraded" : "online"
          } else {
            statusMap["Shipay"] = Math.random() > 0.7 ? "degraded" : Math.random() > 0.9 ? "offline" : "online"
          }

          setServices(statusMap)
        }
      } catch (error) {
        console.error("Erro ao carregar status dos serviços: ", error)
      } 
    }

    loadServiceStatus()

    // Atualizar a cada 60 segundos
    const interval = setInterval(loadServiceStatus, 60000)
    return () => clearInterval(interval)
  }, [environment])



  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Network className="h-5 w-5" />
          Mapa de Dependências
        </CardTitle>
        <CardDescription>Arquitetura de serviços e integrações ({environment})</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex h-[800px] items-center justify-center bg-gradient-to-b from-background/50 to-background/30 rounded-lg p-4 overflow-auto">
          <svg width="100%" height="100%" viewBox="0 0 1200 800" className="max-w-full">
            {/* Definições e filtros */}
            <defs>
              <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="4" stdDeviation="4" floodOpacity="0.3" />
              </filter>

              <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto">
                <polygon points="0 0, 10 3.5, 0 7" fill="#64748B" />
              </marker>

              <marker id="external-arrowhead" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto">
                <polygon points="0 0, 10 3.5, 0 7" fill="#9333EA" />
              </marker>

              <linearGradient id="connection-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#64748B" stopOpacity="0.3" />
                <stop offset="50%" stopColor="#64748B" stopOpacity="0.7" />
                <stop offset="100%" stopColor="#64748B" stopOpacity="0.3" />
              </linearGradient>

              <linearGradient id="external-connection-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#9333EA" stopOpacity="0.3" />
                <stop offset="50%" stopColor="#9333EA" stopOpacity="0.7" />
                <stop offset="100%" stopColor="#9333EA" stopOpacity="0.3" />
              </linearGradient>

              {/* Gradientes para os círculos de status */}
              <radialGradient id="status-online" cx="0.5" cy="0.5" r="0.5" fx="0.5" fy="0.5">
                <stop offset="0%" stopColor="#10B981" stopOpacity="1" />
                <stop offset="100%" stopColor="#10B981" stopOpacity="0.6" />
              </radialGradient>

              <radialGradient id="status-degraded" cx="0.5" cy="0.5" r="0.5" fx="0.5" fy="0.5">
                <stop offset="0%" stopColor="#F59E0B" stopOpacity="1" />
                <stop offset="100%" stopColor="#F59E0B" stopOpacity="0.6" />
              </radialGradient>

              <radialGradient id="status-offline" cx="0.5" cy="0.5" r="0.5" fx="0.5" fy="0.5">
                <stop offset="0%" stopColor="#EF4444" stopOpacity="1" />
                <stop offset="100%" stopColor="#EF4444" stopOpacity="0.6" />
              </radialGradient>

              <radialGradient id="cba-gradient" cx="0.5" cy="0.5" r="0.5" fx="0.5" fy="0.5">
                <stop offset="0%" stopColor="#E11D48" stopOpacity="1" />
                <stop offset="100%" stopColor="#E11D48" stopOpacity="0.6" />
              </radialGradient>

              <radialGradient id="cbg-gradient" cx="0.5" cy="0.5" r="0.5" fx="0.5" fy="0.5">
                <stop offset="0%" stopColor="#E11D48" stopOpacity="1" />
                <stop offset="100%" stopColor="#E11D48" stopOpacity="0.6" />
              </radialGradient>

              <radialGradient id="cbc-gradient" cx="0.5" cy="0.5" r="0.5" fx="0.5" fy="0.5">
                <stop offset="0%" stopColor="#E11D48" stopOpacity="1" />
                <stop offset="100%" stopColor="#E11D48" stopOpacity="0.6" />
              </radialGradient>

              <radialGradient id="cbs-gradient" cx="0.5" cy="0.5" r="0.5" fx="0.5" fy="0.5">
                <stop offset="0%" stopColor="#E11D48" stopOpacity="1" />
                <stop offset="100%" stopColor="#E11D48" stopOpacity="0.6" />
              </radialGradient>

              <radialGradient id="fps-gradient" cx="0.5" cy="0.5" r="0.5" fx="0.5" fy="0.5">
                <stop offset="0%" stopColor="#0EA5E9" stopOpacity="1" />
                <stop offset="100%" stopColor="#0EA5E9" stopOpacity="0.6" />
              </radialGradient>

              <radialGradient id="shipay-gradient" cx="0.5" cy="0.5" r="0.5" fx="0.5" fy="0.5">
                <stop offset="0%" stopColor="#9333EA" stopOpacity="1" />
                <stop offset="100%" stopColor="#9333EA" stopOpacity="0.6" />
              </radialGradient>

              <radialGradient id="rabbitmq-gradient" cx="0.5" cy="0.5" r="0.5" fx="0.5" fy="0.5">
                <stop offset="0%" stopColor="#64748B" stopOpacity="1" />
                <stop offset="100%" stopColor="#64748B" stopOpacity="0.6" />
              </radialGradient>

              {/* Filtros para o efeito glow dos status */}
              <filter id="glow-green" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="2" result="blur" />
                <feFlood floodColor="#10B981" floodOpacity="0.5" result="color" />
                <feComposite in="color" in2="blur" operator="in" result="glow" />
                <feComposite in="SourceGraphic" in2="glow" operator="over" />
              </filter>

              <filter id="glow-yellow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="2" result="blur" />
                <feFlood floodColor="#F59E0B" floodOpacity="0.5" result="color" />
                <feComposite in="color" in2="blur" operator="in" result="glow" />
                <feComposite in="SourceGraphic" in2="glow" operator="over" />
              </filter>

              <filter id="glow-red" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="2" result="blur" />
                <feFlood floodColor="#EF4444" floodOpacity="0.5" result="color" />
                <feComposite in="color" in2="blur" operator="in" result="glow" />
                <feComposite in="SourceGraphic" in2="glow" operator="over" />
              </filter>
            </defs>

            {/* Fundo com grid */}
            <rect width="1200" height="800" fill="transparent" />
            <g stroke="#1E293B" strokeWidth="0.5" opacity="0.2">
              {Array.from({ length: 16 }).map((_, i) => (
                <line key={`h-${i}`} x1="0" y1={i * 50} x2="1200" y2={i * 50} />
              ))}
              {Array.from({ length: 24 }).map((_, i) => (
                <line key={`v-${i}`} x1={i * 50} y1="0" x2={i * 50} y2="800" />
              ))}
            </g>

            {/* Zona de serviços externos - retângulo destacado */}
            <rect
              x="850"
              y="550"
              width="250"
              height="150"
              rx="8"
              fill="#14162c"
              fillOpacity="0.6"
              stroke="#9333EA"
              strokeWidth="1"
              strokeDasharray="5,5"
            />
            <text x="975" y="580" textAnchor="middle" fill="#9333EA" fontSize="14" fontWeight="bold">
              Serviços Externos
            </text>

            {/* Conexões entre serviços */}
            <g>
              {/* Usuário -> CBA */}
              <path
                d="M600,150 L600,250"
                fill="none"
                stroke="url(#connection-gradient)"
                strokeWidth="2"
                markerEnd="url(#arrowhead)"
              />

              {/* CBA -> CBG */}
              <path
                d="M650,300 L750,300"
                fill="none"
                stroke="url(#connection-gradient)"
                strokeWidth="2"
                markerEnd="url(#arrowhead)"
              />

              {/* CBA -> CBS */}
              <path
                d="M550,300 L450,300"
                fill="none"
                stroke="url(#connection-gradient)"
                strokeWidth="2"
                markerEnd="url(#arrowhead)"
              />

              {/* CBA -> RabbitMQ */}
              <path
                d="M600,350 L600,400"
                fill="none"
                stroke="url(#connection-gradient)"
                strokeWidth="2"
                markerEnd="url(#arrowhead)"
              />

              {/* RabbitMQ -> CBC */}
              <path
                d="M600,450 L600,500"
                fill="none"
                stroke="url(#connection-gradient)"
                strokeWidth="2"
                markerEnd="url(#arrowhead)"
              />

              {/* CBC -> FPS */}
              <path
                d="M550,550 L450,550"
                fill="none"
                stroke="url(#connection-gradient)"
                strokeWidth="2"
                markerEnd="url(#arrowhead)"
              />

              {/* CBG -> RabbitMQ */}
              <path
                d="M750,350 C750,380 650,400 600,400"
                fill="none"
                stroke="url(#connection-gradient)"
                strokeWidth="2"
                markerEnd="url(#arrowhead)"
              />

              {/* CBG -> Shipay */}
              <path
                d="M800,300 C850,300 900,400 950,550"
                fill="none"
                stroke="url(#external-connection-gradient)"
                strokeWidth="2"
                strokeDasharray="5,5"
                markerEnd="url(#external-arrowhead)"
              />
            </g>

            {/* Serviços */}
            <g>
              {/* Usuário */}
              <g transform="translate(600, 100)">
                <rect
                  x="-60"
                  y="-30"
                  width="120"
                  height="60"
                  rx="6"
                  fill="#1E293B"
                  stroke="#334155"
                  strokeWidth="1"
                  filter="url(#shadow)"
                />
                <text y="5" textAnchor="middle" fill="#E2E8F0" fontSize="14" fontWeight="medium">
                  Usuário
                </text>
              </g>

              {/* CBA */}
              <g transform="translate(600, 300)">
                <rect
                  x="-70"
                  y="-40"
                  width="140"
                  height="80"
                  rx="6"
                  fill="#1E293B"
                  stroke="#334155"
                  strokeWidth="1"
                  filter="url(#shadow)"
                />
                <circle cx="-40" cy="0" r="15" fill="url(#cba-gradient)" />
                <text x="10" y="5" textAnchor="middle" fill="#E2E8F0" fontSize="16" fontWeight="bold">
                  CBA
                </text>
                <circle
                  cx="50"
                  cy="0"
                  r="6"
                  fill={`url(#status-${services.CBA})`}
                  filter={
                    services.CBA === "online"
                      ? "url(#glow-green)"
                      : services.CBA === "degraded"
                        ? "url(#glow-yellow)"
                        : "url(#glow-red)"
                  }
                />
              </g>

              {/* RabbitMQ */}
              <g transform="translate(600, 425)">
                <rect
                  x="-60"
                  y="-25"
                  width="120"
                  height="50"
                  rx="6"
                  fill="#1E293B"
                  stroke="#334155"
                  strokeWidth="1"
                  filter="url(#shadow)"
                />
                <text y="5" textAnchor="middle" fill="#E2E8F0" fontSize="14">
                  RabbitMQ
                </text>
              </g>

              {/* CBG */}
              <g transform="translate(800, 300)">
                <rect
                  x="-70"
                  y="-40"
                  width="140"
                  height="80"
                  rx="6"
                  fill="#1E293B"
                  stroke="#334155"
                  strokeWidth="1"
                  filter="url(#shadow)"
                />
                <circle cx="-40" cy="0" r="15" fill="url(#cbg-gradient)" />
                <text x="10" y="5" textAnchor="middle" fill="#E2E8F0" fontSize="16" fontWeight="bold">
                  CBG
                </text>
                <circle
                  cx="50"
                  cy="0"
                  r="6"
                  fill={`url(#status-${services.CBG})`}
                  filter={
                    services.CBG === "online"
                      ? "url(#glow-green)"
                      : services.CBG === "degraded"
                        ? "url(#glow-yellow)"
                        : "url(#glow-red)"
                  }
                />
              </g>

              {/* CBC */}
              <g transform="translate(600, 550)">
                <rect
                  x="-70"
                  y="-40"
                  width="140"
                  height="80"
                  rx="6"
                  fill="#1E293B"
                  stroke="#334155"
                  strokeWidth="1"
                  filter="url(#shadow)"
                />
                <circle cx="-40" cy="0" r="15" fill="url(#cbc-gradient)" />
                <text x="10" y="5" textAnchor="middle" fill="#E2E8F0" fontSize="16" fontWeight="bold">
                  CBC
                </text>
                <circle
                  cx="50"
                  cy="0"
                  r="6"
                  fill={`url(#status-${services.CBC})`}
                  filter={
                    services.CBC === "online"
                      ? "url(#glow-green)"
                      : services.CBC === "degraded"
                        ? "url(#glow-yellow)"
                        : "url(#glow-red)"
                  }
                />
              </g>

              {/* CBS */}
              <g transform="translate(400, 300)">
                <rect
                  x="-70"
                  y="-40"
                  width="140"
                  height="80"
                  rx="6"
                  fill="#1E293B"
                  stroke="#334155"
                  strokeWidth="1"
                  filter="url(#shadow)"
                />
                <circle cx="-40" cy="0" r="15" fill="url(#cbs-gradient)" />
                <text x="10" y="5" textAnchor="middle" fill="#E2E8F0" fontSize="16" fontWeight="bold">
                  CBS
                </text>
                <circle
                  cx="50"
                  cy="0"
                  r="6"
                  fill={`url(#status-${services.CBS})`}
                  filter={
                    services.CBS === "online"
                      ? "url(#glow-green)"
                      : services.CBS === "degraded"
                        ? "url(#glow-yellow)"
                        : "url(#glow-red)"
                  }
                />
              </g>

              {/* FPS */}
              <g transform="translate(400, 550)">
                <rect
                  x="-70"
                  y="-40"
                  width="140"
                  height="80"
                  rx="6"
                  fill="#1E293B"
                  stroke="#334155"
                  strokeWidth="1"
                  filter="url(#shadow)"
                />
                <circle cx="-40" cy="0" r="15" fill="url(#fps-gradient)" />
                <text x="10" y="5" textAnchor="middle" fill="#E2E8F0" fontSize="16" fontWeight="bold">
                  FPS
                </text>
                <circle
                  cx="50"
                  cy="0"
                  r="6"
                  fill={`url(#status-${services.FPS})`}
                  filter={
                    services.FPS === "online"
                      ? "url(#glow-green)"
                      : services.FPS === "degraded"
                        ? "url(#glow-yellow)"
                        : "url(#glow-red)"
                  }
                />
              </g>

              {/* Shipay (API Externa) */}
              <g transform="translate(975, 625)">
                <rect
                  x="-80"
                  y="-40"
                  width="160"
                  height="80"
                  rx="6"
                  fill="#1E293B"
                  stroke="#9333EA"
                  strokeWidth="1"
                  filter="url(#shadow)"
                />
                <circle cx="-50" cy="0" r="15" fill="url(#shipay-gradient)" />
                <text x="15" y="5" textAnchor="middle" fill="#E2E8F0" fontSize="16" fontWeight="bold">
                  Shipay API
                </text>
                <circle
                  cx="60"
                  cy="0"
                  r="6"
                  fill={`url(#status-${services.Shipay})`}
                  filter={
                    services.Shipay === "online"
                      ? "url(#glow-green)"
                      : services.Shipay === "degraded"
                        ? "url(#glow-yellow)"
                        : "url(#glow-red)"
                  }
                />
              </g>
            </g>

            {/* Legenda */}
            <g transform="translate(80, 700)">
              <text fill="#E2E8F0" fontSize="14" fontWeight="bold">
                Legenda:
              </text>

              {/* Status */}
              <g transform="translate(0, 30)">
                <circle cx="10" cy="0" r="6" fill="url(#status-online)" filter="url(#glow-green)" />
                <text x="25" y="4" fill="#E2E8F0" fontSize="12">
                  Online
                </text>

                <circle cx="100" cy="0" r="6" fill="url(#status-degraded)" filter="url(#glow-yellow)" />
                <text x="115" y="4" fill="#E2E8F0" fontSize="12">
                  Degradado
                </text>

                <circle cx="200" cy="0" r="6" fill="url(#status-offline)" filter="url(#glow-red)" />
                <text x="215" y="4" fill="#E2E8F0" fontSize="12">
                  Offline
                </text>
              </g>

              {/* Conexões */}
              <g transform="translate(0, 60)">
                <line x1="0" y1="0" x2="50" y2="0" stroke="#64748B" strokeWidth="2" />
                <text x="60" y="4" fill="#E2E8F0" fontSize="12">
                  Conexão Interna
                </text>

                <line x1="180" y1="0" x2="230" y2="0" stroke="#9333EA" strokeWidth="2" strokeDasharray="5,5" />
                <text x="240" y="4" fill="#E2E8F0" fontSize="12">
                  Conexão Externa
                </text>
              </g>
            </g>
          </svg>
        </div>
      </CardContent>
    </Card>
  )
}
