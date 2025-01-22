"use client"

import { deleteConversation, getConversations } from "@/action/chat"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent } from "@/components/ui/tabs"
import { ChevronLeft, ChevronRight, ListFilter, Loader2, Trash2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { type SetStateAction, useCallback, useEffect, useState } from "react"
import { ContentCreationDialog } from "./ModelContentCreationDialog"
import { VideoCreationDialog } from "./ModelVideoCreationDialog"
import { CVScorerDialog } from "./ModelCVScorerDialog"
import { OnboardingGuideDialog } from "./ModelOnboardingGuideDialog"
import { IgensiaDialog } from "./ModelIgensiaDialog"

interface ConversationItem {
  id: string
  title: string
  organisation: string
  platform: string
  createdAt: string
  updatedAt: string
}

const getBadgeColor = (platform: string) => {
  switch (platform.toLowerCase()) {
    case "article":
      return "bg-emerald-100 text-emerald-800"
    case "linkedin":
      return "bg-sky-100 text-sky-800"
    case "poste":
      return "bg-violet-100 text-violet-800"
    case "vidéo":
      return "bg-amber-100 text-amber-800"
    case "cv":
      return "bg-rose-100 text-rose-800"
    case "onboarding":
      return "bg-indigo-100 text-indigo-800"
    default:
      return "bg-slate-100 text-slate-800"
  }
}

const getModelName = (platform: string) => {
  switch (platform.toLowerCase()) {
    case "article":
      return "Rédacteur d’articles de blogs"
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

const RecentChatTable = () => {
  const [conversations, setConversations] = useState([])
  const [loading, setLoading] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(25)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedPlatform, setSelectedPlatform] = useState("")
  const [isIgensiaDialogOpen, setIsIgensiaDialogOpen] = useState(false)
  const router = useRouter()
  const [isVideoDialogOpen, setIsVideoDialogOpen] = useState(false)
  const [isCVDialogOpen, setIsCVDialogOpen] = useState(false)
  const [isOnboardingDialogOpen, setIsOnboardingDialogOpen] = useState(false)

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

  const handleTitleClick = useCallback(
    (conversationId: string) => {
      setLoading(conversationId)
      router.push(`/chat/${conversationId}`)
    },
    [router],
  )

  const handleDeleteConversation = async (conversationId: string) => {
    try {
      await deleteConversation(conversationId)
      setConversations(conversations.filter((conv: { id: string }) => conv.id !== conversationId))
    } catch (error) {
      console.error("Failed to delete conversation:", error)
    }
  }

  const handleModelClick = (platform: string) => {
    switch (platform.toLowerCase()) {
      case "article":
      case "linkedin":
        setSelectedPlatform(platform)
        setIsDialogOpen(true)
        break
      case "vidéo":
        setIsVideoDialogOpen(true)
        break
      case "igensia":
        setIsIgensiaDialogOpen(true)
        break
      case "cv":
        setIsCVDialogOpen(true)
        break
      case "onboarding":
        setIsOnboardingDialogOpen(true)
        break
      default:
        console.warn(`Unsupported platform: ${platform}`)
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
    <>
      <Tabs defaultValue="week">
        <div className="flex items-center">
          <div className="ml-auto flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-7 gap-1 text-sm">
                  <ListFilter className="h-3.5 w-3.5" />
                  <span className="sr-only sm:not-sr-only">Filter</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Filter by</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuCheckboxItem checked>Baker Park</DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem>Baker Lab</DropdownMenuCheckboxItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        <TabsContent value="week">
          <Card>
            <CardHeader className="px-7">
              <CardTitle>Conversations récentes</CardTitle>
              <CardDescription>Votre historique de conversation.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-1/6">Titre</TableHead>
                    <TableHead className="hidden sm:table-cell w-1/6">Organisation</TableHead>
                    <TableHead className="hidden sm:table-cell w-1/6">Plateforme</TableHead>
                    <TableHead className="w-1/6">Modèle</TableHead>
                    <TableHead className="hidden md:table-cell w-1/6">Créé le</TableHead>                    
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
                      <TableCell className="hidden sm:table-cell">{conversation.organisation}</TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <Badge className={`text-xs ${getBadgeColor(conversation.platform)}`} variant="secondary">
                          {conversation.platform}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div
                          className="cursor-pointer hover:text-IGSButton transition-colors"
                          onClick={() => handleModelClick(conversation.platform)}
                        >
                          {getModelName(conversation.platform)}
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {new Date(conversation.createdAt).toLocaleString()}
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
                  <Select value={rowsPerPage.toString()} onValueChange={handleRowsPerPageChange}>
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
      <ContentCreationDialog open={isDialogOpen} setOpen={setIsDialogOpen} initialPlatform={selectedPlatform} />
      <VideoCreationDialog open={isVideoDialogOpen} setOpen={setIsVideoDialogOpen} initialPlatform={selectedPlatform} />
      <CVScorerDialog open={isCVDialogOpen} setOpen={setIsCVDialogOpen} initialPlatform={selectedPlatform} />
      <OnboardingGuideDialog open={isOnboardingDialogOpen} setOpen={setIsOnboardingDialogOpen} initialPlatform={selectedPlatform} />
      <IgensiaDialog open={isIgensiaDialogOpen} setOpen={setIsIgensiaDialogOpen} initialPlatform={selectedPlatform} />
    </>
  )
}

export default RecentChatTable

