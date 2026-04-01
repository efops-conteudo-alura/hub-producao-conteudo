"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { AcoesTab } from "./acoes-tab"
import { AuditoriasTab } from "./auditorias-list"
import { CredenciaisTab } from "./credenciais-form"
import { DistribuicaoTab } from "./distribuicao-tab"

type Tab = "acoes" | "auditorias" | "credenciais" | "distribuicao"

interface RevisorTabsProps {
  isAdmin: boolean
}

export function RevisorTabs({ isAdmin }: RevisorTabsProps) {
  const [activeTab, setActiveTab] = useState<Tab>("acoes")

  const tabs: { key: Tab; label: string }[] = [
    { key: "acoes", label: "Ações" },
    { key: "auditorias", label: "Auditorias" },
    { key: "credenciais", label: "Credenciais" },
    ...(isAdmin ? [{ key: "distribuicao" as Tab, label: "Distribuição" }] : []),
  ]

  return (
    <div>
      <div className="flex mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              "px-5 py-4 text-xs font-mono font-semibold uppercase border border-sidebar-border -ml-px first:ml-0 transition-colors relative",
              activeTab === tab.key
                ? "bg-card text-foreground border-t-foreground z-10"
                : "bg-sidebar text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "acoes" && <AcoesTab />}
      {activeTab === "auditorias" && <AuditoriasTab isAdmin={isAdmin} />}
      {activeTab === "credenciais" && <CredenciaisTab />}
      {activeTab === "distribuicao" && isAdmin && <DistribuicaoTab />}
    </div>
  )
}
