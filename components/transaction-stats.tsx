"use client"

import { useCallback, useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowDownIcon, ArrowUpIcon, CreditCard, MailX } from "lucide-react"
import { useEnvironment } from "@/contexts/environment-context"
import { getTransactionStats, TransactionStat } from "@/app/actions/transaction-status"

type Period = "today" | "week" | "month"

export function TransactionStats() {
  const { environment } = useEnvironment()
  const [stats, setStats] = useState<TransactionStat[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [activePeriod, setActivePeriod] = useState<Period>("today")

  const fetchTransactionStats = useCallback(async (period: Period) => {
    try {
      setLoading(true)
      const result = await getTransactionStats(environment, period)

      if (result.success) {
        setStats(result.stats)
      } else {
        console.error("Erro na resposta da API:", result.error)
        setStats(result.stats) // Usar dados de fallback
      }
    } catch (error) {
      console.error(`Erro ao carregar estatísticas de transações (${environment}):`, error)
      setStats(null)
    } finally {
      setLoading(false)
    }
  }, [environment])

  useEffect(() => {
    fetchTransactionStats(activePeriod)
  }, [fetchTransactionStats, activePeriod])

  const handlePeriodChange = (period: Period) => {
    setActivePeriod(period)
  }

  return (
    <Card className=" border-zinc-800">
      <CardHeader className="pb-2 pt-3 px-4">
        <div className="flex items-center gap-2">
          <CreditCard className="h-4 w-4 text-zinc-400" />
          <CardTitle className="text-sm font-medium text-zinc-400">Estatísticas de Transações</CardTitle>
        </div>
        <CardDescription className="text-xs text-zinc-500">
          Volume de transações e tendências ({environment})
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <Tabs defaultValue="today" value={activePeriod} onValueChange={(value) => handlePeriodChange(value as Period)}>
          <TabsList className="grid w-full grid-cols-3 bg-zinc-900 rounded-none border-b border-zinc-800">
            <TabsTrigger
              value="today"
              className="text-xs py-1.5 data-[state=active]:bg-black data-[state=active]:text-white"
            >
              Hoje
            </TabsTrigger>
            <TabsTrigger
              value="week"
              className="text-xs py-1.5 data-[state=active]:bg-black data-[state=active]:text-white"
            >
              Semana
            </TabsTrigger>
            <TabsTrigger
              value="month"
              className="text-xs py-1.5 data-[state=active]:bg-black data-[state=active]:text-white"
            >
              Mês
            </TabsTrigger>
          </TabsList>

          <div className="p-4">
            {loading ? (
              <div className="grid grid-cols-2 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="space-y-2">
                    <div className="h-4 w-32 animate-pulse rounded bg-zinc-800"></div>
                    <div className="h-8 w-16 animate-pulse rounded bg-zinc-800"></div>
                  </div>
                ))}
              </div>
            ) : stats ? (
              <div className="grid grid-cols-2 gap-6">
                {stats.map((stat, index) => (
                  <StatItem
                    key={index}
                    title={stat.name}
                    value={stat.value}
                    change={stat.change}
                    changeType={stat.changeType}
                   
                  />
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-40">
                <p className="text-sm text-zinc-500">Nenhum dado disponível</p>
              </div>
            )}
          </div>
        </Tabs>
      </CardContent>
    </Card>
  )
}

interface StatItemProps {
  title: string
  value: number
  change: number
  changeType: "increase" | "decrease"
}

function StatItem({ title, value, change, changeType }: StatItemProps) {
  // Função para obter o ícone baseado no título
  const getIcon = () => {
    if (title.includes("não enviados")) {
      return <MailX className="h-4 w-4 text-red-500" />
    }
    return null
  }

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2">
        {getIcon()}
        <p className="text-xs text-zinc-400">{title}</p>
      </div>
      <div className="flex items-baseline gap-2">
        <p className="text-2xl font-bold text-white">{value}</p>
        <div className="flex items-center text-xs">
          {changeType === "increase" ? (
            <ArrowUpIcon className="mr-1 h-3 w-3 text-green-500" />
          ) : (
            <ArrowDownIcon className="mr-1 h-3 w-3 text-red-500" />
          )}
          <span className={changeType === "increase" ? "text-green-500" : "text-red-500"}>{change}%</span>
        </div>
      </div>
    </div>
  )
}
