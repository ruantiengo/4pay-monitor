"use client"

import type React from "react"
import type { Environment } from "@/contexts/environment-context"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { reportIncident } from "@/app/actions/incidents"
import { toast } from "sonner"

interface ReportIncidentModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onIncidentReported?: () => void
  environment: Environment
}

export function ReportIncidentModal({ open, onOpenChange, onIncidentReported, environment }: ReportIncidentModalProps) {
  const [loading, setLoading] = useState(false)
  const [incidentType, setIncidentType] = useState("unavailability")
  const [startDate, setStartDate] = useState("")
  const [startTime, setStartTime] = useState("")
  const [endDate, setEndDate] = useState("")
  const [endTime, setEndTime] = useState("")
  const [description, setDescription] = useState("")
  const [affectedServices, setAffectedServices] = useState<string[]>(["CBA", "CBG", "CBC", "CBS", "FPS"])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!startDate || !startTime || !endDate || !endTime || !description || affectedServices.length === 0) {
      toast.error("Por favor, preencha todos os campos obrigatórios.")
      return
    }

    // Validar datas
    const startDateTime = new Date(`${startDate}T${startTime}:00`)
    const endDateTime = new Date(`${endDate}T${endTime}:00`)

    if (isNaN(startDateTime.getTime()) || isNaN(endDateTime.getTime())) {
      toast.error("Por favor, verifique o formato das datas e horários.")
      return
    }

    if (endDateTime <= startDateTime) {
      toast.error("A data/hora de término deve ser posterior à data/hora de início.")
      return
    }

    try {
      setLoading(true)

      const result = await reportIncident({
        type: incidentType,
        startDate: startDateTime,
        endDate: endDateTime,
        description,
        affectedServices,
      },   environment)

      if (result.success) {
        toast.success("O incidente foi registrado com sucesso.")

        // Limpar formulário
        setIncidentType("unavailability")
        setStartDate("")
        setStartTime("")
        setEndDate("")
        setEndTime("")
        setDescription("")
        setAffectedServices(["CBA", "CBG", "CBC", "CBS", "FPS"])

        // Fechar modal
        onOpenChange(false)

        // Notificar componente pai
        if (onIncidentReported) {
          onIncidentReported()
        }
      } else {
        toast.error("Ocorreu um erro ao registrar o incidente. Tente novamente.")
      }
    } catch (error) {
      console.error(`Erro ao registrar incidente (${environment}):`, error)
      toast.error("Ocorreu um erro ao registrar o incidente. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  const handleServiceToggle = (service: string) => {
    setAffectedServices((prev) => {
      if (prev.includes(service)) {
        return prev.filter((s) => s !== service)
      } else {
        return [...prev, service]
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Relatar Incidente ({environment})</DialogTitle>
            <DialogDescription>
              Registre um período de indisponibilidade ou outro tipo de incidente no sistema.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="incident-type" className="text-right">
                Tipo
              </Label>
              <Select value={incidentType} onValueChange={setIncidentType} disabled={loading}>
                <SelectTrigger id="incident-type" className="col-span-3">
                  <SelectValue placeholder="Selecione o tipo de incidente" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unavailability">Indisponibilidade</SelectItem>
                  <SelectItem value="performance">Degradação de Performance</SelectItem>
                  <SelectItem value="partial">Falha Parcial</SelectItem>
                  <SelectItem value="other">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="start-date" className="text-right">
                Início
              </Label>
              <div className="col-span-3 flex gap-2">
                <Input
                  id="start-date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  disabled={loading}
                  required
                  className="flex-1"
                />
                <Input
                  id="start-time"
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  disabled={loading}
                  required
                  className="w-32"
                />
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="end-date" className="text-right">
                Fim
              </Label>
              <div className="col-span-3 flex gap-2">
                <Input
                  id="end-date"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  disabled={loading}
                  required
                  className="flex-1"
                />
                <Input
                  id="end-time"
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  disabled={loading}
                  required
                  className="w-32"
                />
              </div>
            </div>

            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="description" className="text-right pt-2">
                Descrição
              </Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={loading}
                required
                className="col-span-3"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-4 items-start gap-4">
              <Label className="text-right pt-2">Serviços Afetados</Label>
              <div className="col-span-3 space-y-2">
                <div className="flex flex-wrap gap-2">
                  {["CBA", "CBG", "CBC", "CBS", "FPS"].map((service) => (
                    <Button
                      key={service}
                      type="button"
                      variant={affectedServices.includes(service) ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleServiceToggle(service)}
                      disabled={loading}
                    >
                      {service}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Registrando..." : "Registrar Incidente"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
