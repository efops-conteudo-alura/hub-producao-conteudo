"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { signOut, useSession } from "next-auth/react"
import { Home, BookOpen, FileCheck, LogOut, GraduationCap, BookMarked, BarChart2, ListChecks, ScanSearch, FileText } from "lucide-react"
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
  { href: "/contratos", label: "Contratos", icon: FileText },
  { href: "/pesquisa-mercado", label: "Pesquisa de Mercado", icon: BarChart2 },
  { href: "/validacao-ementa", label: "Validação de Ementa", icon: FileCheck },
  { href: "/revisao-didatica", label: "Revisão Didática", icon: GraduationCap },
  { href: "/seletor-de-atividades", label: "Seletor de Ativ.", icon: ListChecks },
  { href: "/plano-de-estudos", label: "Plano de Estudos", icon: BookMarked },
  { href: "/revisor-conteudo", label: "Revisor de Conteúdo", icon: ScanSearch },
  { href: "/biblioteca-de-prompts", label: "Biblioteca de Prompts", icon: BookOpen },
]

const seletorItem = { href: "/seletor-de-atividades", label: "Seletor de Ativ.", icon: ListChecks }

function NavLink({ href, label, icon: Icon }: { href: string; label: string; icon: React.ElementType }) {
  const pathname = usePathname()
  const isActive = pathname === href || pathname.startsWith(href + "/")
  return (
    <Link
      href={href}
      className={`flex items-center gap-2 w-full px-3 py-3 rounded-[8px] transition-colors ${
        isActive
          ? "bg-muted text-foreground"
          : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
      }`}
    >
      <Icon size={20} strokeWidth={isActive ? 2 : 1.5} className="shrink-0" />
      <span className={`text-sm leading-tight ${isActive ? "font-semibold" : "font-normal"}`}>
        {label}
      </span>
    </Link>
  )
}

export function Sidebar({ user }: SidebarProps) {
  const { data: session } = useSession()
  const [profileOpen, setProfileOpen] = useState(false)

  const isInstructor = session?.user?.role === "INSTRUCTOR"
  const canChangePassword = true

  const visibleItems = isInstructor ? [seletorItem] : mainNavItems
  const initials = (user.name || user.email || "U")[0]?.toUpperCase()

  return (
    <aside className="flex flex-col w-[220px] shrink-0 border-r border-sidebar-border bg-sidebar h-screen sticky top-0">
      {/* Logo */}
      <div className="flex flex-col items-start px-5 pt-7 pb-6 shrink-0">
        <Image
          src="/alura-logo.svg"
          alt="Alura"
          width={107}
          height={32}
          className="[filter:brightness(0)_invert(1)] opacity-90"
          priority
        />
        <span className="text-[10px] font-medium text-muted-foreground tracking-widest uppercase mt-2">
          Produção de Conteúdo
        </span>
      </div>

      {/* Navegação */}
      <nav className="flex-1 flex flex-col px-3 gap-2 overflow-y-auto pb-4">
        {visibleItems.map((item) => (
          <NavLink key={item.href} {...item} />
        ))}
      </nav>

      {/* Usuário + Logout */}
      <div className="shrink-0 border-t border-sidebar-border px-3 py-3 flex flex-col gap-1">
        <button
          onClick={() => !isInstructor && setProfileOpen(true)}
          className={`flex items-center gap-2 w-full px-3 py-3 rounded-[8px] transition-colors ${
            !isInstructor
              ? "hover:bg-muted/50 cursor-pointer"
              : "cursor-default"
          }`}
          title={!isInstructor ? "Editar perfil" : (user.name ?? "")}
        >
          <Avatar className="h-5 w-5 shrink-0">
            {user.image && <AvatarImage src={user.image} alt={user.name ?? ""} />}
            <AvatarFallback className="text-[9px] bg-sidebar-accent text-foreground">
              {initials}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm font-normal text-muted-foreground leading-tight truncate">
            {user.name || user.email}
          </span>
        </button>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex items-center gap-2 w-full px-3 py-3 rounded-[8px] text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors"
        >
          <LogOut size={20} strokeWidth={1.5} className="shrink-0" />
          <span className="text-sm font-normal leading-tight">Sair</span>
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
