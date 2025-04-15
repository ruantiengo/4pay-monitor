"use server"

import { getMongoClient } from "@/lib/mongodb"
import { startOfMonth, endOfMonth, differenceInMinutes, differenceInDays } from "date-fns"
import { ObjectId } from "mongodb"
import type { Environment } from "@/contexts/environment-context"

// Na interface Incident, remover o campo environment
export interface Incident {
  _id?: string
  type: string
  startDate: Date
  endDate: Date
  description: string
  affectedServices: string[]
  createdBy?: string
  createdAt: Date
}

export async function reportIncident(incident: Omit<Incident, "createdAt">, environment: Environment) {
  try {
    const client = await getMongoClient(environment)
    const db = client.db("connect_bank")
    const incidentsCollection = db.collection("accidents")

 
    const result = await incidentsCollection.insertOne({
      type: incident.type,
      start_date: new Date(incident.startDate),
      end_date: new Date(incident.endDate),
      description: incident.description,
      affected_services: incident.affectedServices,
      created_by: incident.createdBy || "system",
      created_at: new Date(),
    })

    return { success: true, id: result.insertedId }
  } catch (error) {
    console.error("Erro ao registrar incidente:", error)
    return { success: false, error: String(error) }
  }
}


export async function getIncidents(environment: Environment, month?: Date) {
  try {
    const client = await getMongoClient(environment)
    const db = client.db("connect_bank")
    const incidentsCollection = db.collection("accidents")


    const query: Record<string, unknown> = {}
    if (month) {
      const start = startOfMonth(month)
      const end = endOfMonth(month)
      query.$or = [{ start_date: { $gte: start, $lte: end } }, { end_date: { $gte: start, $lte: end } }]
    }

    const incidentsData = await incidentsCollection.find(query).sort({ start_date: -1 }).toArray()

 
    const incidents = incidentsData.map((incident) => ({
      _id: incident._id.toString(),
      type: incident.type,
      startDate: incident.start_date,
      endDate: incident.end_date,
      description: incident.description,
      affectedServices: incident.affected_services,
      createdBy: incident.created_by,
      createdAt: incident.created_at,
    }))

    return { success: true, incidents }
  } catch (error) {
    console.error(`Erro ao buscar incidentes (${environment}):`, error)
    return { success: false, incidents: [], error: String(error) }
  }
}

