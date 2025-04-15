"use server"

import { getMongoClient } from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import type { Environment } from "@/contexts/environment-context"

export async function searchBoletoById(environment: Environment, id: string) {
  try {
    // Validar se o ID está em um formato válido
    if (!id || id.trim() === "") {
      return { success: false, error: "ID do boleto não fornecido" }
    }

    const client = await getMongoClient(environment)
    const db = client.db("connect_bank")
    const boletosCollection = db.collection("bankslips")

    let query = {}

    // Tentar buscar por ObjectId se o formato for válido
    if (ObjectId.isValid(id)) {
      query = { _id: new ObjectId(id) }
    } else {
      // Caso contrário, buscar por outros campos de identificação
      query = {
        $or: [{ external_id: id }, { barcode: id }, { our_number: id }],
      }
    }

    const boleto = await boletosCollection.findOne(query)

    if (!boleto) {
      return { success: false, error: "Boleto não encontrado" }
    }

    return { success: true, boleto }
  } catch (error) {
    console.error(`Erro ao buscar boleto (${environment}):`, error)
    return { success: false, error: String(error) }
  }
}
