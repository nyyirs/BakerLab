import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, Image, Languages } from "lucide-react"

interface FeatureCardProps {
  icon: React.ElementType
  title: string
  model: string
  disabled: boolean
  description?: string
  onClick: () => void
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon: Icon, title, model, disabled, description, onClick }) => (
  <Card
    className={`transition-all duration-300 ease-in-out ${disabled ? "opacity-50 cursor-not-allowed" : "hover:border-BakerLabButton hover:cursor-pointer"}`}
    onClick={disabled ? undefined : onClick}
  >
    <CardHeader>
      <CardTitle className="flex items-center space-x-2">
        <Icon className={`w-6 h-6 ${disabled ? "text-gray-400" : "text-BakerLabButton"}`} />
        <span>{title}</span>
      </CardTitle>
    </CardHeader>
    <CardContent>
      <p className="text-sm text-muted-foreground">{model}</p>
      <h3 className="mt-2 font-semibold text-xl">{title}</h3>
      <p className="mt-2 text-sm">
        {disabled
          ? "Cette fonctionnalité est actuellement indisponible."
          : description ||
            "Vous avez besoin de générer du texte pour vos emails, vos réseaux sociaux dans la tonalité de votre marque."}
      </p>
    </CardContent>
  </Card>
)

interface FeatureCardsProps {
  onCardClick: (index: number) => void
}

export const FeatureCards: React.FC<FeatureCardsProps> = ({ onCardClick }) => {
  const features = [
    {
      icon: FileText,
      title: "Rédiger un article de blog",
      model: "Modèle simple",
      disabled: false,
      description: "Obtenez un article structuré et pertinent adapté à votre audience.",
    },
    {
      icon: Image,
      title: "Créer un post LinkedIn",
      model: "Modèle simple",
      disabled: false,
      description: "Générez un post engageant et professionnel prêt à publier.",
    },
    { icon: Languages,
      title: "Formaliseur de fiches de poste",
      model: "Modèle avancé",
      disabled: false,
      description: "Formalisez vos fiches de poste en quelques secondes.",
    },
    { icon: Languages,
      title: "Créateur de vidéos avatarisées",
      model: "Modèle avancé",
      disabled: false,
      description: "Créez des vidéos avatarisées en quelques secondes.",      
    },    
    { icon: Languages,
      title: "Scoreur de CVs",
      model: "Modèle avancé",
      disabled: false,
      description: "Scorez vos CVs en quelques secondes.",      
    },  
    { icon: Languages,
      title: "Guide onboarding interactif",
      model: "Modèle avancé",
      disabled: false,
      description: "Créez un guide onboarding interactif en quelques secondes.",      
    },  
  ]

  return (
    <>
      {features.map((feature, index) => (
        <FeatureCard key={index} {...feature} onClick={() => onCardClick(index)} />
      ))}
    </>
  )
}

