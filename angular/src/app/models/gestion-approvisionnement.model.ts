export interface ApprovisionnementListe {
  id: string;
  reference: string;
  date: Date;
  fournisseur: string;
  articles: string[];
  montantTotal: number;
  statut: 'Reçu' | 'En attente';
}

export interface Statistiques {
  totalMontant: number;
  nombreTotal: number;
  fournisseurPrincipal: string;
  montantFournisseurPrincipal: number;
  pourcentageFournisseurPrincipal: number;
  periode: string;
}

export interface FiltresApprovisionnement {
  recherche: string;
  fournisseur: string;
  article: string;
  dateDebut: string;
  dateFin: string;
}