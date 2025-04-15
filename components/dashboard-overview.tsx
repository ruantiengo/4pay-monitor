"use client"


import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

import { TransactionStats } from "@/components/transaction-stats"

import { ServiceDependencies } from "@/components/service-dependencies"
import { ServiceStatusCards } from "@/components/service-status-card"

import { BoletosStats } from "@/components/boletos-stats"
import { BoletosSuccessRate } from "@/components/boletos-success-rate"
import { AvailabilityCard } from "./aviability-card"
import { ResponseTimeMetrics } from "./response-time-metrics"
import { AIChat } from "./ai-chat"
import { RabbitMQDeadLetter } from "./rabbitmq-deadletter"
import { BoletoSearch } from "./search-boleto"



export function DashboardOverview() {

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <BoletosStats />
        <BoletosSuccessRate />
        <ResponseTimeMetrics />
        <AvailabilityCard />
      </div>

      <ServiceStatusCards />
      
      <div className="grid grid-cols-4 gap-6">
        <div className="col-span-3">
          <AIChat />
        </div>
        <div className="col-span-1">
          <BoletoSearch />
        </div>
      </div>
      

      <Tabs defaultValue="status" className="space-y-4">
        <TabsList>
          <TabsTrigger value="status">Status dos Serviços</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>
        <TabsContent value="status" className="space-y-4">
     
        </TabsContent>
        <TabsContent value="performance" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Tempo de Resposta</CardTitle>
                <CardDescription>Média dos últimos 30 dias</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
               
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Taxa de Sucesso</CardTitle>
                <CardDescription>Requisições bem-sucedidas</CardDescription>
              </CardHeader>
            
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      

      <div className="grid gap-6 md:grid-cols-2">
        <TransactionStats />
        <RabbitMQDeadLetter />
      </div>

      <ServiceDependencies />
    </div>
  )
}
