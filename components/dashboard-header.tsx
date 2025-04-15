"use client"

import { LogOut, Menu, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { ModeToggle } from "@/components/mode-toggle"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { useSidebar } from "@/components/ui/sidebar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useEnvironment, type Environment } from "@/contexts/environment-context"
import { logout } from "@/app/actions/auth"
import { NotificationCenter } from "@/components/notification-center"

export function DashboardHeader() {
  const { toggleSidebar } = useSidebar()
  const { environment, setEnvironment } = useEnvironment()

  const handleLogout = async () => {
    await logout()
    // Usar window.location para garantir um redirecionamento completo
    window.location.href = "/"
  }

  return (
    <header className="flex h-16 items-center justify-between border-b px-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={toggleSidebar} className="hidden md:flex">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle Sidebar</span>
        </Button>
        <SidebarTrigger className="md:hidden">
          <Menu className="h-5 w-5" />
        </SidebarTrigger>
        <h1 className="text-xl font-semibold">Dashboard de Monitoramento</h1>
      </div>
      <div className="flex items-center gap-4">
        <Select value={environment} onValueChange={(value) => setEnvironment(value as Environment)}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Ambiente" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="DEV">DEV</SelectItem>
            <SelectItem value="HOMOLOG">HOMOLOG</SelectItem>
            <SelectItem value="PRODUCTION">PRODUCTION</SelectItem>
          </SelectContent>
        </Select>
        <NotificationCenter />
        <Separator orientation="vertical" className="h-8" />
        <ModeToggle />
        <Button variant="ghost" size="icon" className="rounded-full">
          <User className="h-5 w-5" />
          <span className="sr-only">Perfil</span>
        </Button>
        <Button variant="ghost" size="icon" onClick={handleLogout} title="Sair">
          <LogOut className="h-5 w-5" />
          <span className="sr-only">Sair</span>
        </Button>
      </div>
    </header>
  )
}
