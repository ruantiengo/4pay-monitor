"use server"

import { getMongoClient } from "@/lib/mongodb"
import type { Environment } from "@/contexts/environment-context"

export interface DeadLetter {
  _id: string
  message_content: any
  queue: string
  created_at: string
  __v: number
}

export async function getDeadLetters(environment: Environment, lastLoadTime?: string) {
  try {
    const client = await getMongoClient(environment)
    const db = client.db("connect_bank")
    const deadlettersCollection = db.collection("deadletters")

    // Construir a consulta com base no lastLoadTime
    const query: any = {}

    // Se temos um lastLoadTime, buscar apenas mensagens mais recentes
    if (lastLoadTime) {
      query.created_at = { $gt: lastLoadTime }
    }

    // Buscar as deadletters, ordenadas pela data de criação (mais recentes primeiro)
    const deadletters = await deadlettersCollection.find(query).sort({ created_at: -1 }).limit(100).toArray()

    // Garantir que não há duplicatas usando um Set para os IDs
    const uniqueIds = new Set()
    const uniqueDeadletters = deadletters.filter((item) => {
      const id = item._id.toString()
      if (uniqueIds.has(id)) {
        return false
      }
      uniqueIds.add(id)
      return true
    })

    // Converter os ObjectIds para strings para facilitar a serialização
    return {
      success: true,
      deadletters: uniqueDeadletters.map((item) => ({
        _id: item._id.toString(),
        message_content: item.message_content,
        queue: item.queue,
        created_at: item.created_at,
        __v: item.__v,
      })),
    }
  } catch (error) {
    console.error(`Erro ao buscar deadletters (${environment}):`, error)
    return {
      success: false,
      error: String(error),
      deadletters: [],
    }
  }
}
