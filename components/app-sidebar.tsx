"use client"

import {
  BarChart3,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  FileText,
  Home,
  Layers,
  Mail,
  MessageSquare,
} from "lucide-react"
import { useSidebar } from "@/components/ui/sidebar"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export function AppSidebar() {
  const { open, setOpen } = useSidebar()

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="flex items-center px-4 py-2">
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold">4pay</span>
        </div>
        <Button variant="ghost" size="icon" className="ml-auto" onClick={() => setOpen(!open)}>
          {open ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          <span className="sr-only">Toggle Sidebar</span>
        </Button>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Geral</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive tooltip="Principal">
                  <Link href="/">
                    <Home className="h-5 w-5" />
                    <span>Principal</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Serviços</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="CBA">
                  <a href="/cba">
                    <MessageSquare className="h-5 w-5" />
                    <span>CBA</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="CBG">
                  <a href="/cbg">
                    <CreditCard className="h-5 w-5" />
                    <span>CBG</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="CBC">
                  <a href="/cbc">
                    <Mail className="h-5 w-5" />
                    <span>CBC</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="CBS">
                  <a href="/cbs">
                    <BarChart3 className="h-5 w-5" />
                    <span>CBS</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="FPS">
                  <a href="/fps">
                    <FileText className="h-5 w-5" />
                    <span>FPS</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Kubernetes">
                  <a href="/kubernetes">
                    <Layers className="h-5 w-5" />
                    <span>Kubernetes</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  )
}
