"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut, useSession } from "next-auth/react"
import { Home, BookOpen, FileCheck, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"

const navItems = [
  { href: "/home", label: "Home", icon: Home },
  { href: "/biblioteca-de-prompts", label: "Biblioteca de Prompts", icon: BookOpen },
  { href: "/validacao-ementa", label: "Validação de Ementa", icon: FileCheck },
]

export function Sidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()

  return (
    <aside className="flex flex-col w-60 shrink-0 border-r bg-background h-screen sticky top-0">
      {/* Logo / nome do app */}
      <div className="px-4 py-5 border-b">
        <p className="text-sm font-semibold leading-tight">Hub de Produção</p>
        <p className="text-xs text-muted-foreground">de Conteúdo — Alura</p>
      </div>

      {/* Navegação */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || pathname.startsWith(href + "/")
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors ${
                isActive
                  ? "bg-primary text-primary-foreground font-medium"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <Icon size={16} />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Rodapé: usuário + logout */}
      <div className="px-3 py-4 border-t space-y-2">
        {session?.user && (
          <div className="px-3 py-2">
            <p className="text-xs font-medium truncate">{session.user.name}</p>
            <p className="text-xs text-muted-foreground truncate">{session.user.email}</p>
          </div>
        )}
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground"
          onClick={() => signOut({ callbackUrl: "/login" })}
        >
          <LogOut size={14} />
          Sair
        </Button>
      </div>
    </aside>
  )
}
