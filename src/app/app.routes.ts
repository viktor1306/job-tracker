import { Routes } from '@angular/router';

export const routes: Routes = [
  { 
    path: '', // Головний шлях
    loadComponent: () => import('./pages/home/home.component').then(m => m.HomeComponent) 
  },
  { 
    path: 'import', 
    loadComponent: () => import('./pages/import/import.component').then(m => m.ImportComponent) 
  },
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.component').then(m => m.LoginComponent)
  }
];