"use client"

import { useState } from "react"
import { ContentCreationDialog } from "./ModelContentCreationDialog"
import { VideoCreationDialog } from "./ModelVideoCreationDialog"
import { CVScorerDialog } from "./ModelCVScorerDialog"
import { OnboardingGuideDialog } from "./ModelOnboardingGuideDialog"
import { FeatureCards } from "./ModelFeatureCards"

const ModelCardSection = () => {
  const [openContentDialog, setOpenContentDialog] = useState(false)
  const [openVideoDialog, setOpenVideoDialog] = useState(false)
  const [openCVDialog, setOpenCVDialog] = useState(false)
  const [openOnboardingDialog, setOpenOnboardingDialog] = useState(false)
  const [platform, setPlatform] = useState("")

  const handleCardClick = (index: number) => {
    switch (index) {
      case 0: // "Rédiger un article de blog"
        setPlatform("Article")
        setOpenContentDialog(true)
        break
      case 1: // "Créer un post LinkedIn"
        setPlatform("LinkedIn")
        setOpenContentDialog(true)
        break
      case 2: // "Formaliseur de fiches de poste"
        setPlatform("Poste")
        setOpenContentDialog(true)
        break
      case 3: // "Créer une vidéo avatarisée"
        setPlatform("Vidéo")
        setOpenVideoDialog(true)
        break
      case 4: // "Scoreur de CVs"
        setPlatform("CV")
        setOpenCVDialog(true)
        break
      case 5: // "Guide onboarding interactif"
        setPlatform("Onboarding")
        setOpenOnboardingDialog(true)
        break
    }
  }

  return (
    <>
      <ContentCreationDialog open={openContentDialog} setOpen={setOpenContentDialog} initialPlatform={platform} />
      <VideoCreationDialog open={openVideoDialog} setOpen={setOpenVideoDialog} initialPlatform={platform} />
      <CVScorerDialog open={openCVDialog} setOpen={setOpenCVDialog} initialPlatform={platform} />
      <OnboardingGuideDialog open={openOnboardingDialog} setOpen={setOpenOnboardingDialog} initialPlatform={platform} />
      <FeatureCards onCardClick={handleCardClick} />
    </>
  )
}

export default ModelCardSection

