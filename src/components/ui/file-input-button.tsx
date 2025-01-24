"use client"

import React, { useRef, type ChangeEvent, useState } from "react"
import { Button } from "@/components/ui/button"

interface FileInputButtonProps {
  accept: string
  onChange: (event: ChangeEvent<HTMLInputElement>) => void
  buttonText?: string
  multiple?: boolean
}

export default function FileInputButton({ accept, onChange, buttonText = "Choose File", multiple = false }: FileInputButtonProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [fileNames, setFileNames] = useState<string[]>([])

  const handleButtonClick = () => {
    fileInputRef.current?.click()
  }

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (files) {
      const names = Array.from(files).map(file => file.name)
      setFileNames(names)
    } else {
      setFileNames([])
    }
    onChange(event)
  }

  return (
    <div className="flex items-center gap-2">
      <input 
        type="file" 
        accept={accept} 
        onChange={handleChange} 
        style={{ display: "none" }} 
        ref={fileInputRef}
        multiple={multiple}
      />
      <Button onClick={handleButtonClick} variant="outline" className="min-w-[120px]">
        {buttonText}
      </Button>
      <span className="text-sm text-muted-foreground">
        {fileNames.length > 0 ? fileNames.join(", ") : "Aucun fichier importé"}
      </span>
    </div>
  )
}
