import { StatusAssetUseItem } from '@prisma/client';

export const statusAssetUseItems: StatusAssetUseItem[] = [
    {
        statusAssetUseItemCode: "tobechecked",
        geolCode: "No-GeolCode-specified",
        name: "to be checked",
        nameDe: "Zu prüfen",
        nameFr: "À vérifier",
        nameRm: "",
        nameIt: "Da testare",
        nameEn: "To be checked",
        description: "Terms of use of the asset need to be checked",
        descriptionDe: "Nutzungsbedingungen des Assets müssen geprüft werden",
        descriptionFr: "Les conditions d'utilisation de l'asset doivent être vérifiées",
        descriptionRm: "",
        descriptionIt: "Le condizioni di utilizzo dell'elemento devono essere valutate.",
        descriptionEn: "Terms of use of the asset need to be checked"
    },
    {
        statusAssetUseItemCode: "underclarification",
        geolCode: "No-GeolCode-specified",
        name: "under clarification",
        nameDe: "In Prüfung",
        nameFr: "En cours de vérification",
        nameRm: "",
        nameIt: "In esame",
        nameEn: "Currently being checked",
        description: "Terms of use of the asset are currently being checked",
        descriptionDe: "Nutzungsbedingungen des Assets werden zurzeit geprüft",
        descriptionFr: "Les conditions d'utilisation de l'asset sont en cours de vérification",
        descriptionRm: "",
        descriptionIt: "Le condizioni di utilizzo dell'elemento sono attualmente in fase di valutazione",
        descriptionEn: "Terms of use of the asset are currently being checked"
    },
    {
        statusAssetUseItemCode: "approved",
        geolCode: "No-GeolCode-specified",
        name: "approved",
        nameDe: "Finalisiert",
        nameFr: "Finalisé",
        nameRm: "",
        nameIt: "Finalizzato",
        nameEn: "Finalised",
        description: "Terms of use of the asset are available and confirmed",
        descriptionDe: "Nutzungsbedingungen des Assets liegen vor und sind bestätigt",
        descriptionFr: "Les conditions d'utilisation de l'asset sont disponibles et confirmées",
        descriptionRm: "",
        descriptionIt: "Le condizioni di utilizzo dell'elemento sono disponibili e confermate",
        descriptionEn: "Terms of use of the asset are available and confirmed"
    }
]
