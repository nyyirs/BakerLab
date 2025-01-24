"use client"

import React, { useRef, type ChangeEvent, useState } from "react"
import { Button } from "@/components/ui/button"

interface FileInputButtonProps {
  accept: string
  onChange: (event: ChangeEvent<HTMLInputElement>) => void
  buttonText?: string
}

export default function FileInputButton({ accept, onChange, buttonText = "Choose File" }: FileInputButtonProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [fileName, setFileName] = useState<string>("Aucun fichier importé")

  const handleButtonClick = () => {
    fileInputRef.current?.click()
  }

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    setFileName(file ? file.name : "Aucun fichier importé")
    onChange(event)
  }

  return (
    <div className="flex items-center gap-2">
      <input type="file" accept={accept} onChange={handleChange} style={{ display: "none" }} ref={fileInputRef} />
      <Button onClick={handleButtonClick} variant="outline" className="min-w-[120px]">
        {buttonText}
      </Button>
      <span className="text-sm text-muted-foreground">{fileName}</span>
    </div>
  )
}

