"use client"

import { useState, useEffect } from "react"
import { Eye, EyeOff, Save, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const SERVICES = [
  { id: "github", label: "GitHub Token", placeholder: "ghp_..." },
  { id: "video_uploader", label: "Video Uploader Token", placeholder: "token..." },
  { id: "claude_api_key", label: "Claude API Key", placeholder: "sk-ant-..." },
] as const

type ServiceId = (typeof SERVICES)[number]["id"]

export function CredenciaisTab() {
  const [configured, setConfigured] = useState<Partial<Record<ServiceId, boolean>>>({})
  const [values, setValues] = useState<Partial<Record<ServiceId, string>>>({})
  const [visible, setVisible] = useState<Partial<Record<ServiceId, boolean>>>({})
  const [saving, setSaving] = useState<ServiceId | null>(null)
  const [saved, setSaved] = useState<Partial<Record<ServiceId, boolean>>>({})
  const [errors, setErrors] = useState<Partial<Record<ServiceId, string>>>({})

  useEffect(() => {
    fetch("/api/revisor/config")
      .then((r) => r.json())
      .then((data) => {
        const cfg: Partial<Record<ServiceId, boolean>> = {}
        for (const { id } of SERVICES) {
          cfg[id] = data[id]?.configured ?? false
        }
        setConfigured(cfg)
      })
      .catch(() => {})
  }, [])

  async function handleSave(service: ServiceId) {
    const value = values[service]
    if (!value?.trim()) return

    setSaving(service)
    setErrors((e) => ({ ...e, [service]: undefined }))

    try {
      const res = await fetch("/api/revisor/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ service, value }),
      })

      if (!res.ok) {
        const data = await res.json()
        setErrors((e) => ({ ...e, [service]: data.error ?? "Erro ao salvar" }))
        return
      }

      setConfigured((c) => ({ ...c, [service]: true }))
      setSaved((s) => ({ ...s, [service]: true }))
      setValues((v) => ({ ...v, [service]: "" }))
      setTimeout(() => setSaved((s) => ({ ...s, [service]: false })), 2000)
    } catch {
      setErrors((e) => ({ ...e, [service]: "Falha na conexão" }))
    } finally {
      setSaving(null)
    }
  }

  return (
    <div className="max-w-lg">
      <p className="text-sm text-muted-foreground mb-6">
        Credenciais globais usadas pela extensão Chrome. Visíveis e editáveis apenas por admins.
      </p>
      <div className="space-y-5">
        {SERVICES.map(({ id, label, placeholder }) => (
          <div key={id} className="space-y-1.5">
            <div className="flex items-center gap-2">
              <Label htmlFor={id}>{label}</Label>
              {configured[id] && (
                <span className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                  <CheckCircle2 size={12} />
                  configurado
                </span>
              )}
            </div>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  id={id}
                  type={visible[id] ? "text" : "password"}
                  placeholder={configured[id] ? "••••••• (substituir)" : placeholder}
                  value={values[id] ?? ""}
                  onChange={(e) =>
                    setValues((v) => ({ ...v, [id]: e.target.value }))
                  }
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setVisible((v) => ({ ...v, [id]: !v[id] }))}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                >
                  {visible[id] ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <Button
                size="sm"
                variant={saved[id] ? "outline" : "default"}
                disabled={!values[id]?.trim() || saving === id}
                onClick={() => handleSave(id)}
                className="shrink-0"
              >
                <Save size={14} className="mr-1.5" />
                {saved[id] ? "Salvo" : saving === id ? "Salvando..." : "Salvar"}
              </Button>
            </div>
            {errors[id] && (
              <p className="text-xs text-destructive">{errors[id]}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
