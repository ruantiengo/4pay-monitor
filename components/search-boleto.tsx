"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, Loader2, Maximize2, Copy } from "lucide-react"
import { useEnvironment } from "@/contexts/environment-context"
import { searchBoletoById } from "@/app/actions/search-boleto"
import { ScrollArea } from "@/components/ui/scroll-area"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

export function BoletoSearch() {
  const { environment } = useEnvironment()
  const [searchId, setSearchId] = useState("")
  const [searchResult, setSearchResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleSearch = async () => {
    if (!searchId.trim()) {
      setError("Por favor, informe um ID de boleto")
      return
    }

    setLoading(true)
    setError(null)
    setSearchResult(null)

    try {
      const result = await searchBoletoById(environment, searchId)

      if (result.success) {
        setSearchResult(result.boleto)
      } else {
        setError(result.error!)
      }
    } catch (error) {
      console.error("Erro ao buscar boleto:", error)
      setError("Ocorreu um erro ao buscar o boleto")
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch()
    }
  }

  // Função para formatar o JSON de forma mais legível
  const formatJson = (json: any) => {
    return JSON.stringify(json, null, 2)
  }

  // Função para colorir diferentes partes do JSON
  const syntaxHighlight = (json: string) => {
    return json
      .replace(/"([^"]+)":/g, '<span class="text-blue-400">"$1"</span>:')
      .replace(/: "([^"]+)"/g, ': <span class="text-green-400">"$1"</span>')
      .replace(/: (\d+)/g, ': <span class="text-yellow-400">$1</span>')
      .replace(/: (true|false)/g, ': <span class="text-purple-400">$1</span>')
      .replace(/null/g, '<span class="text-red-400">null</span>')
  }

  const copyToClipboard = () => {
    if (searchResult) {
      navigator.clipboard.writeText(JSON.stringify(searchResult, null, 2))
      toast.success("JSON copiado para a área de transferência")
    }
  }

  return (
    <Card className="border-zinc-800">
      <CardHeader className="pb-2 pt-3 px-4">
        <CardTitle className="text-sm font-medium text-zinc-400">Pesquisar Boleto</CardTitle>
        <CardDescription className="text-xs text-zinc-500">
          Busque um boleto por ID, código de barras ou nosso número ({environment})
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4">
        <div className="flex gap-2 mb-4">
          <Input
            placeholder="Digite o ID do boleto"
            value={searchId}
            onChange={(e) => setSearchId(e.target.value)}
            onKeyDown={handleKeyDown}
            className="bg-zinc-900 border-zinc-800 text-white"
          />
          <Button
            onClick={handleSearch}
            disabled={loading || !searchId.trim()}
            className="bg-green-600 hover:bg-green-700"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            <span className="ml-2">Buscar</span>
          </Button>
        </div>

        {error && (
          <div className="bg-red-900/20 border border-red-800 rounded-md p-3 mb-4">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {searchResult && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-md">
            <div className="border-b border-zinc-800 px-3 py-2 flex justify-between items-center">
              <h3 className="text-sm font-medium text-zinc-300">Resultado da Pesquisa</h3>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs text-zinc-400 hover:text-white cursor-pointer"
                  onClick={() => setIsModalOpen(true)}
                >
                  <Maximize2 className="h-3.5 w-3.5 mr-1" />
                  Expandir
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs text-zinc-400 hover:text-white cursor-pointer"
                  onClick={copyToClipboard}
                >
                  Copiar JSON
                </Button>
              </div>
            </div>
            <ScrollArea className="h-[330px]">
              <pre className="p-4 text-xs font-mono overflow-auto">
                <code dangerouslySetInnerHTML={{ __html: syntaxHighlight(formatJson(searchResult)) }} />
              </pre>
            </ScrollArea>
          </div>
        )}

        {/* Modal de visualização expandida */}
        {searchResult && (
          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogContent className="max-w-[95vw] w-[1200px] max-h-[90vh] p-0">
              <DialogHeader className="p-4 border-b border-zinc-800">
                <DialogTitle>Detalhes do Boleto</DialogTitle>
              </DialogHeader>
              <div className="flex-1 overflow-hidden">
                <ScrollArea className="h-[calc(90vh-120px)]">
                  <div className="p-6 bg-zinc-950">
                    <pre className="font-mono text-sm whitespace-pre-wrap break-all">
                      <code dangerouslySetInnerHTML={{ __html: syntaxHighlight(formatJson(searchResult)) }} />
                    </pre>
                  </div>
                </ScrollArea>
              </div>
              <div className="p-4 border-t border-zinc-800 flex justify-end">
                <Button onClick={copyToClipboard} className="bg-green-600 hover:bg-green-700">
                  <Copy className="h-4 w-4 mr-2" />
                  Copiar JSON
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </CardContent>
    </Card>
  )
}
