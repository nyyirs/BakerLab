"use client"

import { useState } from "react"
import { ContentCreationDialog } from "./ModelContentCreationDialog"
import { FeatureCards } from "./ModelFeatureCards"

const ModelCardSection = () => {
  const [open, setOpen] = useState(false)
  const [platform, setDropdownPlatform] = useState("")

  const handleCardClick = (index: number) => {
    setOpen(true)
    switch (index) {
      case 0: // "Rédiger un article de blog"
        setDropdownPlatform("Article")
        break
      case 1: // "Créer un post LinkedIn"
        setDropdownPlatform("LinkedIn")
        break
      case 2: // "Traduction par IA"
        setDropdownPlatform("Image")
        break
    }
  }

  return (
    <>
      <ContentCreationDialog open={open} setOpen={setOpen} initialPlatform={platform} />
      <FeatureCards onCardClick={handleCardClick} />
    </>
  )
}

export default ModelCardSection

