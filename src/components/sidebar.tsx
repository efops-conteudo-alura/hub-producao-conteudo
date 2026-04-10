"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut, useSession } from "next-auth/react"
import { Home, BookOpen, FileCheck, LogOut, GraduationCap, BookMarked, BarChart2, ListChecks, ScanSearch } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ProfileDialog } from "@/components/profile-dialog"

interface SidebarProps {
  user: {
    name?: string | null
    email?: string | null
    image?: string | null
  }
}

const mainNavItems = [
  { href: "/home", label: "Início", icon: Home },
  { href: "/pesquisa-mercado", label: "Pesquisa de Mercado", icon: BarChart2 },
  { href: "/validacao-ementa", label: "Validação de Ementa", icon: FileCheck },
  { href: "/revisao-didatica", label: "Revisão Didática", icon: GraduationCap },
  { href: "/seletor-de-atividades", label: "Seletor de Ativ.", icon: ListChecks },
  { href: "/plano-de-estudos", label: "Plano de Estudos", icon: BookMarked },
  { href: "/revisor-conteudo", label: "Revisor de Conteúdo", icon: ScanSearch },
]

const bottomNavItems = [
  { href: "/biblioteca-de-prompts", label: "Biblioteca de Prompts", icon: BookOpen },
]

function NavLink({ href, label, icon: Icon }: { href: string; label: string; icon: React.ElementType }) {
  const pathname = usePathname()
  const isActive = pathname === href || pathname.startsWith(href + "/")
  return (
    <Link
      href={href}
      className={`flex flex-col items-center justify-center gap-2 w-full py-4 px-2 rounded-xl transition-colors ${
        isActive
          ? "bg-muted text-foreground"
          : "text-foreground/70 hover:text-foreground hover:bg-muted/50"
      }`}
    >
      <Icon size={22} strokeWidth={isActive ? 2 : 1.5} />
      <span className="text-[11px] font-semibold leading-tight text-center">
        {label}
      </span>
    </Link>
  )
}

const seletorItem = { href: "/seletor-de-atividades", label: "Seletor de Ativ.", icon: ListChecks }

export function Sidebar({ user }: SidebarProps) {
  const { data: session } = useSession()
  const [profileOpen, setProfileOpen] = useState(false)

  const isInstructor =
    session?.user?.role === "INSTRUCTOR" ||
    (session?.user?.selectorRole === "INSTRUCTOR" && !session?.user?.role)
  const canChangePassword = true // todos os usuários agora têm senha

  const visibleMainItems = isInstructor ? [seletorItem] : mainNavItems
  const visibleBottomItems = isInstructor ? [] : bottomNavItems

  const initials = (user.name || user.email || "U")[0]?.toUpperCase()

  return (
    <aside className="flex flex-col w-[148px] shrink-0 border-r border-sidebar-border bg-sidebar h-screen sticky top-0">
      {/* Cabeçalho */}
      <div className="flex flex-col items-center justify-center py-5 px-3 border-b border-sidebar-border shrink-0 gap-1">
        <span className="font-heading text-sm font-medium text-foreground/90 text-center leading-none">
          Conteúdo
        </span>
        <span className="text-[10px] text-muted-foreground tracking-widest uppercase">
          Alura
        </span>
      </div>

      {/* Navegação principal (produção) */}
      <nav className="flex-1 flex flex-col items-center py-4 gap-2 px-2 overflow-y-auto">
        {visibleMainItems.map((item) => (
          <NavLink key={item.href} {...item} />
        ))}
      </nav>

      {/* Navegação secundária (consulta) */}
      {visibleBottomItems.length > 0 && (
        <div className="shrink-0 border-t border-sidebar-border px-2 py-3 flex flex-col gap-2">
          {visibleBottomItems.map((item) => (
            <NavLink key={item.href} {...item} />
          ))}
        </div>
      )}

      {/* Usuário + Logout */}
      <div className="shrink-0 border-t border-sidebar-border px-2 py-3 flex flex-col items-center gap-1">
        <button
          onClick={() => !isInstructor && setProfileOpen(true)}
          className={`rounded-full mb-1 transition-opacity ${
            !isInstructor ? "hover:opacity-80 cursor-pointer" : "cursor-default"
          }`}
          title={!isInstructor ? "Editar perfil" : (user.name ?? "")}
        >
          <Avatar className="h-8 w-8">
            {user.image && <AvatarImage src={user.image} alt={user.name ?? ""} />}
            <AvatarFallback className="text-xs bg-sidebar-accent text-foreground">
              {initials}
            </AvatarFallback>
          </Avatar>
        </button>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex flex-col items-center justify-center gap-2 w-full py-4 px-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors"
        >
          <LogOut size={20} strokeWidth={1.5} />
          <span className="text-[11px] font-semibold leading-none">Sair</span>
        </button>
      </div>

      <ProfileDialog
        open={profileOpen}
        onOpenChange={setProfileOpen}
        user={user}
        canChangePassword={canChangePassword}
      />
    </aside>
  )
}
