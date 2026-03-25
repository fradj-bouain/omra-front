import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  constructor(private snackBar: MatSnackBar) {}

  /** Succès API : snackbar verte (fixe, hors thème agence — voir styles .snack-success). */
  success(message: string): void {
    this.snackBar.open(message, 'Fermer', { duration: 4000, panelClass: ['snack-success'] });
  }

  /** Erreur API : snackbar rouge (fixe, hors thème agence — voir styles .snack-error). */
  error(message: string): void {
    this.snackBar.open(message, 'Fermer', { duration: 6000, panelClass: ['snack-error'] });
  }

  info(message: string): void {
    this.snackBar.open(message, 'Fermer', { duration: 3000 });
  }
}
