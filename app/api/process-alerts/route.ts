import { processAndNotifyAlerts } from "@/app/actions/process-alerts"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const result = await processAndNotifyAlerts()

    return NextResponse.json({
      success: true,
      ...result,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Erro na API de processamento de alertas:", error)

    return NextResponse.json(
      {
        success: false,
        error: String(error),
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
