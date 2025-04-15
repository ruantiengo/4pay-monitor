"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { DashboardHeader } from "@/components/dashboard-header"
import { EnvironmentProvider } from "@/contexts/environment-context"
import { NotificationProvider } from "@/contexts/notification-context"

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  // Recuperar o estado da sidebar do localStorage (se disponível)
  const [sidebarOpen, setSidebarOpen] = useState(true)

  // Efeito para carregar o estado da sidebar do localStorage
  useEffect(() => {
    const savedState = localStorage.getItem("sidebar-state")
    if (savedState) {
      setSidebarOpen(savedState === "true")
    }
  }, [])

  // Função para atualizar o estado da sidebar
  const handleSidebarChange = (open: boolean) => {
    setSidebarOpen(open)
    localStorage.setItem("sidebar-state", String(open))
  }

  return (
    <EnvironmentProvider>
       <NotificationProvider>
        <SidebarProvider open={sidebarOpen} onOpenChange={handleSidebarChange}>
          <div className="flex h-screen w-full overflow-hidden">
            <AppSidebar />
            <SidebarInset>
              <DashboardHeader />
              <main className="flex-1 overflow-auto bg-muted/40 p-6">{children}</main>
            </SidebarInset>
          </div>
        </SidebarProvider>
      </NotificationProvider>
        
    </EnvironmentProvider>
  )
}
