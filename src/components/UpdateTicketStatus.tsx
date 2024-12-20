'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Status } from "@prisma/client"
import { updateTicketStatus } from "@/action/ticket"

interface UpdateTicketStatusProps {
  ticketId: string
  currentStatus: Status
}

export function UpdateTicketStatus({ ticketId, currentStatus }: UpdateTicketStatusProps) {
  const [status, setStatus] = useState<Status>(currentStatus)

  const handleStatusChange = async (newStatus: Status) => {
    setStatus(newStatus)
    try {
      await updateTicketStatus(ticketId, newStatus)
    } catch (error) {
      console.error('Failed to update ticket status:', error)
      setStatus(currentStatus) // Revert on error
    }
  }

  return (
    <div className="flex items-center space-x-2">
      <Select onValueChange={(value) => handleStatusChange(value as Status)} value={status}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Changer le statut" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={Status.OPEN}>Ouvert</SelectItem>
          <SelectItem value={Status.IN_PROGRESS}>En cours</SelectItem>
          <SelectItem value={Status.CLOSED}>Fermé</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}

