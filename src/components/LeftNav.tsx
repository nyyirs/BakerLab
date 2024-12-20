"use client"

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, File, LibraryBig, Users2, LineChart, HelpCircle, Settings } from 'lucide-react'
import Image from 'next/image'
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { getSession } from "@/lib/getSession"

interface NavItemProps {
  href: string
  icon: React.ReactNode
  children: React.ReactNode
  disabled?: boolean
  isActive?: boolean
}

const NavItem = ({ href, icon, children, disabled = false, isActive = false }: NavItemProps) => (
  <Button
    asChild
    variant="ghost"
    className={cn(
      "w-full justify-start hover:bg-BakerLabButton/85 hover:text-white",
      disabled && "opacity-50 cursor-not-allowed",
      isActive && "bg-BakerLabButton text-white"
    )}
    disabled={disabled}
  >
    <Link href={href} className="flex items-center gap-3 py-2">
      {icon}
      <span className="hidden md:inline-block">{children}</span>
    </Link>
  </Button>
)

const LeftNav = () => {
  const pathname = usePathname()
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    const checkAdmin = async () => {
      const session = await getSession()
      setIsAdmin(session?.user.role === 'ADMIN' || false)
    }
    checkAdmin()
  }, [])

  return (
    <div className="flex flex-col h-full bg-BakerLabBackground text-white">
      <div className="flex justify-center py-6">
        <Link href="/">
          <Image src="/BakerLabLogo.png" alt="logo" width={119} height={56} style={{ width: 'auto', height: 'auto' }} priority className="w-auto h-8 md:h-14"/>
        </Link>
      </div>
      
      <ScrollArea className="flex-grow px-3">
        <div className="space-y-1">
          <NavItem href="/main" icon={<Home className="h-5 w-5" />} isActive={pathname === '/main'}>Accueil</NavItem>
          <NavItem href="/model" icon={<LibraryBig className="h-5 w-5" />} disabled={!isAdmin}>Modèles IA</NavItem>
          <NavItem href="/stats" icon={<LineChart className="h-5 w-5" />} disabled={!isAdmin}>Statistiques</NavItem>
        </div>
      </ScrollArea>

      <div className="mt-auto px-3 space-y-1">
        <NavItem href="/contact" icon={<HelpCircle className="h-5 w-5" />} disabled={!isAdmin}>Assistance</NavItem>
        <NavItem href={isAdmin ? "/settings" : ""} icon={<Settings className="h-5 w-5" />} disabled={!isAdmin}>Paramètres</NavItem>
      </div>

      <div className="flex items-center justify-center py-4 text-xs text-muted-foreground">
        <p className="hidden md:block mr-1">made with ❤️ by</p>
        <Image src="/BakerLabLogo.png" alt="Baker LAB Logo" width={80} height={51} priority={false} className="w-auto h-4"/>
      </div>
    </div>
  )
}

export default LeftNav