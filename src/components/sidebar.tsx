"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import { Home, BookOpen, FileCheck, LogOut } from "lucide-react"

const navItems = [
  { href: "/home", label: "Início", icon: Home },
  { href: "/biblioteca-de-prompts", label: "Biblioteca de Prompts", icon: BookOpen },
  { href: "/validacao-ementa", label: "Validação de Ementa", icon: FileCheck },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="flex flex-col w-[116px] shrink-0 border-r border-sidebar-border bg-sidebar h-screen sticky top-0">
      {/* Cabeçalho */}
      <div className="flex flex-col items-center justify-center py-5 px-3 border-b border-sidebar-border shrink-0 gap-1">
        <span className="font-heading text-sm font-medium text-foreground/90 text-center leading-none">
          Conteúdo
        </span>
        <span className="text-[10px] text-muted-foreground tracking-widest uppercase">
          Alura
        </span>
      </div>

      {/* Navegação */}
      <nav className="flex-1 flex flex-col items-center py-4 gap-1 px-2">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || pathname.startsWith(href + "/")
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center justify-center gap-2 w-full py-4 px-2 rounded-xl transition-colors ${
                isActive
                  ? "bg-muted/80 text-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
              }`}
            >
              <Icon size={22} strokeWidth={isActive ? 2 : 1.5} />
              <span className="text-[11px] font-semibold leading-tight text-center">
                {label}
              </span>
            </Link>
          )
        })}
      </nav>

      {/* Logout */}
      <div className="shrink-0 border-t border-sidebar-border px-2 py-3">
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex flex-col items-center justify-center gap-2 w-full py-4 px-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors"
        >
          <LogOut size={20} strokeWidth={1.5} />
          <span className="text-[11px] font-semibold leading-none">Sair</span>
        </button>
      </div>
    </aside>
  )
}
