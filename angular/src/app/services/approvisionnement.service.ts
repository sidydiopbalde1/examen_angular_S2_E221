import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { 
  Approvisionnement, 
  Article, 
  Fournisseur, 
  ArticleAjoute 
} from '../models/approvisionnement.model';
import { 
  ApprovisionnementListe, 
  Statistiques, 
  FiltresApprovisionnement 
} from '../models/gestion-approvisionnement.model';
import { 
  defaultApprovisionnements, 
  defaultFournisseurs, 
  defaultArticles 
} from '../data/approvisionnement.data';

@Injectable({
  providedIn: 'root'
})
export class ApprovisionnementService {
  private readonly STORAGE_KEY = 'approvisionnements';
  private readonly FOURNISSEURS_KEY = 'fournisseurs';
  private readonly ARTICLES_KEY = 'articles';

  private approvisionnementsSubject = new BehaviorSubject<ApprovisionnementListe[]>([]);
  public approvisionnements$ = this.approvisionnementsSubject.asObservable();

  constructor() {
    this.loadFromStorage();
    this.initializeDefaultData();
  }

  private loadFromStorage(): void {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (stored) {
      const data = JSON.parse(stored).map((item: any) => ({
        ...item,
        date: new Date(item.date)
      }));
      this.approvisionnementsSubject.next(data);
    }
  }

  private saveToStorage(approvisionnements: ApprovisionnementListe[]): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(approvisionnements));
  }

  private initializeDefaultData(): void {
    const currentData = this.approvisionnementsSubject.value;
    
    if (currentData.length === 0) {
      this.approvisionnementsSubject.next(defaultApprovisionnements);
      this.saveToStorage(defaultApprovisionnements);
    }

    this.initializeFournisseurs();
    this.initializeArticles();
  }

  private initializeFournisseurs(): void {
    const stored = localStorage.getItem(this.FOURNISSEURS_KEY);
    if (!stored) {
      localStorage.setItem(this.FOURNISSEURS_KEY, JSON.stringify(defaultFournisseurs));
    }
  }

  private initializeArticles(): void {
    const stored = localStorage.getItem(this.ARTICLES_KEY);
    if (!stored) {
      localStorage.setItem(this.ARTICLES_KEY, JSON.stringify(defaultArticles));
    }
  }

  getFournisseurs(): Fournisseur[] {
    const stored = localStorage.getItem(this.FOURNISSEURS_KEY);
    return stored ? JSON.parse(stored) : [];
  }

  getArticles(): Article[] {
    const stored = localStorage.getItem(this.ARTICLES_KEY);
    return stored ? JSON.parse(stored) : [];
  }

  getApprovisionnements(): Observable<ApprovisionnementListe[]> {
    return this.approvisionnements$;
  }

  ajouterApprovisionnement(approvisionnement: Approvisionnement): void {
    const currentData = this.approvisionnementsSubject.value;
    
    const nouvelApprovisionnement: ApprovisionnementListe = {
      id: this.generateId(),
      reference: approvisionnement.referenceApprovisionnement || this.generateReference(),
      date: new Date(approvisionnement.dateApprovisionnement),
      fournisseur: approvisionnement.fournisseur?.nom || '',
      articles: approvisionnement.articles.map(a => a.article.nom),
      montantTotal: approvisionnement.montantTotal,
      statut: 'En attente'
    };

    const updatedData = [nouvelApprovisionnement, ...currentData];
    this.approvisionnementsSubject.next(updatedData);
    this.saveToStorage(updatedData);
  }

  supprimerApprovisionnement(id: string): void {
    const currentData = this.approvisionnementsSubject.value;
    const updatedData = currentData.filter(a => a.id !== id);
    this.approvisionnementsSubject.next(updatedData);
    this.saveToStorage(updatedData);
  }

  filtrerApprovisionnements(filtres: FiltresApprovisionnement): ApprovisionnementListe[] {
    const data = this.approvisionnementsSubject.value;
    
    return data.filter(appro => {
      let match = true;

      if (filtres.recherche) {
        const searchTerm = filtres.recherche.toLowerCase();
        match = match && (
          appro.reference.toLowerCase().includes(searchTerm) ||
          appro.fournisseur.toLowerCase().includes(searchTerm) ||
          appro.articles.some(article => article.toLowerCase().includes(searchTerm))
        );
      }

      if (filtres.fournisseur) {
        const fournisseurNom = this.getFournisseurNomById(filtres.fournisseur);
        match = match && appro.fournisseur === fournisseurNom;
      }

      if (filtres.dateDebut) {
        const dateDebut = new Date(filtres.dateDebut);
        match = match && appro.date >= dateDebut;
      }

      if (filtres.dateFin) {
        const dateFin = new Date(filtres.dateFin);
        match = match && appro.date <= dateFin;
      }

      return match;
    });
  }

  calculerStatistiques(approvisionnements: ApprovisionnementListe[]): Statistiques {
    const total = approvisionnements.reduce((sum, appro) => sum + appro.montantTotal, 0);

    const fournisseurStats = new Map<string, number>();
    approvisionnements.forEach(appro => {
      const current = fournisseurStats.get(appro.fournisseur) || 0;
      fournisseurStats.set(appro.fournisseur, current + appro.montantTotal);
    });

    let fournisseurPrincipal = '';
    let montantMax = 0;

    fournisseurStats.forEach((montant, fournisseur) => {
      if (montant > montantMax) {
        montantMax = montant;
        fournisseurPrincipal = fournisseur;
      }
    });

    const pourcentage = total > 0 ? (montantMax / total * 100) : 0;

    return {
      totalMontant: total,
      nombreTotal: approvisionnements.length,
      fournisseurPrincipal: fournisseurPrincipal || 'Aucun',
      montantFournisseurPrincipal: montantMax,
      pourcentageFournisseurPrincipal: Math.round(pourcentage),
      periode: this.getPeriodeActuelle()
    };
  }

  private getFournisseurNomById(id: string): string {
    const fournisseurs = this.getFournisseurs();
    const fournisseur = fournisseurs.find(f => f.id === id);
    return fournisseur ? fournisseur.nom : '';
  }

  private generateId(): string {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
  }

  private generateReference(): string {
    const currentData = this.approvisionnementsSubject.value;
    const year = new Date().getFullYear();
    const nextNumber = currentData.length + 1;
    return `APP-${year}-${nextNumber.toString().padStart(3, '0')}`;
  }

  private getPeriodeActuelle(): string {
    const now = new Date();
    const mois = [
      'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ];
    return `${mois[now.getMonth()]} ${now.getFullYear()}`;
  }
}