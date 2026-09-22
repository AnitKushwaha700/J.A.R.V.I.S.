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
} from "@/components/ui/sidebar"
import Link from "next/link"
import { usePathname } from "next/navigation"

const data = {
  navMain: [
    {
      title: "Navigation",
      items: [
        {
          title: "Home",
          url: "/",
          icon: Home,
        },
        {
          title: "Dashboard",
          url: "/dashboard",
          icon: LayoutDashboard,
        },
        {
          title: "Practice",
          url: "/practice",
          icon: GraduationCap,
        },
        {
          title: "Voice Assistant",
          url: "/voice",
          icon: Mic,
        },
      ],
    },
    {
      title: "Review",
      items: [
        {
          title: "History",
          url: "/history",
          icon: History,
        },
        {
          title: "Grammar",
          url: "/grammar",
          icon: BookOpen,
        },
        {
          title: "Vocabulary",
          url: "/vocabulary",
          icon: Lightbulb,
        },
      ],
    },
    {
      title: "Account",
      items: [
        {
          title: "Profile",
          url: "/profile",
          icon: User,
        },
        {
          title: "Settings",
          url: "/settings",
          icon: Settings,
        },
      ],
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()
  
  return (
    <Sidebar {...props} className="border-r border-border/40 bg-sidebar/95 backdrop-blur-xl">
      <SidebarHeader className="py-5 px-4 border-b border-border/40">
        <Link href="/" className="flex items-center gap-3 group transition-all">
          <div className="flex aspect-square size-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 shadow-md shadow-indigo-500/20 text-white transition-transform duration-300 group-hover:scale-105 group-hover:shadow-indigo-500/40">
            <Mic className="size-5 transition-transform duration-300 group-hover:scale-110" />
          </div>
          <div className="flex flex-col">
            <h2 className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500">
              TalkMe AI
            </h2>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/80">
              Your AI Coach
            </span>
          </div>
        </Link>
      </SidebarHeader>
      <SidebarContent className="px-2 py-4">
        {data.navMain.map((item) => (
          <SidebarGroup key={item.title} className="mb-4">
            <SidebarGroupLabel className="text-[11px] font-semibold text-indigo-500/80 uppercase tracking-wider mb-1 px-2">
              {item.title}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {item.items.map((item) => {
                  const isActive = pathname === item.url
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton 
                        isActive={isActive} 
                        render={<Link href={item.url} />}
                        className={`transition-all duration-200 ${
                          isActive 
                            ? "bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-500/20" 
                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                        }`}
                      >
                        <item.icon className={`size-4 ${isActive ? "text-indigo-600 dark:text-indigo-400" : ""}`} />
                        <span className="font-medium">{item.title}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  )
}
