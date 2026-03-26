"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut, useSession } from "next-auth/react"
import { Home, BookOpen, FileCheck, LogOut } from "lucide-react"

const navItems = [
  { href: "/home", label: "Início", icon: Home },
  { href: "/biblioteca-de-prompts", label: "Biblioteca", icon: BookOpen },
  { href: "/validacao-ementa", label: "Validação", icon: FileCheck },
]

export function Sidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()

  return (
    <aside className="flex flex-col w-[62px] shrink-0 border-r border-border bg-sidebar h-screen sticky top-0">
      {/* Logo */}
      <div className="flex items-center justify-center h-14 border-b border-border shrink-0">
        <span className="font-heading text-[11px] font-medium text-foreground/80 tracking-wide">
          Hub
        </span>
      </div>

      {/* Navegação */}
      <nav className="flex-1 flex flex-col items-center py-2 gap-0.5">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || pathname.startsWith(href + "/")
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center justify-center gap-1.5 w-full py-3 transition-colors ${
                isActive
                  ? "text-foreground bg-muted/60"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
              }`}
            >
              <Icon size={17} strokeWidth={isActive ? 2 : 1.5} />
              <span className="text-[9px] leading-none tracking-wide">{label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Logout */}
      <div className="shrink-0 border-t border-border">
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          title={`Sair${session?.user?.name ? ` (${session.user.name})` : ""}`}
          className="flex flex-col items-center justify-center gap-1.5 w-full py-3 text-muted-foreground hover:text-foreground transition-colors"
        >
          <LogOut size={17} strokeWidth={1.5} />
          <span className="text-[9px] leading-none tracking-wide">Sair</span>
        </button>
      </div>
    </aside>
  )
}
