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
          setServices(statusMap)
        } else {
          // Simular um atraso de rede
          await new Promise((resolve) => setTimeout(resolve, 800))

          // Gerar status aleatórios para simulação
       
          const statusMap: Record<string, ServiceStatus> = {}

          // Maior probabilidade de estar online em produção
          const onlineChance = environment === "PRODUCTION" ? 0.8 : environment === "HOMOLOG" ? 0.6 : 0.5

          // Gerar status para cada serviço
          const serviceNames = ["CBA", "CBG", "CBC", "CBS", "FPS"]
          serviceNames.forEach((name) => {
            const random = Math.random()
            if (random < onlineChance) {
              statusMap[name] = "online"
            } else if (random < onlineChance + 0.3) {
              statusMap[name] = "degraded"
            } else {
              statusMap[name] = "offline"
            }
          })

          setServices(statusMap)
        }
      } catch (error) {
        console.error("Erro ao carregar status dos serviços:", error)
      }
    }

    loadServiceStatus()

    // Atualizar a cada 60 segundos
    const interval = setInterval(loadServiceStatus, 60000)
    return () => clearInterval(interval)
  }, [environment])

  // Função para obter a cor do status
  const getStatusColor = (status: ServiceStatus): string => {
    switch (status) {
      case "online":
        return "#10B981" // Verde
      case "degraded":
        return "#F59E0B" // Amarelo
      case "offline":
        return "#EF4444" // Vermelho
      default:
        return "#6B7280" // Cinza
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Network className="h-5 w-5" />
          Mapa de Dependências
        </CardTitle>
        <CardDescription>Arquitetura de microsserviços ({environment})</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex h-[800px] items-center justify-center bg-gradient-to-b from-background/50 to-background/30 rounded-lg p-4 overflow-auto">
          <svg width="100%" height="100%" viewBox="0 0 1200 800" className="max-w-full">
            {/* Definições e filtros */}
            <defs>
              <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="4" stdDeviation="4" floodOpacity="0.3" />
              </filter>

              <filter id="glow" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>

              <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto">
                <polygon points="0 0, 10 3.5, 0 7" fill="#64748B" />
              </marker>

              <linearGradient id="connection-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#64748B" stopOpacity="0.3" />
                <stop offset="50%" stopColor="#64748B" stopOpacity="0.7" />
                <stop offset="100%" stopColor="#64748B" stopOpacity="0.3" />
              </linearGradient>

              {/* Gradientes para os círculos de tecnologia */}
              <radialGradient id="nestjs-gradient" cx="0.5" cy="0.5" r="0.5" fx="0.5" fy="0.5">
                <stop offset="0%" stopColor="#E0234E" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#E0234E" stopOpacity="0.4" />
              </radialGradient>

              <radialGradient id="fastapi-gradient" cx="0.5" cy="0.5" r="0.5" fx="0.5" fy="0.5">
                <stop offset="0%" stopColor="#009688" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#009688" stopOpacity="0.4" />
              </radialGradient>

              <radialGradient id="mongodb-gradient" cx="0.5" cy="0.5" r="0.5" fx="0.5" fy="0.5">
                <stop offset="0%" stopColor="#4DB33D" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#4DB33D" stopOpacity="0.4" />
              </radialGradient>

              <radialGradient id="postgres-gradient" cx="0.5" cy="0.5" r="0.5" fx="0.5" fy="0.5">
                <stop offset="0%" stopColor="#336791" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#336791" stopOpacity="0.4" />
              </radialGradient>

              <radialGradient id="rabbitmq-gradient" cx="0.5" cy="0.5" r="0.5" fx="0.5" fy="0.5">
                <stop offset="0%" stopColor="#FF6600" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#FF6600" stopOpacity="0.4" />
              </radialGradient>

              <radialGradient id="user-gradient" cx="0.5" cy="0.5" r="0.5" fx="0.5" fy="0.5">
                <stop offset="0%" stopColor="#64748B" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#64748B" stopOpacity="0.4" />
              </radialGradient>

              {/* Filtros para o efeito neon dos status */}
              <filter id="neon-green" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="2" result="blur" />
                <feFlood floodColor="#10B981" floodOpacity="0.7" result="color" />
                <feComposite in="color" in2="blur" operator="in" result="glow" />
                <feComposite in="SourceGraphic" in2="glow" operator="over" />
              </filter>

              <filter id="neon-yellow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="2" result="blur" />
                <feFlood floodColor="#F59E0B" floodOpacity="0.7" result="color" />
                <feComposite in="color" in2="blur" operator="in" result="glow" />
                <feComposite in="SourceGraphic" in2="glow" operator="over" />
              </filter>

              <filter id="neon-red" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="2" result="blur" />
                <feFlood floodColor="#EF4444" floodOpacity="0.7" result="color" />
                <feComposite in="color" in2="blur" operator="in" result="glow" />
                <feComposite in="SourceGraphic" in2="glow" operator="over" />
              </filter>
            </defs>

            {/* Fundo com grid */}
            <rect width="1200" height="800" fill="transparent" />
            <g stroke="#1E293B" strokeWidth="0.5" opacity="0.3">
              {Array.from({ length: 20 }).map((_, i) => (
                <line key={`h-${i}`} x1="0" y1={i * 50} x2="1200" y2={i * 50} />
              ))}
              {Array.from({ length: 24 }).map((_, i) => (
                <line key={`v-${i}`} x1={i * 50} y1="0" x2={i * 50} y2="800" />
              ))}
            </g>

            {/* Conexões entre serviços */}
            <g>
              {/* Usuário -> CBA */}
              <path
                d="M600,120 C600,160 600,180 600,220"
                fill="none"
                stroke="url(#connection-gradient)"
                strokeWidth="2"
                markerEnd="url(#arrowhead)"
              />

              {/* CBA -> MongoDB */}
              <path
                d="M600,320 L600,420"
                fill="none"
                stroke="url(#connection-gradient)"
                strokeWidth="2"
                markerEnd="url(#arrowhead)"
              />

              {/* CBA -> CBG */}
              <path
                d="M700,270 L900,270"
                fill="none"
                stroke="url(#connection-gradient)"
                strokeWidth="2"
                markerEnd="url(#arrowhead)"
              />

              {/* CBA -> CBS */}
              <path
                d="M500,270 L300,270"
                fill="none"
                stroke="url(#connection-gradient)"
                strokeWidth="2"
                markerEnd="url(#arrowhead)"
              />

              {/* CBG -> CBC */}
              <path
                d="M950,320 C950,370 800,370 600,370 L600,420"
                fill="none"
                stroke="url(#connection-gradient)"
                strokeWidth="2"
                markerEnd="url(#arrowhead)"
              />

              {/* CBC -> PostgreSQL */}
              <path
                d="M600,520 L600,620"
                fill="none"
                stroke="url(#connection-gradient)"
                strokeWidth="2"
                markerEnd="url(#arrowhead)"
              />

              {/* CBC -> FPS */}
              <path
                d="M500,470 C400,470 400,570 300,570"
                fill="none"
                stroke="url(#connection-gradient)"
                strokeWidth="2"
                markerEnd="url(#arrowhead)"
              />
            </g>

            {/* Serviços */}
            <g>
              {/* Usuário */}
              <g transform="translate(600, 70)">
                <rect
                  x="-70"
                  y="-40"
                  width="140"
                  height="80"
                  rx="8"
                  fill="#1E293B"
                  stroke="#334155"
                  strokeWidth="1"
                  filter="url(#shadow)"
                />
                <circle cx="0" cy="0" r="25" fill="url(#user-gradient)" />
                <svg x="-10" y="-10" width="20" height="20" viewBox="0 0 24 24">
                  <path
                    d="M12 12C14.21 12 16 10.21 16 8C16 5.79 14.21 4 12 4C9.79 4 8 5.79 8 8C8 10.21 9.79 12 12 12ZM12 14C9.33 14 4 15.34 4 18V20H20V18C20 15.34 14.67 14 12 14Z"
                    fill="white"
                  />
                </svg>
                <text y="35" textAnchor="middle" fill="#E2E8F0" fontSize="14">
                  Usuário
                </text>
              </g>

              {/* CBA (NestJS) */}
              <g transform="translate(600, 270)">
                <rect
                  x="-70"
                  y="-40"
                  width="140"
                  height="80"
                  rx="8"
                  fill="#1E293B"
                  stroke="#334155"
                  strokeWidth="1"
                  filter="url(#shadow)"
                />
                <circle cx="0" cy="0" r="25" fill="url(#nestjs-gradient)" />
                <svg x="-10" y="-10" width="20" height="20" viewBox="0 0 256 256">
                  <path
                    d="M175.3 139.5L128 175.7C127.7 175.9 127.3 175.9 127 175.7L79.7 139.5C79.4 139.3 79.4 138.9 79.7 138.6L127 102.4C127.3 102.2 127.7 102.2 128 102.4L175.3 138.6C175.6 138.9 175.6 139.3 175.3 139.5Z"
                    fill="white"
                  />
                </svg>
                <text y="35" textAnchor="middle" fill="#E2E8F0" fontSize="14">
                  CBA
                </text>
                <circle
                  cx="50"
                  cy="25"
                  r="6"
                  fill={getStatusColor(services.CBA)}
                  filter={
                    services.CBA === "online"
                      ? "url(#neon-green)"
                      : services.CBA === "degraded"
                        ? "url(#neon-yellow)"
                        : "url(#neon-red)"
                  }
                />
              </g>

              {/* MongoDB */}
              <g transform="translate(600, 470)">
                <rect
                  x="-80"
                  y="-50"
                  width="160"
                  height="100"
                  rx="8"
                  fill="#1E293B"
                  stroke="#334155"
                  strokeWidth="1"
                  filter="url(#shadow)"
                />
                <circle cx="0" cy="0" r="35" fill="url(#mongodb-gradient)" />
                <svg x="-15" y="-15" width="30" height="30" viewBox="0 0 256 256">
                  <path
                    d="M131.2 213.1C131.2 213.1 129.8 204.7 132.2 195.6C134.7 186.5 140.9 179.5 142.3 177.1C143.6 174.7 145 173.1 145 173.1C145 173.1 147.5 177.8 147.5 184.8C147.5 191.8 144.3 204 143.6 206.4C142.9 208.7 132.4 215.5 132.4 215.5C132.4 215.5 131.5 214.2 131.2 213.1Z"
                    fill="white"
                  />
                </svg>
                <text y="60" textAnchor="middle" fill="#E2E8F0" fontSize="14">
                  MongoDB
                </text>
              </g>

              {/* CBG (NestJS) */}
              <g transform="translate(950, 270)">
                <rect
                  x="-70"
                  y="-40"
                  width="140"
                  height="80"
                  rx="8"
                  fill="#1E293B"
                  stroke="#334155"
                  strokeWidth="1"
                  filter="url(#shadow)"
                />
                <circle cx="0" cy="0" r="25" fill="url(#nestjs-gradient)" />
                <svg x="-10" y="-10" width="20" height="20" viewBox="0 0 256 256">
                  <path
                    d="M175.3 139.5L128 175.7C127.7 175.9 127.3 175.9 127 175.7L79.7 139.5C79.4 139.3 79.4 138.9 79.7 138.6L127 102.4C127.3 102.2 127.7 102.2 128 102.4L175.3 138.6C175.6 138.9 175.6 139.3 175.3 139.5Z"
                    fill="white"
                  />
                </svg>
                <text y="35" textAnchor="middle" fill="#E2E8F0" fontSize="14">
                  CBG
                </text>
                <circle
                  cx="50"
                  cy="25"
                  r="6"
                  fill={getStatusColor(services.CBG)}
                  filter={
                    services.CBG === "online"
                      ? "url(#neon-green)"
                      : services.CBG === "degraded"
                        ? "url(#neon-yellow)"
                        : "url(#neon-red)"
                  }
                />
              </g>

              {/* CBC (NestJS) */}
              <g transform="translate(600, 470)">
                <rect
                  x="-70"
                  y="-40"
                  width="140"
                  height="80"
                  rx="8"
                  fill="#1E293B"
                  stroke="#334155"
                  strokeWidth="1"
                  filter="url(#shadow)"
                />
                <circle cx="0" cy="0" r="25" fill="url(#nestjs-gradient)" />
                <svg x="-10" y="-10" width="20" height="20" viewBox="0 0 256 256">
                  <path
                    d="M175.3 139.5L128 175.7C127.7 175.9 127.3 175.9 127 175.7L79.7 139.5C79.4 139.3 79.4 138.9 79.7 138.6L127 102.4C127.3 102.2 127.7 102.2 128 102.4L175.3 138.6C175.6 138.9 175.6 139.3 175.3 139.5Z"
                    fill="white"
                  />
                </svg>
                <text y="35" textAnchor="middle" fill="#E2E8F0" fontSize="14">
                  CBC
                </text>
                <circle
                  cx="50"
                  cy="25"
                  r="6"
                  fill={getStatusColor(services.CBC)}
                  filter={
                    services.CBC === "online"
                      ? "url(#neon-green)"
                      : services.CBC === "degraded"
                        ? "url(#neon-yellow)"
                        : "url(#neon-red)"
                  }
                />
              </g>

              {/* PostgreSQL */}
              <g transform="translate(600, 670)">
                <rect
                  x="-80"
                  y="-50"
                  width="160"
                  height="100"
                  rx="8"
                  fill="#1E293B"
                  stroke="#334155"
                  strokeWidth="1"
                  filter="url(#shadow)"
                />
                <circle cx="0" cy="0" r="35" fill="url(#postgres-gradient)" />
                <svg x="-15" y="-15" width="30" height="30" viewBox="0 0 256 256">
                  <path
                    d="M237.9 152.7C237.9 152.7 237.9 152.7 237.9 152.7C237.9 152.7 237.9 152.7 237.9 152.7Z"
                    fill="white"
                  />
                  <path
                    d="M128 30.2C73.5 30.2 29.8 73.9 29.8 128.4C29.8 182.9 73.5 226.6 128 226.6C182.5 226.6 226.2 182.9 226.2 128.4C226.2 73.9 182.5 30.2 128 30.2Z"
                    fill="#336791"
                    fillOpacity="0.2"
                  />
                  <path
                    d="M128 40C78.3 40 38 80.3 38 130C38 179.7 78.3 220 128 220C177.7 220 218 179.7 218 130C218 80.3 177.7 40 128 40Z"
                    stroke="white"
                    strokeWidth="2"
                  />
                </svg>
                <text y="60" textAnchor="middle" fill="#E2E8F0" fontSize="14">
                  PostgreSQL
                </text>
              </g>

              {/* CBS (NestJS) */}
              <g transform="translate(250, 270)">
                <rect
                  x="-70"
                  y="-40"
                  width="140"
                  height="80"
                  rx="8"
                  fill="#1E293B"
                  stroke="#334155"
                  strokeWidth="1"
                  filter="url(#shadow)"
                />
                <circle cx="0" cy="0" r="25" fill="url(#nestjs-gradient)" />
                <svg x="-10" y="-10" width="20" height="20" viewBox="0 0 256 256">
                  <path
                    d="M175.3 139.5L128 175.7C127.7 175.9 127.3 175.9 127 175.7L79.7 139.5C79.4 139.3 79.4 138.9 79.7 138.6L127 102.4C127.3 102.2 127.7 102.2 128 102.4L175.3 138.6C175.6 138.9 175.6 139.3 175.3 139.5Z"
                    fill="white"
                  />
                </svg>
                <text y="35" textAnchor="middle" fill="#E2E8F0" fontSize="14">
                  CBS
                </text>
                <circle
                  cx="50"
                  cy="25"
                  r="6"
                  fill={getStatusColor(services.CBS)}
                  filter={
                    services.CBS === "online"
                      ? "url(#neon-green)"
                      : services.CBS === "degraded"
                        ? "url(#neon-yellow)"
                        : "url(#neon-red)"
                  }
                />
              </g>

              {/* FPS (FastAPI) */}
              <g transform="translate(250, 570)">
                <rect
                  x="-80"
                  y="-50"
                  width="160"
                  height="100"
                  rx="8"
                  fill="#1E293B"
                  stroke="#334155"
                  strokeWidth="1"
                  filter="url(#shadow)"
                />
                <circle cx="0" cy="0" r="35" fill="url(#fastapi-gradient)" />
                <svg x="-15" y="-15" width="30" height="30" viewBox="0 0 256 256">
                  <path
                    d="M65.5 128L103.4 165.8L190.8 78.5"
                    stroke="white"
                    strokeWidth="16"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <text y="60" textAnchor="middle" fill="#E2E8F0" fontSize="14">
                  FPS
                </text>
                <circle
                  cx="60"
                  cy="30"
                  r="8"
                  fill={getStatusColor(services.FPS)}
                  filter={
                    services.FPS === "online"
                      ? "url(#neon-green)"
                      : services.FPS === "degraded"
                        ? "url(#neon-yellow)"
                        : "url(#neon-red)"
                  }
                />
              </g>

              {/* RabbitMQ */}
              <g transform="translate(775, 370)">
                <rect
                  x="-70"
                  y="-40"
                  width="140"
                  height="80"
                  rx="8"
                  fill="#1E293B"
                  stroke="#334155"
                  strokeWidth="1"
                  filter="url(#shadow)"
                />
                <circle cx="0" cy="0" r="25" fill="url(#rabbitmq-gradient)" />
                <svg x="-10" y="-10" width="20" height="20" viewBox="0 0 256 256">
                  <path
                    d="M128 128C128 110.3 142.3 96 160 96C177.7 96 192 110.3 192 128C192 145.7 177.7 160 160 160H96C78.3 160 64 145.7 64 128C64 110.3 78.3 96 96 96C113.7 96 128 110.3 128 128Z"
                    fill="white"
                  />
                </svg>
                <text y="35" textAnchor="middle" fill="#E2E8F0" fontSize="14">
                  RabbitMQ
                </text>
              </g>
            </g>
          </svg>
        </div>
      </CardContent>
    </Card>
  )
}
