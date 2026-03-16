import { Component, inject } from '@angular/core';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-create-placeholder',
  standalone: true,
  imports: [MatCardModule, MatButtonModule, RouterLink],
  template: `
    <div class="placeholder-page">
      <h1 class="page-title">{{ title }}</h1>
      <mat-card>
        <mat-card-content>
          <p>Formulaire de création à compléter pour ce module.</p>
          <a mat-flat-button color="primary" [routerLink]="backLink">Retour à la liste</a>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`.placeholder-page { max-width: 500px; } .page-title { margin: 0 0 24px; font-size: 1.5rem; }`],
})
export class CreatePlaceholderComponent {
  private route = inject(ActivatedRoute);
  title = (this.route.snapshot.data['title'] as string) ?? 'Création';
  backLink = (this.route.snapshot.data['backLink'] as string[]) ?? ['/'];
}
