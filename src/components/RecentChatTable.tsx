'use client'

import { deleteConversation, getConversations } from "@/action/chat"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Tabs,
  TabsContent,
} from "@/components/ui/tabs"
import {
  ChevronLeft,
  ChevronRight,
  ListFilter,
  Loader2,
  Trash2,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { SetStateAction, useCallback, useEffect, useState } from "react"

interface ConversationItem {
  id: string;
  title: string;
  organisation: string;
  platform: string;
  createdAt: string;
  updatedAt: string;
}

const getBadgeColor = (platform: string) => {
  switch (platform.toLowerCase()) {
    case 'api':
      return 'bg-blue-100 text-blue-800'
    case 'linkedin':
      return 'bg-sky-100 text-sky-800'
    case 'facebook':
      return 'bg-indigo-100 text-indigo-800'
    case 'site web':
      return 'bg-green-100 text-green-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

const RecentChatTable = () => {
  const [conversations, setConversations] = useState([])
  const [loading, setLoading] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(25)
  const router = useRouter()

  useEffect(() => {
    const fetchConversations = async () => {
      const fetchedConversations = await getConversations()
      setConversations(fetchedConversations as SetStateAction<never[]>)
    }
    fetchConversations()
  }, [])

  useEffect(() => {
    setLoading(null)
  }, [conversations])

  const handleTitleClick = useCallback((conversationId: string) => {
    setLoading(conversationId)
    router.push(`/chat/${conversationId}`)
  }, [router])

  const handleDeleteConversation = async (conversationId: string) => {
    try {
      await deleteConversation(conversationId)
      setConversations(conversations.filter((conv: { id: string }) => conv.id !== conversationId))
    } catch (error) {
      console.error("Failed to delete conversation:", error)
    }
  }

  const indexOfLastRow = currentPage * rowsPerPage
  const indexOfFirstRow = indexOfLastRow - rowsPerPage
  const currentRows = conversations.slice(indexOfFirstRow, indexOfLastRow)

  const totalPages = Math.ceil(conversations.length / rowsPerPage)

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber)
  }

  const handleRowsPerPageChange = (value: string) => {
    setRowsPerPage(Number(value))
    setCurrentPage(1)
  }

  return (
    <Tabs defaultValue="week">
      <div className="flex items-center">
        <div className="ml-auto flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-7 gap-1 text-sm"
              >
                <ListFilter className="h-3.5 w-3.5" />
                <span className="sr-only sm:not-sr-only">Filter</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Filter by</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem checked>
                Baker Park
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem>
                Baker Lab
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <TabsContent value="week">
        <Card>
          <CardHeader className="px-7">
            <CardTitle>Conversations récentes</CardTitle>
            <CardDescription>
              Votre historique de conversation.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-1/6">Titre</TableHead>
                  <TableHead className="hidden sm:table-cell w-1/6">
                    Organisation
                  </TableHead>
                  <TableHead className="hidden sm:table-cell w-1/6">
                    Plateforme
                  </TableHead>
                  <TableHead className="hidden md:table-cell w-1/6">
                    Créé le
                  </TableHead>
                  <TableHead className="w-1/6">Mis à jour le</TableHead>
                  <TableHead className="w-1/6"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentRows.map((conversation: ConversationItem) => (
                  <TableRow key={conversation.id}>
                    <TableCell>
                      <div
                        className="font-medium cursor-pointer hover:text-IGSButton transition-colors flex items-center"
                        onClick={() => handleTitleClick(conversation.id)}
                      >
                        {loading === conversation.id ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            <span>Loading...</span>
                          </>
                        ) : (
                          conversation.title
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      {conversation.organisation}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <Badge
                        className={`text-xs ${getBadgeColor(conversation.platform)}`}
                        variant="secondary"
                      >
                        {conversation.platform}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {new Date(conversation.createdAt).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      {new Date(conversation.updatedAt).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteConversation(conversation.id)}
                        className="h-8 w-8 p-0 ml-auto"
                      >
                        <Trash2 className="h-4 w-4 hover:text-IGSButton" />
                        <span className="sr-only">Supprimer</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="flex items-center justify-between mt-4">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-700">Lignes par page:</span>
                <Select
                  value={rowsPerPage.toString()}
                  onValueChange={handleRowsPerPageChange}
                >
                  <SelectTrigger className="w-[70px]">
                    <SelectValue placeholder="25" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm text-gray-700">
                  Page {currentPage} sur {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
}

export default RecentChatTable
