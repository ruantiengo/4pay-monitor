import { NextResponse } from "next/server"
import { checkServicesHealth } from "@/app/actions/health-check"

export async function GET(request: Request) {
  try {
    // Obter o ambiente da query string
    const { searchParams } = new URL(request.url)
    const environment = (searchParams.get("environment") || "PRODUCTION") as "DEV" | "HOMOLOG" | "PRODUCTION"

    // Verificar a saúde dos serviços
    const healthData = await checkServicesHealth(environment)

    // Calcular a saúde geral do sistema
    const allServices = healthData.length
    const onlineServices = healthData.filter((service) => service.status === "online").length
    const degradedServices = healthData.filter((service) => service.status === "degraded").length

    let systemStatus: "healthy" | "degraded" | "unhealthy" = "healthy"

    if (onlineServices < allServices * 0.5) {
      systemStatus = "unhealthy"
    } else if (degradedServices > 0 || onlineServices < allServices) {
      systemStatus = "degraded"
    }

    return NextResponse.json({
      status: systemStatus,
      timestamp: new Date().toISOString(),
      environment,
      services: healthData,
      summary: {
        total: allServices,
        online: onlineServices,
        degraded: degradedServices,
        offline: allServices - onlineServices - degradedServices,
      },
    })
  } catch (error) {
    console.error("Erro na API de health check:", error)

    return NextResponse.json(
      {
        status: "error",
        error: String(error),
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
