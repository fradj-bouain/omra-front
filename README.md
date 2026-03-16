# Omra Dashboard (omra-front)

Application Angular 20 SPA pour la plateforme SaaS de gestion Omra : dashboard agence, pèlerins, groupes, vols, hôtels, documents, paiements, notifications, utilisateurs et paramètres (branding).

## Stack

- **Angular 20**
- **Angular Material** (UI)
- **SCSS**
- **Material Icons**
- **RxJS**, **HttpClient**

## Structure

```
src/app
├── core/           # Auth, API, theme, interceptors, guards
├── auth/           # Login
├── layout/         # Header, sidebar, footer
├── dashboard/      # Page dashboard + stats (GET /api/dashboard/stats)
├── shared/         # Composants réutilisables (page-header)
├── modules/
│   ├── pilgrims/
│   ├── groups/
│   ├── flights/
│   ├── hotels/
│   ├── documents/
│   ├── payments/
│   ├── notifications/
│   ├── users/
│   └── settings/
```

## Démarrage

```bash
cd omra-front
npm install
npm start
```

Ouvrir http://localhost:4200. Le backend doit tourner sur http://localhost:8080 (voir `src/environments/environment.ts`).

### En cas d’erreurs « Cannot find module '@angular/material/...' »

Les modules Angular Material ne sont pas installés. À faire :

1. Dans le dossier **omra-front** : `npm install`
2. Si les erreurs persistent : supprimer `node_modules` et `package-lock.json`, puis relancer `npm install`
3. Lancer le build : `npm run build` ou `npm start`

## Fonctionnalités (cahier des charges)

- **Layout** : Header (logo agence, menu utilisateur), Sidebar (menu selon rôle), Main Content, Footer
- **Thème** : `GET /api/agencies/theme` → variables CSS (primary, menu, button, background)
- **Auth** : Login (email/password), JWT, refresh token, AuthGuard, interceptor (Authorization + 401 → refresh/logout)
- **Dashboard** : Total pèlerins, groupes actifs, visas en attente, paiements reçus, revenus
- **Modules** : Listes paginées (?page=1&size=20), recherche/filtres selon écrans
- **Paramètres** : Profil agence, branding (primary color, menu color, button color, logo URL)
- **Responsive** : Sidebar en overlay (hamburger) sur mobile
- **Lazy loading** : Routes chargées à la demande
