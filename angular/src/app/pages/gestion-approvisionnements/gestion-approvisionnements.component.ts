import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';

import { ApprovisionnementService } from '../../services/approvisionnement.service';
import { 
  ApprovisionnementListe, 
  Statistiques, 
  FiltresApprovisionnement 
} from '../../models/gestion-approvisionnement.model';
import { Fournisseur, Article } from '../../models/approvisionnement.model';

@Component({
  selector: 'app-gestion-approvisionnements',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './gestion-approvisionnements.component.html',
  styleUrl: './gestion-approvisionnements.component.css'
})
export class GestionApprovisionnementsComponent implements OnInit, OnDestroy {
  filterForm!: FormGroup;
  
  approvisionnements: ApprovisionnementListe[] = [];
  approvisionnementsFiltres: ApprovisionnementListe[] = [];
  
  fournisseurs: Fournisseur[] = [];
  articles: Article[] = [];
  
  statistiques: Statistiques = {
    totalMontant: 0,
    nombreTotal: 0,
    fournisseurPrincipal: '',
    montantFournisseurPrincipal: 0,
    pourcentageFournisseurPrincipal: 0,
    periode: ''
  };

  currentPage: number = 1;
  itemsPerPage: number = 10;
  totalPages: number = 1;
  pages: number[] = [];

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private approvisionnementService: ApprovisionnementService
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadData();
    this.setupFormListeners();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initForm(): void {
    this.filterForm = this.fb.group({
      recherche: [''],
      fournisseur: [''],
      article: [''],
      dateDebut: [''],
      dateFin: ['']
    });
  }

  private setupFormListeners(): void {
    this.filterForm.get('recherche')?.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.appliquerFiltres();
      });

    this.filterForm.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.appliquerFiltres();
      });
  }

  private loadData(): void {
    this.fournisseurs = this.approvisionnementService.getFournisseurs();
    this.articles = this.approvisionnementService.getArticles();

    this.approvisionnementService.getApprovisionnements()
      .pipe(takeUntil(this.destroy$))
      .subscribe(data => {
        this.approvisionnements = data;
        this.appliquerFiltres();
      });
  }

  appliquerFiltres(): void {
    const filtres: FiltresApprovisionnement = this.filterForm.value;
    
    this.approvisionnementsFiltres = this.approvisionnementService.filtrerApprovisionnements(filtres);
    
    this.currentPage = 1;
    this.calculerPagination();
    this.calculerStatistiques();
  }

  reinitialiserFiltres(): void {
    this.filterForm.reset();
    this.appliquerFiltres();
  }

  private calculerPagination(): void {
    this.totalPages = Math.ceil(this.approvisionnementsFiltres.length / this.itemsPerPage);
    this.pages = Array.from({ length: this.totalPages }, (_, i) => i + 1);
    this.paginerResultats();
  }

  private paginerResultats(): void {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    
    const allFiltered = this.approvisionnementService.filtrerApprovisionnements(this.filterForm.value);
    this.approvisionnementsFiltres = allFiltered.slice(startIndex, endIndex);
  }

  changerPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.paginerResultats();
    }
  }

  private calculerStatistiques(): void {
    const tousLesFiltres = this.approvisionnementService.filtrerApprovisionnements(this.filterForm.value);
    this.statistiques = this.approvisionnementService.calculerStatistiques(tousLesFiltres);
  }

  nouveauApprovisionnement(): void {
    this.router.navigate(['/add-approvisionnement']);
  }

  voirDetails(id: string): void {
    console.log('Voir détails:', id);
  }

  modifier(id: string): void {
    console.log('Modifier:', id);
  }

  supprimer(id: string): void {
    if (confirm('Êtes-vous sûr de vouloir supprimer cet approvisionnement ?')) {
      this.approvisionnementService.supprimerApprovisionnement(id);
    }
  }
}