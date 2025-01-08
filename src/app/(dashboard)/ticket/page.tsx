'use client'

import { useEffect, useState } from 'react'
import { TicketsTable } from "@/components/TicketList"
import { CreateTicketDialog } from "@/components/CreateTicketDialog"
import { getTickets, getAdminUsers } from "@/action/ticket"
import { getSession } from "@/lib/getSession"
import { Ticket, User, Role } from "@prisma/client"

export default function TicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [adminUsers, setAdminUsers] = useState<User[]>([])
  const [session, setSession] = useState<any>(null)

  useEffect(() => {
    async function fetchData() {
      const fetchedSession = await getSession()
      setSession(fetchedSession)
      if (fetchedSession && fetchedSession.user) {
        const [fetchedTickets, fetchedAdminUsers] = await Promise.all([
          getTickets(),
          getAdminUsers(),
        ])
        setTickets(fetchedTickets)
        setAdminUsers(fetchedAdminUsers)
      }
    }
    fetchData()
  }, [])

  const handleTicketCreated = (newTicket: Ticket) => {
    setTickets(prevTickets => [newTicket, ...prevTickets])
  }

  if (!session || !session.user) {
    return <div>Please log in to view your tickets.</div>
  }

  return (
    <div className="container py-10">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Mes tickets</h1>
          <p className="text-muted-foreground">
            Vous constatez une anomalie ou un bug ? Envoyez un ticket et notre équipe s&apos;en chargera au plus vite.
          </p>
        </div>
        <CreateTicketDialog adminUsers={adminUsers} onTicketCreated={handleTicketCreated} />
      </div>
      <TicketsTable tickets={tickets} currentUserId={session.user.id} userRole={session.user.role as Role} />
    </div>
  )
}

