import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ApiService } from '../../core/services/api.service';
import { NotificationService } from '../../core/services/notification.service';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';

@Component({
  selector: 'app-bus-form',
  standalone: true,
  imports: [
    RouterLink,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    PageHeaderComponent,
  ],
  templateUrl: './bus-form.component.html',
  styleUrl: './bus-form.component.scss',
})
export class BusFormComponent {
  loading = false;
  form: FormGroup;

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private api: ApiService,
    private notif: NotificationService,
    private router: Router
  ) {
    this.form = this.fb.group({
      plate: ['', Validators.required],
      capacity: [50, [Validators.required, Validators.min(1)]],
      driverName: [''],
      driverContact: [''],
    });
  }

  onSubmit(): void {
    if (this.form.invalid || this.loading) return;
    this.loading = true;
    const v = this.form.getRawValue();
    const body = {
      plate: (v.plate || '').trim(),
      capacity: Number(v.capacity) || 50,
      driverName: (v.driverName || '').trim() || null,
      driverContact: (v.driverContact || '').trim() || null,
    };
    this.http.post(this.api.buses.list, body).subscribe({
      next: () => {
        this.notif.success('Bus créé');
        this.router.navigate(['/buses']);
      },
      error: (err) => {
        this.loading = false;
        this.notif.error(err.error?.message || 'Erreur lors de la création');
      },
    });
  }
}
