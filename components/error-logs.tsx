"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { AlertOctagon } from "lucide-react"
import { useEnvironment } from "@/contexts/environment-context"

interface ErrorLog {
  id: string
  service: string
  errorCode: string
  message: string
  timestamp: string
  count: number
}

// Dados simulados para desenvolvimento
const getMockErrorLogs = (environment: string): ErrorLog[] => {
  const baseErrorLogs: ErrorLog[] = [
    {
      id: "err-1",
      service: "CBG",
      errorCode: "ERR_TIMEOUT",
      message: "Timeout ao conectar com o serviço do banco",
      timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(), // 15 minutos atrás
      count: 3,
    },
    {
      id: "err-2",
      service: "CBC",
      errorCode: "ERR_SMTP",
      message: "Falha na autenticação SMTP",
      timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(), // 45 minutos atrás
      count: 1,
    },
    {
      id: "err-3",
      service: "FPS",
      errorCode: "ERR_PDF_GEN",
      message: "Falha na geração do PDF: dados inválidos",
      timestamp: new Date(Date.now() - 1000 * 60 * 90).toISOString(), // 90 minutos atrás
      count: 5,
    },
    {
      id: "err-4",
      service: "CBA",
      errorCode: "ERR_AUTH",
      message: "Token de autenticação expirado",
      timestamp: new Date(Date.now() - 1000 * 60 * 160).toISOString(), // 160 minutos atrás
      count: 2,
    },
    {
      id: "err-5",
      service: "CBS",
      errorCode: "ERR_DB_CONN",
      message: "Falha na conexão com o banco de dados",
      timestamp: new Date(Date.now() - 1000 * 60 * 185).toISOString(), // 185 minutos atrás
      count: 4,
    },
    {
      id: "err-6",
      service: "CBG",
      errorCode: "ERR_API_RESP",
      message: "Resposta inesperada da API do banco",
      timestamp: new Date(Date.now() - 1000 * 60 * 210).toISOString(), // 210 minutos atrás
      count: 2,
    },
  ]

  // Ajustar a quantidade de logs com base no ambiente
  const envMultiplier = environment === "PRODUCTION" ? 1 : environment === "HOMOLOG" ? 0.7 : 0.4

  // Em ambientes não produtivos, mostrar menos logs
  if (environment !== "PRODUCTION") {
    return baseErrorLogs.slice(0, Math.ceil(baseErrorLogs.length * envMultiplier))
  }

  return baseErrorLogs
}

export function ErrorLogs() {
  const [logs, setLogs] = useState<ErrorLog[]>([])
  const [loading, setLoading] = useState(true)
  const { environment } = useEnvironment()

  useEffect(() => {
    async function loadLogs() {
      try {
        setLoading(true)

        // Simular um atraso de rede
        await new Promise((resolve) => setTimeout(resolve, 800))

        // Carregar logs simulados
        setLogs(getMockErrorLogs(environment))
      } catch (error) {
        console.error("Erro ao carregar logs:", error)
        setLogs([])
      } finally {
        setLoading(false)
      }
    }

    loadLogs()

    // Atualizar a cada 2 minutos
    const interval = setInterval(loadLogs, 120000)
    return () => clearInterval(interval)
  }, [environment]) // Recarregar quando o ambiente mudar

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertOctagon className="h-5 w-5 text-red-500" />
          Logs de Erros Recentes
        </CardTitle>
        <CardDescription>Últimos erros registrados nos serviços</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px] pr-4">
          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-20 animate-pulse rounded-lg bg-muted"></div>
              ))}
            </div>
          ) : logs.length === 0 ? (
            <div className="flex h-20 items-center justify-center">
              <p className="text-muted-foreground">Nenhum erro registrado no período</p>
            </div>
          ) : (
            <div className="space-y-4">
              {logs.map((log) => (
                <div key={log.id} className="rounded-lg border p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{log.service}</Badge>
                      <code className="rounded bg-muted px-1 py-0.5 text-xs font-mono">{log.errorCode}</code>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{log.count}x</Badge>
                      <span className="text-xs text-muted-foreground">{formatDate(log.timestamp)}</span>
                    </div>
                  </div>
                  <p className="mt-2 text-sm">{log.message}</p>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
