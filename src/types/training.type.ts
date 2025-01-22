export interface TrainingType {
    nom: string;
    ville: string[];
}

export interface JobDescriptionType {
    nom: string,
    formation: TrainingType[],
}

export interface BrandType {
    marque: string;
    categories: JobDescriptionType[];
}