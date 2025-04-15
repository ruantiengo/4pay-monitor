import { NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"

export async function GET() {
  try {
    // Verificar conexão com o MongoDB
    const client = await clientPromise
    await client.db("admin").command({ ping: 1 })

    return NextResponse.json({
      status: "healthy",
      version: "1.0.0",
      timestamp: new Date().toISOString(),
      checks: {
        database: {
          status: "up",
          type: "mongodb",
        },
      },
    })
  } catch (error) {
    console.error("Erro no health check do dashboard:", error)

    return NextResponse.json(
      {
        status: "unhealthy",
        version: "1.0.0",
        timestamp: new Date().toISOString(),
        checks: {
          database: {
            status: "down",
            type: "mongodb",
            error: String(error),
          },
        },
      },
      { status: 500 },
    )
  }
}
