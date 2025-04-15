"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Server, PlusCircle, ArrowUpIcon, ArrowDownIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ReportIncidentModal } from "@/components/report-incident-modal"
import { calculateAvailability } from "@/app/actions/incidents"
import { useEnvironment } from "@/contexts/environment-context"

export function AvailabilityCard() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [availability, setAvailability] = useState({
    availability: 99.99,
    lastMonthAvailability: 97.19,
    difference: 2.8,
  })
  const { environment } = useEnvironment()

  const loadAvailability = useCallback(async () => {
    try {
      setLoading(true)
      const result = await calculateAvailability(environment)
      
      if (result.success) {
        setAvailability({
          availability: result.availability,
          lastMonthAvailability: result.lastMonthAvailability,
          difference: result.difference,
        })
      }
    } catch (error) {
      console.error("Erro ao carregar disponibilidade:", error)
    } finally {
      setLoading(false)
    }
  }, [environment])

  useEffect(() => {
    loadAvailability()
  }, [environment, loadAvailability])

  const handleIncidentReported = () => {
    // Recarregar dados de disponibilidade após registrar um incidente
    loadAvailability()
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Disponibilidade</CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
             
              className="h-5 w-5 cursor-pointer hover:opacity-50"
              onClick={() => setIsModalOpen(true)}
              title="Relatar Incidente"
            >
              <PlusCircle className="h-4 w-4 text-muted-foreground" />
              <span className="sr-only">Relatar Incidente</span>
            </Button>
            <Server className="h-4 w-4 text-muted-foreground" />
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="h-8 w-24 animate-pulse rounded bg-muted"></div>
          ) : (
            <>
              <div className="text-2xl font-bold">{availability.availability}%</div>
              <div className="flex items-center text-xs text-muted-foreground">
                {availability.difference >= 0 ? (
                  <ArrowUpIcon className="mr-1 h-3 w-3 text-green-500" />
                ) : (
                  <ArrowDownIcon className="mr-1 h-3 w-3 text-red-500" />
                )}
                <span className={availability.difference >= 0 ? "text-green-500" : "text-red-500"}>
                  {availability.difference > 0 ? "+" : ""}
                  {availability.difference}%
                </span>
                <span className="ml-1">em relação ao mês anterior</span>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <ReportIncidentModal
        environment={environment}
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onIncidentReported={handleIncidentReported}
      />
    </>
  )
}
