import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, Image, Languages } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface FeatureCardProps {
  icon: React.ElementType
  title: string
  disabled: boolean
  tags?: string[]
  description?: string
  onClick: () => void
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon: Icon, title, disabled, description, tags = [], onClick }) => (
    <Card
          className={`relative overflow-hidden transition-all duration-300 ease-in-out h-48 ${
            disabled ? "opacity-50 cursor-not-allowed" : "hover:border-primary hover:cursor-pointer"
          }`}
          onClick={disabled ? undefined : onClick}
        >
          {/* Background Texture */}
          <div className="absolute inset-0 bg-[#005B7F]">
            <img src="/CardTexture.jpeg" alt="" className="absolute inset-0 w-full h-full object-cover opacity-20 mix-blend-multiply" />
          </div>

          {/* Content */}
          <div className="relative z-10 text-white pt-8">
            <CardContent className="flex gap-4 items-center">
              <Icon />
              <div className="flex-1">
                <span className="text-2xl font-bold block">{title}</span>
                <p className="text-lg font-medium leading-relaxed">
                  {disabled ? "Cette fonctionnalité est actuellement indisponible." : description}
                </p>
                {tags && tags.length > 0 && (
                  <div className="absolute mt-2">
                    {tags.map((tag) => (
                      <Badge key={tag} variant="outline" className="border-white/30 text-white hover:bg-white/10">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </div>
    </Card>
)

interface FeatureCardsProps {
  onCardClick: (index: number) => void
}

export const FeatureCards: React.FC<FeatureCardsProps> = ({ onCardClick }) => {
  const features = [
    {
      icon: () => <img src="/icons/Generation article de blog.png" alt="Blog article icon" className="w-10 h-10" />,
      title: "Rédacteur d'articles de blog",
      disabled: false,
      tags: ["Article"],
      description: "Obtenez un article structuré et pertinent adapté à votre audience.",
    },
    {
      icon: () => <img src="/icons/Generateur d_articles Lk.png" alt="LinkedIn post icon" className="w-10 h-10" />,
      title: "Créer un post LinkedIn",
      disabled: false,
      tags: ["LinkedIn"],
      description: "Générez un post engageant et professionnel prêt à publier.",
    },
    { icon: () => <img src="/icons/Fiches de poste.png" alt="Fiche de poste icon" className="w-10 h-10" />,
      title: "Formaliseur de fiches de poste",
      disabled: false,
      tags: ["Igensia"],
      description: "Formalisez vos fiches de poste en quelques secondes.",
    },
    { icon: () => <img src="/icons/Generation d_image.png" alt="Vidéo avatarisée icon" className="w-10 h-10" />,
      title: "Créateur de vidéos avatarisées",
      disabled: false,
      tags: ["Vidéo"],
      description: "Créez des vidéos avatarisées en quelques secondes.",      
    },    
    { icon: () => <img src="/icons/Scoring de CV.png" alt="CV scorer icon" className="w-10 h-10" />,
      title: "Scoreur de CVs",
      disabled: false,
      tags: ["CV"],
      description: "Scorez vos CVs en quelques secondes.",      
    },  
    { icon: () => <img src="/icons/Chatbot interne.png" alt="Guide onboarding interactif icon" className="w-10 h-10" />,
      title: "Guide onboarding interactif",
      disabled: false,
      tags: ["Onboarding"],
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

