export interface Article {
  id: string;
  nom: string;
}

export interface Fournisseur {
  id: string;
  nom: string;
}

export interface ArticleAjoute {
  article: Article;
  quantite: number;
  prixUnitaire: number;
  montant: number;
}

export interface Approvisionnement {
  dateApprovisionnement: Date;
  fournisseur: Fournisseur | null;
  reference: string;
  referenceApprovisionnement: string;
  observations: string;
  articles: ArticleAjoute[];
  montantTotal: number;
}