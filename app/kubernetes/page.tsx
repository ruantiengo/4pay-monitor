import { KubernetesPods } from "@/components/kubernetes-pods"
import { DashboardLayout } from "@/components/dashboard-layout"

export default function KubernetesPage() {
  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <h1 className="text-2xl font-bold">Monitoramento Kubernetes</h1>
        <p className="text-muted-foreground">Visualize o status e a utilização de recursos dos seus pods Kubernetes</p>
        <KubernetesPods />
      </div>
    </DashboardLayout>
  )
}
