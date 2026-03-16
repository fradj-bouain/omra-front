import { Component, Input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-page-header',
  standalone: true,
  imports: [MatIconModule, RouterLink],
  templateUrl: './page-header.component.html',
  styleUrl: './page-header.component.scss',
})
export class PageHeaderComponent {
  /** Page title (e.g. "Pèlerins", "Nouveau pèlerin") */
  @Input() title = '';

  /** Optional short subtitle below the title */
  @Input() subtitle = '';

  /** Label for the action link (e.g. "Ajouter pèlerin", "Retour aux groupes") */
  @Input() actionLabel = '';

  /** Route for the action link (string or array) */
  @Input() actionLink: string[] | string | null = null;

  /** Icon for the action: "add" (default) for create, "arrow_back" for back */
  @Input() actionIcon: 'add' | 'arrow_back' = 'add';
}
