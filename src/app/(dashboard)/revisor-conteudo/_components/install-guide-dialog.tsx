"use client"

import { useState } from "react"
import { HelpCircle, Download, FolderOpen, RefreshCw } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export function InstallGuideDialog() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <HelpCircle size={15} strokeWidth={1.5} />
        Como instalar a extensão
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Como usar a extensão Revisor de Conteúdo</DialogTitle>
          </DialogHeader>

          <div className="space-y-6 text-sm">
            <div className="space-y-3">
              <p className="font-semibold text-foreground flex items-center gap-2">
                <Download size={15} className="text-muted-foreground" />
                Primeira instalação
              </p>
              <ol className="space-y-2 text-muted-foreground list-none">
                <li className="flex gap-3">
                  <span className="shrink-0 w-5 h-5 rounded-full bg-muted text-foreground text-xs flex items-center justify-center font-semibold">1</span>
                  <span>Baixe o arquivo da extensão clicando no botão abaixo.</span>
                </li>
                <li className="flex gap-3">
                  <span className="shrink-0 w-5 h-5 rounded-full bg-muted text-foreground text-xs flex items-center justify-center font-semibold">2</span>
                  <span>Extraia a pasta ZIP em algum lugar fixo do seu computador (não apague depois).</span>
                </li>
                <li className="flex gap-3">
                  <span className="shrink-0 w-5 h-5 rounded-full bg-muted text-foreground text-xs flex items-center justify-center font-semibold">3</span>
                  <span>Abra o Chrome e acesse <code className="text-foreground bg-muted px-1 rounded">chrome://extensions/</code></span>
                </li>
                <li className="flex gap-3">
                  <span className="shrink-0 w-5 h-5 rounded-full bg-muted text-foreground text-xs flex items-center justify-center font-semibold">4</span>
                  <span>Ative o <strong className="text-foreground">Modo do desenvolvedor</strong> (toggle no canto superior direito).</span>
                </li>
                <li className="flex gap-3">
                  <span className="shrink-0 w-5 h-5 rounded-full bg-muted text-foreground text-xs flex items-center justify-center font-semibold">5</span>
                  <span>Clique em <strong className="text-foreground">Carregar sem compactação</strong> e selecione a pasta extraída.</span>
                </li>
              </ol>
              <a
                href="/alura-revisor-conteudo.zip"
                download
                className="flex items-center justify-center gap-2 w-full bg-primary hover:bg-primary/80 text-primary-foreground font-semibold text-sm py-2.5 rounded-xl transition-colors"
              >
                <Download size={15} />
                Baixar extensão
              </a>
            </div>

            <div className="border-t border-border pt-4 space-y-2">
              <p className="font-semibold text-foreground flex items-center gap-2">
                <RefreshCw size={15} className="text-muted-foreground" />
                Atualizações
              </p>
              <p className="text-muted-foreground">
                O Chrome verifica atualizações automaticamente a cada ~5 horas e atualiza a extensão silenciosamente.{" "}
                <strong className="text-foreground">Você não precisa fazer nada.</strong>
              </p>
              <p className="text-muted-foreground">
                Para forçar uma atualização imediata, abra{" "}
                <code className="text-foreground bg-muted px-1 rounded">chrome://extensions/</code>{" "}
                e clique no ícone de atualizar no topo da página.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
