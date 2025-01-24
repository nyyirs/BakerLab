'use client'

import { deleteUser, getUsers } from "@/action/user"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
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
  Trash2,
} from "lucide-react"
import { SetStateAction, useEffect, useState } from "react"

interface UserItem {
  id: string;
  email: string;
  role: string;
  isAdmin: boolean;
}

const UserTable = () => {
  const [users, setUsers] = useState([])
  const [currentPage, setCurrentPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(25)
  const fetchUsers = async () => {
    const fetchedUsers = await getUsers()

    setUsers(fetchedUsers as SetStateAction<never[]>)
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  useEffect(() => {
  }, [users])

  const handleDeleteUser = async (userId: string) => {
    try {
      await deleteUser(userId)
      setUsers(users.filter((conv: { id: string }) => conv.id !== userId))
    } catch (error) {
      console.error("Failed to delete user:", error)
    }
  }

  const indexOfLastRow = currentPage * rowsPerPage
  const indexOfFirstRow = indexOfLastRow - rowsPerPage
  const currentRows = users.slice(indexOfFirstRow, indexOfLastRow)

  const totalPages = Math.ceil(users.length / rowsPerPage)

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber)
  }

  const handleRowsPerPageChange = (value: string) => {
    setRowsPerPage(Number(value))
    setCurrentPage(1)
  }

  return (
    <Tabs defaultValue="week">
      <TabsContent value="week">
        <Card>
          <CardHeader className="px-7">
            <CardTitle>Utilisateurs</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-1/6">Email</TableHead>
                  <TableHead className="hidden sm:table-cell w-1/6">Rôle</TableHead>
                  <TableHead className="w-1/6"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentRows.map((user: UserItem) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="font-medium cursor-pointer hover:text-IGSButton transition-colors flex items-center">
                        {user.email}
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      {user.role === "ADMIN" ? "Administrateur" : user.role === "USER" ? "Utilisateur" : user.role}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteUser(user.id)}
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
                <span className="text-sm text-gray-700">Lignes par page :</span>
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

export default UserTable
