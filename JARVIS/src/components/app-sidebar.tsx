"use client"

import * as React from "react"
import {
  Home,
  Mic,
  Settings,
  User,
  LayoutDashboard,
  GraduationCap,
  History,
  BookOpen,
  Lightbulb,
  Code2,
  TrendingUp,
  BookOpenCheck,
  Languages,
  Briefcase,
  Zap,
} from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar"
import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"

const data = {
  navMain: [
    {
      title: "Navigation",
      items: [
        { title: "Home", url: "/", icon: Home },
        { title: "JARVIS HUD", url: "/jarvis", icon: Zap },
        { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
      ],
    },
    {
      title: "🤖 AI Agent Modes",
      items: [
        { title: "Free Talk", url: "/voice?mode=free-talk", icon: Mic },
        { title: "Interview Prep", url: "/voice?mode=interview", icon: Briefcase },
        { title: "Coding Tutor", url: "/voice?mode=coding-tutor", icon: Code2 },
        { title: "Career Advisor", url: "/voice?mode=career-advisor", icon: TrendingUp },
        { title: "AI Teacher", url: "/voice?mode=ai-teacher", icon: BookOpenCheck },
        { title: "Translator", url: "/voice?mode=translator", icon: Languages },
      ],
    },
    {
      title: "🎓 English Fluency",
      items: [
        { title: "All Scenarios", url: "/practice", icon: GraduationCap },
        { title: "History", url: "/history", icon: History },
        { title: "Grammar Review", url: "/grammar", icon: BookOpen },
        { title: "Vocabulary Vault", url: "/vocabulary", icon: Lightbulb },
      ],
    },
    {
      title: "Account",
      items: [
        { title: "Profile", url: "/profile", icon: User },
        { title: "Settings", url: "/settings", icon: Settings },
      ],
    },
  ],
}

function SidebarContent_() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const currentMode = searchParams.get("mode")

  return (
    <SidebarContent className="px-2 py-3">
      {data.navMain.map((group) => (
        <SidebarGroup key={group.title} className="mb-3">
          <SidebarGroupLabel className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-1 px-2.5">
            {group.title}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-0.5">
              {group.items.map((item) => {
                const urlPath = item.url.split("?")[0]
                const urlMode = new URLSearchParams(item.url.split("?")[1] || "").get("mode")
                const isActive =
                  pathname === item.url ||
                  (pathname === urlPath && urlMode && urlMode === currentMode) ||
                  (pathname === urlPath && !urlMode && !currentMode && item.url === pathname)

                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      isActive={!!isActive}
                      render={<Link href={item.url} />}
                      className={`h-9 px-3 rounded-xl transition-all duration-200 text-xs font-medium ${
                        isActive
                          ? "bg-gradient-to-r from-indigo-500/20 to-purple-500/10 text-indigo-300 font-semibold border-l-2 border-indigo-500 shadow-sm"
                          : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                      }`}
                    >
                      <item.icon className={`size-4 shrink-0 ${isActive ? "text-indigo-400" : "text-muted-foreground"}`} />
                      <span className="truncate">{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      ))}
    </SidebarContent>
  )
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar {...props} className="border-r border-border/40 bg-sidebar/90 backdrop-blur-2xl">
      <SidebarHeader className="py-4 px-4 border-b border-border/40">
        <Link href="/" className="flex items-center gap-3 group transition-all">
          <div className="relative flex aspect-square size-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 shadow-lg shadow-indigo-500/30 text-white transition-transform duration-300 group-hover:scale-105">
            <Mic className="size-5 transition-transform duration-300 group-hover:scale-110" />
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
          </div>
          <div className="flex flex-col">
            <h2 className="text-base font-extrabold font-heading bg-clip-text text-transparent bg-gradient-to-r from-white via-indigo-200 to-indigo-400">
              TalkMe AI
            </h2>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/90">
              Your Personal Jarvis
            </span>
          </div>
        </Link>
      </SidebarHeader>

      <React.Suspense fallback={null}>
        <SidebarContent_ />
      </React.Suspense>

      <SidebarFooter className="p-3 border-t border-border/40">
        <div className="p-3 rounded-2xl bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-transparent border border-indigo-500/20 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-indigo-400" />
              <span className="text-[11px] font-bold text-foreground">Jarvis Engine</span>
            </div>
            <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-semibold">
              Live
            </span>
          </div>
          <p className="text-[10px] text-muted-foreground leading-tight">
            100% Free · Gemini 2.0 Flash · Multilingual Voice
          </p>
        </div>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
