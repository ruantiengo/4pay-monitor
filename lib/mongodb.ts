import { MongoClient } from "mongodb"
import type { Environment } from "@/contexts/environment-context"

// Mapeamento de URIs de conexão por ambiente
const MONGODB_URIS = {
  DEV: process.env.MONGODB_URI_DEVELOP || "",
  HOMOLOG: process.env.MONGODB_URI_HOMOLOG || process.env.MONGODB_URI || "",
  PRODUCTION: process.env.MONGODB_URI_PRODUCTION || process.env.MONGODB_URI || "",
}

// Armazenar clientes por ambiente
const clients: Record<Environment, MongoClient | null> = {
  DEV: null,
  HOMOLOG: null,
  PRODUCTION: null,
}

// Armazenar promessas de conexão por ambiente
const clientPromises: Record<Environment, Promise<MongoClient> | null> = {
  DEV: null,
  HOMOLOG: null,
  PRODUCTION: null,
}

export async function getMongoClient(environment: Environment = "PRODUCTION"): Promise<MongoClient> {
  // Se já temos uma promessa para este ambiente, retorná-la
  if (clientPromises[environment]) {
    return clientPromises[environment] as Promise<MongoClient>
  }

  // Obter a URI para o ambiente
  const uri = MONGODB_URIS[environment]

  if (!uri) {
    throw new Error(`URI de conexão MongoDB não configurada para o ambiente ${environment}`)
  }

  const options = {}

  // Criar um novo cliente para este ambiente
  const client = new MongoClient(uri, options)
  const clientPromise = client.connect()

  // Armazenar o cliente e a promessa
  clients[environment] = client
  clientPromises[environment] = clientPromise

  return clientPromise
}

// Manter a compatibilidade com o código existente
const defaultClient = new MongoClient(MONGODB_URIS.DEV, {})
const defaultClientPromise = defaultClient.connect()

export default defaultClientPromise
