import { createConversation, generateAIResponse } from '@/action/chat';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { brandList, companySectorList, companySizeList } from "@/lib/job-description.constant";
import { JobDescriptionType, TrainingType } from "@/types/training.type";
import { Loader2 } from "lucide-react";
import { useRouter } from 'next/navigation';
import { useEffect, useState } from "react";

interface IgensiaDialogProps {
    open: boolean;
    setOpen: (isOpened: boolean) => void;
    initialPlatform: string
}

export const IgensiaDialog: React.FC<IgensiaDialogProps> = ({ open, setOpen, initialPlatform }) => {
    const [selectedBrand, setSelectedBrand] = useState<string|undefined>(undefined)
    const [selectedJobDescription, setSelectedJobDescription] = useState<string|undefined>(undefined)
    const [selectedTraining, setSelectedTraining] = useState<string|undefined>(undefined)
    const [selectedLocation, setSelectedLocation] = useState<string|undefined>(undefined)
    const [selectedCompanySize, setSelectedCompanySize] = useState<string|undefined>(undefined)
    const [selectedSector, setSelectedSector] = useState<string|undefined>(undefined)
    const [additionalContent, setAdditionalContent] = useState<string>('')

    const [jobDescriptionList, setJobDescriptionList] = useState<JobDescriptionType[]>([])
    const [trainingList, setTrainingList] = useState<TrainingType[]>([])
    const [locationList, setLocationList] = useState<string[]>([])

    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)

    const handleSubmit = async () => {
        if (isLoading) return;
        setIsLoading(true);

        try {
            const newConversation = await createConversation(
                additionalContent.trim().split(' ').slice(0, 3).join(' '),
                selectedBrand as string,
                "Igensia"
            );

            if (newConversation && newConversation.id) {
                // Generate an AI response (this will also add the user's message)
                await generateAIResponse(newConversation.id, additionalContent);

                // Close the dialog
                setOpen(false);

                // Navigate to the new chat
                router.push(`/chat-b2b/${newConversation.id}`);
            } else {
                console.error("Failed to create conversation: No ID returned");
                setIsLoading(false);
            }
        } catch (error) {
            console.error("Error creating conversation:", error);
            setIsLoading(false);
        }

        setOpen(false)
    }

    useEffect(() => {
        if (!selectedBrand) return;

        const selectedBrandInfo = brandList.find((brand) => brand.marque === selectedBrand)?.categories || []
        setJobDescriptionList(selectedBrandInfo)
    }, [selectedBrand])

    useEffect(() => {
        if (!selectedJobDescription) return

        const correspondingTrainingList = jobDescriptionList.find((jobDescription) => jobDescription.nom === selectedJobDescription)?.formation || []
        setTrainingList(correspondingTrainingList)
        setSelectedTraining(correspondingTrainingList[0]?.nom)
    }, [selectedJobDescription, jobDescriptionList])

    useEffect(() => {
        if (!selectedTraining) return

        const correspondingLocation = trainingList.find((training) => training.nom === selectedTraining)?.ville || []
        setLocationList(correspondingLocation)
        setSelectedLocation(correspondingLocation[0])
    }, [selectedTraining, trainingList]);

    return <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle className="text-tertiary">Je souhaite reformuler une fiche de poste</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col gap-4 py-4 overflow-hidden">
            <div className="w-full px-1">
                    <div className="text-md mb-2 text-tertiary">Cette fiche de poste est destinée à la marque</div>
                    <Select value={selectedBrand} onValueChange={(value) => setSelectedBrand(value)}>
                        <SelectTrigger>
                            <SelectValue placeholder="-"/>
                        </SelectTrigger>
                        <SelectContent>
                            {brandList.map((brand, index) => <SelectItem key={index} value={brand.marque}>{brand.marque}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                <div className="w-full px-1">
                    <div className="text-md mb-2 text-tertiary">Sélectionnez la filière de ce poste</div>
                    <Select value={selectedJobDescription} onValueChange={(value) => setSelectedJobDescription(value)}>
                        <SelectTrigger>
                            <SelectValue placeholder="-"/>
                        </SelectTrigger>
                        <SelectContent>
                            {jobDescriptionList.map((jobDescription, index) => <SelectItem key={index} value={jobDescription.nom}>{jobDescription.nom}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                <div className="w-full px-1">
                    <div className="text-md mb-2 text-tertiary">Intitulé de la formation visée par la fiche de poste</div>
                    <Select value={selectedTraining} onValueChange={(value) => setSelectedTraining(value)}>
                        <SelectTrigger>
                            <SelectValue placeholder="-"/>
                        </SelectTrigger>
                        <SelectContent>
                            {trainingList.map((formation, index) => <SelectItem key={index} value={formation.nom}>{formation.nom}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                <div className="w-full px-1">
                    <div className="text-md mb-2 text-tertiary">Taille de l&#39;entreprise</div>
                    <Select value={selectedCompanySize} onValueChange={(value) => setSelectedCompanySize(value)}>
                        <SelectTrigger>
                            <SelectValue placeholder="-"/>
                        </SelectTrigger>
                        <SelectContent>
                            {companySizeList.map((size, index) => <SelectItem key={index} value={size}>{size}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                <div className="w-full px-1">
                    <div className="text-md mb-2 text-tertiary">Ville du campus</div>
                    <Select value={selectedLocation} onValueChange={(value) => setSelectedLocation(value)}>
                        <SelectTrigger>
                            <SelectValue placeholder="-"/>
                        </SelectTrigger>
                        <SelectContent>
                            {locationList.map((location, index) => <SelectItem key={index} value={location}>{location}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                <div className="w-full px-1">
                    <div className="text-md mb-2 text-tertiary">A quel secteur d&#39;activité appartient l&#39;entreprise ?</div>
                    <Select value={selectedSector} onValueChange={(value) => setSelectedSector(value)}>
                        <SelectTrigger>
                            <SelectValue placeholder="-"/>
                        </SelectTrigger>
                        <SelectContent>
                            {companySectorList.map((sector, index) => <SelectItem key={index} value={sector}>{sector}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                <div className="w-full px-1">
                    <div className="text-md mb-2 text-tertiary">Insérez le contenu textuel que vous souhaitez reformuler</div>
                    <Textarea
                        placeholder="Champ libre"
                        className="min-h-[80px]"
                        value={additionalContent}
                        onChange={(e) => setAdditionalContent(e.target.value)}
                    />
                </div>
                <Button
                    className="bg-BakerLabButton"
                    disabled={isLoading}
                    onClick={handleSubmit}
                >
                    {isLoading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Chargement...
                        </>
                    ) : (
                        'Soumettre'
                    )}
                </Button>
            </div>
        </DialogContent>
    </Dialog>
}
