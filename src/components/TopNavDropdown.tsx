"use client"

import { Button } from "../components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu"
import { signOut } from "next-auth/react"
import { User } from "lucide-react"
import { useState, useEffect } from "react"
import { getSession } from "@/lib/getSession"      

const TopNavDropdown = () => {

  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    const checkAdmin = async () => {
      const session = await getSession()
      setIsAdmin(session?.user.role === 'ADMIN' || false)
    }
    checkAdmin()
  }, [])

    const handleSignOut = async () => {
        await signOut({ callbackUrl: '/login' })
    }        
  return (
    <>
        <DropdownMenu>
        <DropdownMenuTrigger asChild>
            <Button
            variant="outline"
            size="icon"
            className="overflow-hidden rounded-full"
            >
            <User />
            </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
            <DropdownMenuLabel>Mon compte</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem disabled={!isAdmin} onSelect={() => isAdmin && (window.location.href = '/settings')}>Gestion des utilisateurs</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => window.location.href = '/contact'}>Assistance</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={handleSignOut}>
            Se déconnecter
        </DropdownMenuItem>
        </DropdownMenuContent>
        </DropdownMenu>    
    </>
  )
}

export default TopNavDropdown