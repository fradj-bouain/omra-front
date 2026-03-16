import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { ApiService } from '../../core/services/api.service';
import { NotificationService } from '../../core/services/notification.service';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';

interface GroupOption {
  id: number;
  name: string;
}

@Component({
  selector: 'app-flight-form',
  standalone: true,
  imports: [
    RouterLink,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatAutocompleteModule,
    PageHeaderComponent,
  ],
  templateUrl: './flight-form.component.html',
  styleUrl: './flight-form.component.scss',
})
export class FlightFormComponent implements OnInit {
  loading = false;
  form: FormGroup;
  groupDisplay = new FormControl('');
  groups: GroupOption[] = [];

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private api: ApiService,
    private notif: NotificationService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.form = this.fb.group({
      airline: ['', Validators.required],
      flightNumber: ['', Validators.required],
      departureCity: [''],
      arrivalCity: [''],
      departureTime: [''],
      arrivalTime: [''],
      terminal: [''],
      gate: [''],
      groupId: [null as number | null],
    });
  }

  ngOnInit(): void {
    const gid = this.route.snapshot.queryParamMap.get('groupId');
    if (gid) {
      const id = Number(gid);
      if (!isNaN(id)) this.form.patchValue({ groupId: id });
    }
    this.http.get<{ content: GroupOption[] }>(`${this.api.groups.list}?page=1&size=500`).subscribe({
      next: (res) => {
        this.groups = res.content || [];
        const groupId = this.form.get('groupId')?.value;
        if (groupId != null) {
          const g = this.groups.find((x) => x.id === Number(groupId));
          if (g) this.groupDisplay.setValue(g.name, { emitEvent: false });
        }
      },
      error: () => {},
    });
    this.groupDisplay.valueChanges.subscribe((v) => {
      if (v === '' || v == null) this.form.patchValue({ groupId: null }, { emitEvent: false });
    });
  }

  get filteredGroups(): GroupOption[] {
    const q = (this.groupDisplay.value ?? '').toString().toLowerCase();
    if (!q) return this.groups.slice(0, 50);
    return this.groups.filter((g) => g.name.toLowerCase().includes(q)).slice(0, 50);
  }

  selectGroup(g: GroupOption): void {
    this.form.patchValue({ groupId: g.id });
    this.groupDisplay.setValue(g.name, { emitEvent: false });
  }

  onSubmit(): void {
    if (this.form.invalid || this.loading) return;
    this.loading = true;
    const v = this.form.getRawValue();
    const body: Record<string, unknown> = {
      airline: v.airline || undefined,
      flightNumber: v.flightNumber || undefined,
      departureCity: v.departureCity || undefined,
      arrivalCity: v.arrivalCity || undefined,
      terminal: v.terminal || undefined,
      gate: v.gate || undefined,
      groupId: v.groupId != null && v.groupId !== '' ? Number(v.groupId) : undefined,
    };
    if (v['departureTime']) body['departureTime'] = v['departureTime'];
    if (v['arrivalTime']) body['arrivalTime'] = v['arrivalTime'];
    this.http.post(this.api.flights.list, body).subscribe({
      next: () => {
        this.notif.success('Vol créé');
        this.router.navigate(['/flights']);
      },
      error: (err) => {
        this.loading = false;
        this.notif.error(err.error?.message || 'Erreur lors de la création');
      },
    });
  }
}
