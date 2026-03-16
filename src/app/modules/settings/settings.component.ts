import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { ApiService } from '../../core/services/api.service';
import { ThemeService } from '../../core/services/theme.service';
import { AuthService, type Agency } from '../../core/services/auth.service';
import type { AgencyTheme } from '../../core/services/theme.service';
import { NotificationService } from '../../core/services/notification.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [FormsModule, MatCardModule, MatFormFieldModule, MatInputModule, MatButtonModule],
  template: `
    <h1 class="page-title">Paramètres</h1>

    <mat-card class="section">
      <mat-card-header>
        <mat-card-title>Profil agence</mat-card-title>
      </mat-card-header>
      <mat-card-content>
        @if (auth.agency(); as agency) {
          <p><strong>{{ agency.name }}</strong></p>
          <p>{{ agency.email }}</p>
        }
      </mat-card-content>
    </mat-card>

    <mat-card class="section">
      <mat-card-header>
        <mat-card-title>Branding (thème)</mat-card-title>
        <mat-card-subtitle>Primary color, menu color, button color</mat-card-subtitle>
      </mat-card-header>
      <mat-card-content>
        <form (ngSubmit)="saveBranding()">
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Couleur primaire</mat-label>
            <input matInput [(ngModel)]="branding.primaryColor" name="primaryColor" type="text" placeholder="#0f766e" />
          </mat-form-field>
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Couleur menu</mat-label>
            <input matInput [(ngModel)]="branding.menuColor" name="menuColor" type="text" placeholder="#134e4a" />
          </mat-form-field>
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Couleur boutons</mat-label>
            <input matInput [(ngModel)]="branding.buttonColor" name="buttonColor" type="text" placeholder="#0f766e" />
          </mat-form-field>
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Logo URL</mat-label>
            <input matInput [(ngModel)]="branding.logoUrl" name="logoUrl" type="url" />
          </mat-form-field>
          <button mat-flat-button color="primary" type="submit">Enregistrer le thème</button>
        </form>
        <p class="preview-hint">Aperçu : les couleurs sont appliquées après enregistrement.</p>
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    .page-title { margin: 0 0 24px; font-size: 1.5rem; font-weight: 600; }
    .section { margin-bottom: 24px; }
    .full-width { width: 100%; max-width: 400px; display: block; margin-bottom: 8px; }
    .preview-hint { margin-top: 16px; color: #64748b; font-size: 0.875rem; }
  `],
})
export class SettingsComponent {
  branding = {
    logoUrl: '',
    primaryColor: '',
    menuColor: '',
    buttonColor: '',
    backgroundColor: '',
    textColor: '',
  };

  constructor(
    private http: HttpClient,
    private api: ApiService,
    private theme: ThemeService,
    public auth: AuthService,
    private notif: NotificationService
  ) {
    const agency = this.auth.agency();
    if (agency) {
      this.branding.logoUrl = agency.logoUrl ?? '';
      this.branding.primaryColor = agency.primaryColor ?? '';
      this.branding.menuColor = agency.menuColor ?? '';
      this.branding.buttonColor = agency.buttonColor ?? '';
    }
  }

  saveBranding(): void {
    this.http.put(this.api.agencies.branding, this.branding).subscribe({
      next: (res: unknown) => {
        this.theme.applyTheme(res as AgencyTheme | Agency | null);
        this.notif.success('Thème enregistré');
      },
      error: () => this.notif.error('Erreur enregistrement thème'),
    });
  }
}
