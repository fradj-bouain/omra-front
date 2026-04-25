import { Route } from '@angular/router';

export const USERS_ROUTES: Route[] = [
  { path: '', loadComponent: () => import('./user-list.component').then(m => m.UserListComponent) },
  { path: 'new', loadComponent: () => import('./user-form.component').then(m => m.UserFormComponent) },
  { path: 'edit/:id', loadComponent: () => import('./user-form.component').then(m => m.UserFormComponent) },
];
