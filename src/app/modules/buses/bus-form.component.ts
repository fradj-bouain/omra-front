import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
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
import { FormInitialLoadComponent } from '../../shared/components/form-initial-load/form-initial-load.component';

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
    FormInitialLoadComponent,
  ],
  templateUrl: './bus-form.component.html',
  styleUrl: './bus-form.component.scss',
})
export class BusFormComponent implements OnInit {
  initialLoading = false;
  saving = false;
  form: FormGroup;
  editingId: number | null = null;

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private api: ApiService,
    private notif: NotificationService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.form = this.fb.group({
      plate: ['', Validators.required],
      capacity: [50, [Validators.required, Validators.min(1)]],
      driverName: [''],
      driverContact: [''],
    });
  }

  ngOnInit(): void {
    const idRaw = this.route.snapshot.paramMap.get('id');
    if (!idRaw) return;
    const id = Number(idRaw);
    if (isNaN(id)) return;
    this.editingId = id;
    this.initialLoading = true;
    this.http.get<any>(this.api.buses.byId(id)).subscribe({
      next: (b) => {
        this.form.patchValue({
          plate: b?.plate ?? '',
          capacity: b?.capacity ?? 50,
          driverName: b?.driverName ?? '',
          driverContact: b?.driverContact ?? '',
        });
        this.initialLoading = false;
      },
      error: () => {
        this.initialLoading = false;
        this.notif.error('Impossible de charger le bus');
      },
    });
  }

  onSubmit(): void {
    if (this.form.invalid || this.initialLoading || this.saving) return;
    this.saving = true;
    const v = this.form.getRawValue();
    const body = {
      plate: (v.plate || '').trim(),
      capacity: Number(v.capacity) || 50,
      driverName: (v.driverName || '').trim() || null,
      driverContact: (v.driverContact || '').trim() || null,
    };
    const req$ = this.editingId
      ? this.http.put(this.api.buses.byId(this.editingId), body)
      : this.http.post(this.api.buses.list, body);
    req$.subscribe({
      next: () => {
        this.notif.success(this.editingId ? 'Bus modifié' : 'Bus créé');
        this.router.navigate(['/buses']);
      },
      error: (err) => {
        this.saving = false;
        this.notif.error(err.error?.message || 'Erreur lors de la création');
      },
    });
  }
}
