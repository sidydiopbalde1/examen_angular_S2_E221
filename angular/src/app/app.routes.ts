import { Routes } from '@angular/router';
import { GestionApprovisionnementsComponent } from './pages/gestion-approvisionnements/gestion-approvisionnements.component';
import { AddApprovisionnementComponent } from './components/add-approvisionnement/add-approvisionnement.component';

export const routes: Routes = [
  { path: '', redirectTo: '/gestion-approvisionnements', pathMatch: 'full' },
  { path: 'gestion-approvisionnements', component: GestionApprovisionnementsComponent },
  { path: 'add-approvisionnement', component: AddApprovisionnementComponent }
];
