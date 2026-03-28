import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { PilgrimDocumentsPanelComponent } from '../pilgrim-documents-panel/pilgrim-documents-panel.component';

export interface PilgrimDocumentsDialogData {
  pilgrimId: number;
  pilgrimLabel: string;
}

@Component({
  selector: 'app-pilgrim-documents-dialog',
  standalone: true,
  imports: [
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    TranslatePipe,
    PilgrimDocumentsPanelComponent,
  ],
  templateUrl: './pilgrim-documents-dialog.component.html',
  styleUrl: './pilgrim-documents-dialog.component.scss',
})
export class PilgrimDocumentsDialogComponent {
  readonly data = inject<PilgrimDocumentsDialogData>(MAT_DIALOG_DATA);
}
