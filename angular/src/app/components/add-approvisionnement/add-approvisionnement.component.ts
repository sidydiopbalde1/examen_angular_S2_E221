import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { 
  Article, 
  Fournisseur, 
  ArticleAjoute, 
  Approvisionnement 
} from '../../models/approvisionnement.model';
import { ApprovisionnementService } from '../../services/approvisionnement.service';

@Component({
  selector: 'app-add-approvisionnement',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './add-approvisionnement.component.html',
  styleUrl: './add-approvisionnement.component.css'
})
export class AddApprovisionnementComponent implements OnInit, OnDestroy {
  approvisionnementForm!: FormGroup;
  articleForm!: FormGroup;
  
  fournisseurs: Fournisseur[] = [];
  articles: Article[] = [];
  articlesAjoutes: ArticleAjoute[] = [];
  montantTotal: number = 0;
  
  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private approvisionnementService: ApprovisionnementService
  ) {}

  ngOnInit(): void {
    this.initForms();
    this.loadData();
    this.setupFormListeners();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initForms(): void {
    this.approvisionnementForm = this.fb.group({
      dateApprovisionnement: [new Date().toISOString().split('T')[0], Validators.required],
      fournisseur: [null, Validators.required],
      reference: [''],
      referenceApprovisionnement: [''],
      observations: ['']
    });

    this.articleForm = this.fb.group({
      article: [null, Validators.required],
      quantite: [null, [Validators.required, Validators.min(1)]],
      prixUnitaire: [null, [Validators.required, Validators.min(0)]]
    });
  }

  private setupFormListeners(): void {
    this.articleForm.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.calculerMontantArticle();
      });
  }

  private calculerMontantArticle(): void {
    const formValue = this.articleForm.value;
    if (formValue.quantite && formValue.prixUnitaire) {
      this.montantTotal = formValue.quantite * formValue.prixUnitaire;
    }
  }

  private loadData(): void {
    this.fournisseurs = this.approvisionnementService.getFournisseurs();
    this.articles = this.approvisionnementService.getArticles();
  }

  ajouterArticle(): void {
    if (this.articleForm.invalid) {
      this.articleForm.markAllAsTouched();
      return;
    }

    const formValue = this.articleForm.value;
    const montant = formValue.quantite * formValue.prixUnitaire;

    const articleAjoute: ArticleAjoute = {
      article: formValue.article,
      quantite: formValue.quantite,
      prixUnitaire: formValue.prixUnitaire,
      montant
    };

    this.articlesAjoutes.push(articleAjoute);
    this.calculerMontantTotal();
    this.articleForm.reset();
  }

  supprimerArticle(index: number): void {
    this.articlesAjoutes.splice(index, 1);
    this.calculerMontantTotal();
  }

  private calculerMontantTotal(): void {
    this.montantTotal = this.articlesAjoutes.reduce(
      (total, article) => total + article.montant, 
      0
    );
  }

  enregistrer(): void {
    if (this.approvisionnementForm.invalid || this.articlesAjoutes.length === 0) {
      this.approvisionnementForm.markAllAsTouched();
      alert('Veuillez remplir tous les champs obligatoires et ajouter au moins un article.');
      return;
    }

    const approvisionnement: Approvisionnement = {
      ...this.approvisionnementForm.value,
      articles: this.articlesAjoutes,
      montantTotal: this.montantTotal
    };

    this.approvisionnementService.ajouterApprovisionnement(approvisionnement);
    alert('Approvisionnement enregistré avec succès !');
    this.router.navigate(['/gestion-approvisionnements']);
  }

  annuler(): void {
    this.resetForms();
  }

  private resetForms(): void {
    this.approvisionnementForm.reset();
    this.articleForm.reset();
    this.articlesAjoutes = [];
    this.montantTotal = 0;
    this.approvisionnementForm.patchValue({
      dateApprovisionnement: new Date().toISOString().split('T')[0]
    });
  }

  retourListe(): void {
    this.router.navigate(['/gestion-approvisionnements']);
  }
}