export async function calculateAvailability(environment: Environment, month?: Date) {  
  try {

    
    const client = await getMongoClient(environment)
    const db = client.db("connect_bank")
    const incidentsCollection = db.collection("accidents")

    const targetMonth = month || new Date()
    const start = startOfMonth(targetMonth)
    const end = endOfMonth(targetMonth)

    // Total de minutos no mês
    const totalDays = differenceInDays(end, start) + 1
    const totalMinutes = totalDays * 24 * 60

    // Filtrar apenas incidentes de indisponibilidade no mês especificado
    const query = {
      type: "unavailability",
      $or: [{ start_date: { $gte: start, $lte: end } }, { end_date: { $gte: start, $lte: end } }],
    }

    const incidentsData = await incidentsCollection.find(query).toArray()

    // Converter de snake_case para camelCase
    const incidents = incidentsData.map((incident) => ({
      _id: incident._id.toString(),
      type: incident.type,
      startDate: incident.start_date,
      endDate: incident.end_date,
      description: incident.description,
      affectedServices: incident.affected_services,
      createdBy: incident.created_by,
      createdAt: incident.created_at,
    }))

    // Calcular minutos de indisponibilidade
    let downtimeMinutes = 0

    incidents.forEach((incident) => {
      const incidentStart = new Date(incident.startDate)
      const incidentEnd = new Date(incident.endDate)

      // Ajustar datas para estarem dentro do mês, se necessário
      const effectiveStart = incidentStart < start ? start : incidentStart
      const effectiveEnd = incidentEnd > end ? end : incidentEnd

      // Adicionar ao total de tempo de inatividade
      downtimeMinutes += differenceInMinutes(effectiveEnd, effectiveStart)
    })

    // Calcular disponibilidade
    const availabilityPercentage = ((totalMinutes - downtimeMinutes) / totalMinutes) * 100

    // Buscar disponibilidade do mês anterior para comparação
    const lastMonth = new Date(targetMonth)
    lastMonth.setMonth(lastMonth.getMonth() - 1)

    // Calcular disponibilidade do mês anterior
    const lastMonthStart = startOfMonth(lastMonth)
    const lastMonthEnd = endOfMonth(lastMonth)

    // Total de minutos no mês anterior
    const lastMonthTotalDays = differenceInDays(lastMonthEnd, lastMonthStart) + 1
    const lastMonthTotalMinutes = lastMonthTotalDays * 24 * 60

    // Buscar incidentes do mês anterior
    const lastMonthQuery = {
      type: "unavailability",
      $or: [
        { start_date: { $gte: lastMonthStart, $lte: lastMonthEnd } },
        { end_date: { $gte: lastMonthStart, $lte: lastMonthEnd } },
      ],
    }

    const lastMonthIncidentsData = await incidentsCollection.find(lastMonthQuery).toArray()

    // Converter de snake_case para camelCase
    const lastMonthIncidents = lastMonthIncidentsData.map((incident) => ({
      _id: incident._id.toString(),
      type: incident.type,
      startDate: incident.start_date,
      endDate: incident.end_date,
      description: incident.description,
      affectedServices: incident.affected_services,
      createdBy: incident.created_by,
      createdAt: incident.created_at,
    }))

    // Calcular minutos de indisponibilidade do mês anterior
    let lastMonthDowntimeMinutes = 0

    lastMonthIncidents.forEach((incident) => {
      const incidentStart = new Date(incident.startDate)
      const incidentEnd = new Date(incident.endDate)

      // Ajustar datas para estarem dentro do mês anterior, se necessário
      const effectiveStart = incidentStart < lastMonthStart ? lastMonthStart : incidentStart
      const effectiveEnd = incidentEnd > lastMonthEnd ? lastMonthEnd : incidentEnd

      // Adicionar ao total de tempo de inatividade
      lastMonthDowntimeMinutes += differenceInMinutes(effectiveEnd, effectiveStart)
    })

    // Calcular disponibilidade do mês anterior
    const lastMonthAvailability = ((lastMonthTotalMinutes - lastMonthDowntimeMinutes) / lastMonthTotalMinutes) * 100

    // Calcular a diferença
    const difference = availabilityPercentage - lastMonthAvailability

    return {
      success: true,
      availability: Number(availabilityPercentage.toFixed(2)),
      lastMonthAvailability: Number(lastMonthAvailability.toFixed(2)),
      difference: Number(difference.toFixed(1)),
      downtimeMinutes,
      totalMinutes,
    }
  } catch (error) {
    console.error(`Erro ao calcular disponibilidade (${environment}):`, error)

    // Dados simulados diferentes para cada ambiente
    const mockData = {
      DEV: {
        availability: 97.5,
        lastMonthAvailability: 96.8,
        difference: 0.7,
      },
      HOMOLOG: {
        availability: 98.9,
        lastMonthAvailability: 98.2,
        difference: 0.7,
      },
      PRODUCTION: {
        availability: 95.0,
        lastMonthAvailability: 100.0,
        difference: -5.0,
      },
    }

    return {
      success: false,
      ...mockData[environment],
      error: String(error),
    }
  }
}

// Corrigir a função deleteIncident
export async function deleteIncident(id: string, environment: Environment) {
  try {
    const client = await getMongoClient(environment)
    const db = client.db("connect_bank")
    const incidentsCollection = db.collection("accidents")

    // Converter o ID para ObjectId
    const objectId = new ObjectId(id)

    const result = await incidentsCollection.deleteOne({ _id: objectId })

    if (result.deletedCount === 0) {
      return { success: false, error: "Incidente não encontrado" }
    }

    return { success: true }
  } catch (error) {
    console.error(`Erro ao excluir incidente (${environment}):`, error)
    return { success: false, error: String(error) }
  }
}

// Corrigir a função updateIncident
export async function updateIncident(
  id: string,
  updates: Partial<Omit<Incident, "_id" | "createdAt">>,
  environment: Environment
) {
  try {
    const client = await getMongoClient(environment)
    const db = client.db("connect_bank")
    const incidentsCollection = db.collection("accidents")

    // Converter o ID para ObjectId
    const objectId = new ObjectId(id)

    // Preparar os campos para atualização (convertendo para snake_case)
    const updateFields: Partial<Record<string, unknown>> = {}

    if (updates.type) updateFields.type = updates.type
    if (updates.description) updateFields.description = updates.description
    if (updates.affectedServices) updateFields.affected_services = updates.affectedServices
    if (updates.startDate) updateFields.start_date = new Date(updates.startDate)
    if (updates.endDate) updateFields.end_date = new Date(updates.endDate)
    if (updates.createdBy) updateFields.created_by = updates.createdBy

    // Adicionar campo de atualização
    updateFields.updated_at = new Date()

    const result = await incidentsCollection.updateOne({ _id: objectId }, { $set: updateFields })

    if (result.matchedCount === 0) {
      return { success: false, error: "Incidente não encontrado" }
    }

    return { success: true }
  } catch (error) {
    console.error(`Erro ao atualizar incidente (${environment}):`, error)
    return { success: false, error: String(error) }
  }
}
