"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Search, User } from "lucide-react"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "../components/ui/breadcrumb"
import TopNavDropdown from "./TopNavDropdown"
import { Input } from "../components/ui/input"
import { getConversation } from "@/action/chat"

const getModelName = (platform: string) => {
  switch (platform.toLowerCase()) {
    case "article":
      return "Rédacteur d'articles de blogs"
    case "linkedin":
      return "Rédacteur de posts LinkedIn "
    case "igensia":
      return "Formaliseur de fiches de poste"
    case "vidéo":
      return "Créateur de vidéos avatarisées"
    case "cv":
      return "Scoreur de CVs"
    case "onboarding":
      return "Guide onboarding interactif"
    default:
      return "Modèle inconnu"
  }
}

const TopNav = ({ userRole }: { userRole: string }) => {
  const pathname = usePathname()
  const [userRoleName] = useState(userRole)
  const [items, setItems] = useState<Array<{ href: string; label: string }>>([])

  useEffect(() => {
    const fetchBreadcrumbItems = async () => {
      const paths = pathname.split("/").filter(Boolean)
      const newItems = await Promise.all(
        paths.map(async (path, index) => {
          const href = `/${paths.slice(0, index + 1).join("/")}`
          if (paths[0] === "chat" && index === 1) {
            try {
              const conversation = await getConversation(path)
              return { href, label: getModelName(conversation.platform) }
            } catch (error) {
              console.error("Error fetching conversation:", error)
              return { href, label: path }
            }
          }
          if (path === "settings") {
            return { href, label: "Gestion des utilisateurs" }
          }
          if (path === "ticket") {
            return { href, label: "Tickets" }
          }      
          if (path === "model") {
            return { href, label: "Modèle" }
          }     
          if (path === "chat") {
            return { href: "/model", label: "Modèle" }
          }              
          return { href, label: path.charAt(0).toUpperCase() + path.slice(1) }
        }),
      )
      setItems(newItems)
    }

    fetchBreadcrumbItems()
  }, [pathname])

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
      <Breadcrumb className="hidden md:flex">
        <BreadcrumbList>
          {items.map((item, index) => (
            <React.Fragment key={item.href}>
              <BreadcrumbItem>
                <BreadcrumbLink href={item.href}>
                  {item.label}
                </BreadcrumbLink>
              </BreadcrumbItem>
              {index < items.length - 1 && <BreadcrumbSeparator />}
            </React.Fragment>
          ))}
          {items.length > 0 && <BreadcrumbSeparator />}
          <BreadcrumbItem>
            <span className="text-muted-foreground">
              {userRoleName}
            </span>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <div className="relative ml-auto flex-1 md:grow-0">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Rechercher..."
          className="w-full rounded-lg bg-background pl-8 md:w-[200px] lg:w-[320px]"
        />
      </div>
      <TopNavDropdown />
    </header>
  )
}

export default TopNav

