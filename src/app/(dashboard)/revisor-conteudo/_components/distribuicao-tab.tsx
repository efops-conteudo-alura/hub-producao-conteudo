"use client"

import { FileCode2, Package, Info } from "lucide-react"

export function DistribuicaoTab() {
  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-start gap-3 border border-sidebar-border rounded-xl p-4 bg-card text-sm text-muted-foreground">
        <Info size={16} strokeWidth={1.5} className="shrink-0 mt-0.5" />
        <p>
          O Chrome consulta o <code className="text-foreground">update.xml</code> a cada ~5 horas e atualiza a extensão silenciosamente, sem o usuário precisar reinstalar.
        </p>
      </div>

      <div className="space-y-4">
        <div className="border border-sidebar-border rounded-xl p-5 bg-card space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            <FileCode2 size={16} strokeWidth={1.5} className="text-muted-foreground" />
            <span>update.xml</span>
            <code className="ml-auto text-xs text-muted-foreground font-mono">public/update.xml</code>
          </div>
          <pre className="text-xs bg-sidebar rounded-lg p-3 overflow-x-auto text-muted-foreground leading-relaxed">{`<?xml version='1.0' encoding='UTF-8'?>
<gupdate xmlns='http://www.google.com/update2/response' protocol='2.0'>
  <app appid='EXTENSAO_ID_AQUI'>
    <updatecheck
      codebase='https://hub-producao-conteudo.vercel.app/alura-revisor-conteudo.zip'
      version='0.0.1' />
  </app>
</gupdate>`}</pre>
          <p className="text-xs text-muted-foreground">
            Substitua <code className="text-foreground">EXTENSAO_ID_AQUI</code> pelo ID real (visível em{" "}
            <code className="text-foreground">chrome://extensions/</code> após a primeira instalação) e atualize a <code className="text-foreground">version</code> a cada release.
          </p>
        </div>

        <div className="border border-sidebar-border rounded-xl p-5 bg-card space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Package size={16} strokeWidth={1.5} className="text-muted-foreground" />
            <span>Pacote da extensão</span>
            <code className="ml-auto text-xs text-muted-foreground font-mono">public/alura-revisor-conteudo.zip</code>
          </div>
          <p className="text-xs text-muted-foreground">
            Gere o ZIP no repositório <code className="text-foreground">alura-revisor-conteudo</code> e copie manualmente para <code className="text-foreground">public/</code> antes de cada deploy com nova versão.
          </p>
        </div>
      </div>

      <div className="text-xs text-muted-foreground space-y-1">
        <p className="font-semibold text-foreground">Fluxo de release:</p>
        <ol className="list-decimal list-inside space-y-1 pl-1">
          <li>Gerar ZIP da extensão e copiar para <code className="text-foreground">public/alura-revisor-conteudo.zip</code></li>
          <li>Atualizar <code className="text-foreground">version</code> no <code className="text-foreground">public/update.xml</code></li>
          <li>Fazer commit e push — o Chrome atualiza automaticamente em até 5 horas</li>
        </ol>
      </div>
    </div>
  )
}
