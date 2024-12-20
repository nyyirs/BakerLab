import { getTicketById } from "@/action/ticket"
import { formatDate } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import Link from "next/link"
import { ArrowLeft, Download, Clock, User, UserCheck, FileText } from 'lucide-react'
import { getSession } from "@/lib/getSession"
import { UpdateTicketStatus } from "@/components/UpdateTicketStatus"

export default async function TicketPage({ params }: { params: { id: string } }) {
  const [ticket, session] = await Promise.all([
    getTicketById(params.id),
    getSession()
  ])

  if (!session || !session.user) {
    return <div>Please log in to view ticket details.</div>
  }

  const isAdmin = session.user.role === 'ADMIN'

  const priorityColors = {
    LOW: 'bg-slate-500',
    NORMAL: 'bg-yellow-500',
    URGENT: 'bg-red-500',
  }

  const statusColors = {
    OPEN: 'bg-green-500',
    IN_PROGRESS: 'bg-blue-500',
    CLOSED: 'bg-gray-500',
  }

  return (
    <div className="container py-10">
      <Link href="/ticket" className="flex items-center mb-6 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Retour à la liste des tickets
      </Link>
      
      <Card>
        <CardHeader className="space-y-1">
          <div className="flex justify-between items-start">
            <CardTitle className="text-2xl">{ticket.subject}</CardTitle>
            <Badge className={priorityColors[ticket.priority]}>
              {ticket.priority.toLowerCase()}
            </Badge>
          </div>
          <CardDescription>Ticket #{ticket.id.slice(0, 8)}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <div className="flex items-center">
                <Clock className="w-4 h-4 mr-2" />
                <span className="text-muted-foreground">Créé le</span>
              </div>
              <p>{formatDate(ticket.createdAt)}</p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center">
                <Clock className="w-4 h-4 mr-2" />
                <span className="text-muted-foreground">Mis à jour le</span>
              </div>
              <p>{formatDate(ticket.updatedAt)}</p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center">
                <User className="w-4 h-4 mr-2" />
                <span className="text-muted-foreground">Demandé par</span>
              </div>
              <p>{ticket.requestedBy.email}</p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center">
                <UserCheck className="w-4 h-4 mr-2" />
                <span className="text-muted-foreground">Assigné à</span>
              </div>
              <p>{ticket.assignedTo?.email || 'Non assigné'}</p>
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-2">Description</h3>
            <p className="whitespace-pre-wrap">{ticket.description}</p>
          </div>
          
          {ticket.fileUrl && (
            <div>
              <h3 className="text-lg font-semibold mb-2">Fichier joint</h3>
              <Button asChild variant="outline">
                <Link href={ticket.fileUrl} download>
                  <Download className="w-4 h-4 mr-2" />
                  Télécharger le fichier
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
        <Separator className="my-4" />
        <CardFooter className="flex justify-between">
          <div className="flex items-center">
            <FileText className="w-4 h-4 mr-2" />
            <span className="font-semibold mr-2">Statut:</span>
            <Badge className={statusColors[ticket.status]}>
              {ticket.status.toLowerCase().replace('_', ' ')}
            </Badge>
          </div>
          {isAdmin && <UpdateTicketStatus ticketId={ticket.id} currentStatus={ticket.status} />}
        </CardFooter>
      </Card>
    </div>
  )
}

