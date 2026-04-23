import { Component, Input } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-pilgrim-member-edit-row',
  standalone: true,
  imports: [ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatDatepickerModule, TranslatePipe],
  templateUrl: './pilgrim-member-edit-row.component.html',
  styleUrl: './pilgrim-member-edit-row.component.scss',
})
export class PilgrimMemberEditRowComponent {
  @Input({ required: true }) group!: FormGroup;
  @Input({ required: true }) index!: number;
  @Input() pilgrimId: number | null = null;

  readonly travelerTypes = ['PILGRIM', 'LEISURE', 'WORK', 'BUSINESS', 'OTHER'] as const;
}
