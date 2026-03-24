import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { ApiService } from '../../core/services/api.service';
import { NotificationService } from '../../core/services/notification.service';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { parseIsoDateString, toIsoDateString } from '../../shared/utils/date-form';

@Component({
  selector: 'app-pilgrim-form',
  standalone: true,
  imports: [
    RouterLink,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatIconModule,
    MatDatepickerModule,
    PageHeaderComponent,
  ],
  templateUrl: './pilgrim-form.component.html',
  styleUrl: './pilgrim-form.component.scss',
})
export class PilgrimFormComponent implements OnInit {
  loading = false;
  isEdit = false;
  pilgrimId: number | null = null;
  form: FormGroup;

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private api: ApiService,
    private notif: NotificationService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.form = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      gender: [''],
      dateOfBirth: [null as Date | null],
      passportNumber: [''],
      nationality: [''],
      phone: [''],
      email: [''],
      address: [''],
      visaStatus: ['PENDING'],
    });
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.pilgrimId = Number(id);
      this.isEdit = !isNaN(this.pilgrimId);
      if (this.isEdit) this.loadPilgrim();
    }
  }

  loadPilgrim(): void {
    if (this.pilgrimId == null) return;
    this.loading = true;
    this.http.get<Record<string, unknown>>(this.api.pilgrims.byId(this.pilgrimId)).subscribe({
      next: (res) => {
        this.form.patchValue({
          firstName: res['firstName'] ?? '',
          lastName: res['lastName'] ?? '',
          gender: res['gender'] ?? '',
          dateOfBirth: parseIsoDateString(String(res['dateOfBirth'] ?? '')),
          passportNumber: res['passportNumber'] ?? '',
          nationality: res['nationality'] ?? '',
          phone: res['phone'] ?? '',
          email: res['email'] ?? '',
          address: res['address'] ?? '',
          visaStatus: res['visaStatus'] ?? 'PENDING',
        });
        this.loading = false;
      },
      error: () => {
        this.notif.error('Pèlerin introuvable');
        this.loading = false;
        this.router.navigate(['/pilgrims']);
      },
    });
  }

  onSubmit(): void {
    if (this.form.invalid || this.loading) return;
    this.loading = true;
    const v = this.form.getRawValue();
    const body = {
      firstName: v.firstName,
      lastName: v.lastName,
      gender: v.gender || undefined,
      dateOfBirth: toIsoDateString(v.dateOfBirth as Date | null),
      passportNumber: v.passportNumber || undefined,
      nationality: v.nationality || undefined,
      phone: v.phone || undefined,
      email: v.email || undefined,
      address: v.address || undefined,
      visaStatus: v.visaStatus || 'PENDING',
    };
    if (this.isEdit && this.pilgrimId != null) {
      this.http.put(this.api.pilgrims.byId(this.pilgrimId), body).subscribe({
        next: () => {
          this.notif.success('Pèlerin modifié');
          this.router.navigate(['/pilgrims', this.pilgrimId]);
        },
        error: (err) => {
          this.loading = false;
          this.notif.error(err.error?.message || 'Erreur lors de la modification');
        },
      });
    } else {
      this.http.post(this.api.pilgrims.list, body).subscribe({
        next: () => {
          this.notif.success('Pèlerin créé');
          this.router.navigate(['/pilgrims']);
        },
        error: (err) => {
          this.loading = false;
          this.notif.error(err.error?.message || 'Erreur lors de la création');
        },
      });
    }
  }
}
