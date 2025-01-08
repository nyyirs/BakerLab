'use client'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Filter } from 'lucide-react'
import { formatDate } from "@/lib/utils"
import { Status, Priority, Ticket, User, Role } from "@prisma/client"
import { useState, useEffect } from "react"
import Link from "next/link"

type TicketWithUsers = Ticket & {
  requestedBy: User
  assignedTo: User | null
}

interface TicketsTableProps {
  tickets: TicketWithUsers[]
  currentUserId: string
  userRole: Role
}

export function TicketsTable({ tickets, currentUserId, userRole }: TicketsTableProps) {
  const [status, setStatus] = useState<Status | 'ALL'>('ALL')
  const [filteredTickets, setFilteredTickets] = useState<TicketWithUsers[]>([])

  useEffect(() => {
    const filteredByStatus = status === 'ALL' 
      ? tickets 
      : tickets.filter(ticket => ticket.status === status)

    setFilteredTickets(filteredByStatus)
  }, [tickets, status])

  const priorityColors = {
    [Priority.LOW]: 'bg-slate-500',
    [Priority.NORMAL]: 'bg-yellow-500',
    [Priority.URGENT]: 'bg-red-500',
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between">
        <Tabs defaultValue="ALL" onValueChange={(value) => setStatus(value as Status | 'ALL')}>
          <TabsList>
            <TabsTrigger value="ALL">Tous</TabsTrigger>
            <TabsTrigger value={Status.OPEN}>Soumis</TabsTrigger>
            <TabsTrigger value={Status.IN_PROGRESS}>En cours</TabsTrigger>
            <TabsTrigger value={Status.CLOSED}>Résolus</TabsTrigger>
          </TabsList>
        </Tabs>
        <Button variant="outline" size="sm">
          <Filter className="w-4 h-4 mr-2" />
          Filtrer
        </Button>
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Date ouverture</TableHead>
              <TableHead>Sujet</TableHead>
              <TableHead>Priorité</TableHead>
              {userRole === Role.ADMIN && <TableHead>Demandé par</TableHead>}
              <TableHead>Statut</TableHead>
              <TableHead>Assigné à</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTickets.map((ticket) => (
              <TableRow key={ticket.id}>
                <TableCell>
                  <Link href={`/ticket/${ticket.id}`} className="text-blue-600 hover:underline">
                    #{ticket.id.slice(0, 8)}
                  </Link>
                </TableCell>
                <TableCell>{formatDate(ticket.createdAt)}</TableCell>
                <TableCell>{ticket.subject}</TableCell>
                <TableCell>
                  <Badge className={priorityColors[ticket.priority]}>
                    {ticket.priority === 'LOW' && 'Faible'}
                    {ticket.priority === 'NORMAL' && 'Normal'}
                    {ticket.priority === 'URGENT' && 'Urgent'}
                  </Badge>
                </TableCell>
                {userRole === Role.ADMIN && <TableCell>{ticket.requestedBy.email}</TableCell>}
                <TableCell>
                  {ticket.status === 'OPEN' && 'Soumis'}
                  {ticket.status === 'IN_PROGRESS' && 'En cours'} 
                  {ticket.status === 'CLOSED' && 'Résolu'}
                </TableCell>
                <TableCell>{ticket.assignedTo?.email ?? '-'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

