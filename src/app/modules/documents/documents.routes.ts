import { Route } from '@angular/router';

export const DOCUMENTS_ROUTES: Route[] = [
  { path: '', loadComponent: () => import('./document-list.component').then(m => m.DocumentListComponent) },
  { path: 'new', loadComponent: () => import('./document-form.component').then(m => m.DocumentFormComponent) },
  { path: 'edit/:id', loadComponent: () => import('./document-form.component').then(m => m.DocumentFormComponent) },
];
