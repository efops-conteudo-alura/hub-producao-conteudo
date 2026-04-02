"use client"

import { FileCode2, Package, Info, Terminal } from "lucide-react"

const EXTENSION_VERSION = "0.3.0"
const EXTENSION_ID = "gdabdjfmfbmmfoklejfhpjlkdohimjfe"

export function DistribuicaoTab() {
  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-start gap-3 border border-sidebar-border rounded-xl p-4 bg-card text-sm text-muted-foreground">
        <Info size={16} strokeWidth={1.5} className="shrink-0 mt-0.5" />
        <p>
          O Chrome consulta o <code className="text-foreground">update.xml</code> a cada ~5 horas e atualiza a extensão silenciosamente, sem o usuário precisar reinstalar.
          Versão atual: <code className="text-foreground">{EXTENSION_VERSION}</code>
        </p>
      </div>

      {/* Arquivos estáticos */}
      <div className="space-y-3">
        <div className="border border-sidebar-border rounded-xl p-5 bg-card space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            <FileCode2 size={16} strokeWidth={1.5} className="text-muted-foreground" />
            <span>update.xml</span>
            <code className="ml-auto text-xs text-muted-foreground font-mono">public/update.xml</code>
          </div>
          <pre className="text-xs bg-sidebar rounded-lg p-3 overflow-x-auto text-muted-foreground leading-relaxed">{`<?xml version='1.0' encoding='UTF-8'?>
<gupdate xmlns='http://www.google.com/update2/response' protocol='2.0'>
  <app appid='${EXTENSION_ID}'>
    <updatecheck
      codebase='https://hub-producao-conteudo.vercel.app/alura-revisor-conteudo.zip'
      version='${EXTENSION_VERSION}' />
  </app>
</gupdate>`}</pre>
        </div>

        <div className="border border-sidebar-border rounded-xl p-5 bg-card space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Package size={16} strokeWidth={1.5} className="text-muted-foreground" />
            <span>Pacote da extensão</span>
            <code className="ml-auto text-xs text-muted-foreground font-mono">public/alura-revisor-conteudo.zip</code>
          </div>
          <p className="text-xs text-muted-foreground">
            Gerado a partir de todos os arquivos do repositório <code className="text-foreground">alura-revisor-conteudo</code> (exceto <code className="text-foreground">.git</code> e <code className="text-foreground">*.md</code>).
          </p>
        </div>
      </div>

      {/* Fluxo de release */}
      <div className="border border-sidebar-border rounded-xl p-5 bg-card space-y-4">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Terminal size={16} strokeWidth={1.5} className="text-muted-foreground" />
          <span>Como fazer uma nova release</span>
        </div>

        <ol className="space-y-4 text-sm">
          <li className="flex gap-3">
            <span className="shrink-0 w-5 h-5 rounded-full bg-muted text-foreground text-xs flex items-center justify-center font-semibold mt-0.5">1</span>
            <div className="space-y-1">
              <p className="text-foreground font-medium">Bumpar a versão em dois lugares</p>
              <p className="text-muted-foreground text-xs">No <code className="text-foreground">manifest.json</code> da extensão e no <code className="text-foreground">public/update.xml</code> do hub — ambos com o mesmo número.</p>
            </div>
          </li>
          <li className="flex gap-3">
            <span className="shrink-0 w-5 h-5 rounded-full bg-muted text-foreground text-xs flex items-center justify-center font-semibold mt-0.5">2</span>
            <div className="space-y-2">
              <p className="text-foreground font-medium">Gerar o novo ZIP</p>
              <p className="text-muted-foreground text-xs">Rodar no terminal dentro da pasta <code className="text-foreground">alura-revisor-conteudo</code>:</p>
              <pre className="text-xs bg-sidebar rounded-lg p-3 overflow-x-auto text-muted-foreground leading-relaxed whitespace-pre-wrap break-all">{`powershell -Command "Compress-Archive -Path manifest.json,background.js,content.js,content-hub.js,content-dropbox.js,popup.html,popup.js,icon16.png,icon48.png,icon128.png,jsconfig.json,icons -DestinationPath '../projeto-hub-producao-conteudo/public/alura-revisor-conteudo.zip' -Force"`}</pre>
            </div>
          </li>
          <li className="flex gap-3">
            <span className="shrink-0 w-5 h-5 rounded-full bg-muted text-foreground text-xs flex items-center justify-center font-semibold mt-0.5">3</span>
            <div className="space-y-1">
              <p className="text-foreground font-medium">Commit e push do hub</p>
              <p className="text-muted-foreground text-xs">O deploy na Vercel sobe o novo ZIP e o <code className="text-foreground">update.xml</code>. Em até 5 horas, todos os usuários recebem a atualização automaticamente.</p>
            </div>
          </li>
        </ol>
      </div>
    </div>
  )
}
