'use client'

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Plus } from 'lucide-react'
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Priority, User, Ticket } from "@prisma/client"
import { createTicket } from "@/action/ticket"

interface CreateTicketDialogProps {
  onTicketCreated: (ticket: Ticket) => void
}

export function CreateTicketDialog({ onTicketCreated }: CreateTicketDialogProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    defaultValues: {
      subject: "",
      description: "",
      priority: Priority.NORMAL,
      file: undefined,
    },
  })

  const formSchema = z.object({
    subject: z.string().min(1, "Le sujet est requis"),
    description: z.string().min(1, "La description est requise"),
    priority: z.nativeEnum(Priority),
    file: z.any().optional(),
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    const formData = new FormData()
    Object.entries(values).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (key === "file" && value instanceof File) {
          formData.append(key, value, value.name)
        } else {
          formData.append(key, value as string)
        }
      }
    })

    // Add the default assignedToId
    formData.append("assignedToId", "cm53u4cs200007ihwfzi9yftr")

    try {
      const newTicket = await createTicket(formData)
      onTicketCreated(newTicket)
      setOpen(false)
      form.reset()
    } catch (error) {
      console.error("Failed to create ticket:", error)
      // Handle error (e.g., show error message to user)
    }
  }

  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-BakerLabButton">
          <Plus className="w-4 h-4 mr-2" />
          Créer un nouveau ticket
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Créer un nouveau ticket</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="subject"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sujet</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="priority"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Priorité</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner une priorité" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={Priority.LOW}>Faible</SelectItem>
                      <SelectItem value={Priority.NORMAL}>Normal</SelectItem>
                      <SelectItem value={Priority.URGENT}>Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />            
            <FormField
              control={form.control}
              name="file"
              render={({ field: { onChange, value, ...field } }) => (
                <FormItem>
                  <FormLabel>Document (PDF, PPT, Word)</FormLabel>
                  <FormControl>
                    <Input
                      type="file"
                      accept=".pdf,.ppt,.pptx,.doc,.docx"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        onChange(file)
                      }}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full bg-BakerLabButton">
              Créer
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

