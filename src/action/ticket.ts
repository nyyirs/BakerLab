'use server'

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { Priority, Status, Role } from "@prisma/client"
import fs from 'fs/promises'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'
import { getSession } from "@/lib/getSession"

export async function createTicket(formData: FormData) {
  const subject = formData.get('subject') as string
  const description = formData.get('description') as string
  const priority = formData.get('priority') as Priority
  const assignedToId = formData.get('assignedToId') as string
  const file = formData.get('file') as File | null

  if (!subject || !description || !priority || !assignedToId) {
    throw new Error('Missing required fields')
  }

  let fileUrl = null
  if (file && file.size > 0) {
    const fileName = `${uuidv4()}_${file.name}`
    const uploadDir = path.join(process.cwd(), 'public', 'upload_docs')
    
    // Ensure the upload directory exists
    await fs.mkdir(uploadDir, { recursive: true })
    
    const filePath = path.join(uploadDir, fileName)
    const buffer = Buffer.from(await file.arrayBuffer())
    await fs.writeFile(filePath, buffer)
    
    fileUrl = `/upload_docs/${fileName}`
  }

  const session = await getSession()
  if (!session || !session.user) {
    throw new Error('User not authenticated')
  }

  const ticket = await prisma.ticket.create({
    data: {
      subject,
      description,
      priority,
      status: Status.OPEN,
      assignedToId,
      requestedById: session.user.id, 
      fileUrl,
    },
    include: {
      requestedBy: true,
      assignedTo: true,
    },
  })

  revalidatePath('/tickets')
  return ticket
}

export async function getTickets(status?: Status) {
  const session = await getSession()
  
  if (!session || !session.user) {
    throw new Error('User not authenticated')
  }

  const isAdmin = session.user.role === Role.ADMIN

  const tickets = await prisma.ticket.findMany({
    where: {
      ...(status ? { status } : {}),
      ...(isAdmin ? {} : { requestedById: session.user.id }),
    },
    include: {
      requestedBy: true,
      assignedTo: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  })
  return tickets
}

export async function getAdminUsers() {
  const adminUsers = await prisma.user.findMany({
    where: {
      role: 'ADMIN',
    },
  })
  return adminUsers
}

export async function getTicketById(id: string) {
  const ticket = await prisma.ticket.findUnique({
    where: { id },
    include: {
      requestedBy: true,
      assignedTo: true,
    },
  })
  
  if (!ticket) {
    throw new Error('Ticket not found')
  }

  return ticket
}

export async function updateTicketStatus(ticketId: string, newStatus: Status) {
  const session = await getSession()
  
  if (!session || !session.user || session.user.role !== 'ADMIN') {
    throw new Error('Unauthorized')
  }

  const updatedTicket = await prisma.ticket.update({
    where: { id: ticketId },
    data: { status: newStatus },
  })

  revalidatePath(`/tickets/${ticketId}`)
  return updatedTicket
}

