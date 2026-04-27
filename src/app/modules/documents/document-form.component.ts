import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { ApiService } from '../../core/services/api.service';
import { NotificationService } from '../../core/services/notification.service';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { FormInitialLoadComponent } from '../../shared/components/form-initial-load/form-initial-load.component';
import { fileUrlFromUploadResponse } from '../../shared/utils/upload-response';

interface GroupOption {
  id: number;
  name: string;
}

interface PilgrimOption {
  id: number;
  firstName: string;
  lastName: string;
}

@Component({
  selector: 'app-document-form',
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
    MatAutocompleteModule,
    PageHeaderComponent,
    FormInitialLoadComponent,
  ],
  templateUrl: './document-form.component.html',
  styleUrl: './document-form.component.scss',
})
export class DocumentFormComponent implements OnInit {
  initialLoading = false;
  saving = false;
  uploading = false;
  form: FormGroup;
  pilgrimDisplay = new FormControl('');
  groupDisplay = new FormControl('');
  groups: GroupOption[] = [];
  pilgrims: PilgrimOption[] = [];
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
      pilgrimId: [null as number | null],
      groupId: [null as number | null],
      type: ['PASSPORT'],
      fileUrl: ['', Validators.required],
      status: ['UPLOADED'],
    });
  }

  ngOnInit(): void {
    const idRaw = this.route.snapshot.paramMap.get('id');
    if (idRaw) {
      const id = Number(idRaw);
      if (!isNaN(id)) {
        this.editingId = id;
        this.initialLoading = true;
        this.http.get<any>(this.api.documents.byId(id)).subscribe({
          next: (d) => {
            this.form.patchValue({
              pilgrimId: d?.pilgrimId ?? null,
              groupId: d?.groupId ?? null,
              type: d?.type ?? 'PASSPORT',
              fileUrl: d?.fileUrl ?? '',
              status: d?.status ?? 'UPLOADED',
            });
            this.initialLoading = false;
          },
          error: () => {
            this.initialLoading = false;
            this.notif.error('Impossible de charger le document');
          },
        });
      }
    }

    this.http.get<{ content: GroupOption[] }>(`${this.api.groups.list}?page=1&size=500`).subscribe({
      next: (res) => (this.groups = res.content || []),
      error: () => {},
    });
    this.http.get<{ content: PilgrimOption[] }>(`${this.api.pilgrims.list}?page=1&size=500`).subscribe({
      next: (res) => (this.pilgrims = res.content || []),
      error: () => {},
    });
    this.pilgrimDisplay.valueChanges.subscribe((v) => {
      if (v === '' || v == null) this.form.patchValue({ pilgrimId: null }, { emitEvent: false });
    });
    this.groupDisplay.valueChanges.subscribe((v) => {
      if (v === '' || v == null) this.form.patchValue({ groupId: null }, { emitEvent: false });
    });
  }

  get filteredPilgrims(): PilgrimOption[] {
    const q = (this.pilgrimDisplay.value ?? '').toString().toLowerCase();
    if (!q) return this.pilgrims.slice(0, 50);
    const name = (p: PilgrimOption) => `${p.firstName} ${p.lastName}`.toLowerCase();
    return this.pilgrims.filter((p) => name(p).includes(q)).slice(0, 50);
  }

  get filteredGroups(): GroupOption[] {
    const q = (this.groupDisplay.value ?? '').toString().toLowerCase();
    if (!q) return this.groups.slice(0, 50);
    return this.groups.filter((g) => g.name.toLowerCase().includes(q)).slice(0, 50);
  }

  selectPilgrim(p: PilgrimOption): void {
    this.form.patchValue({ pilgrimId: p.id });
    this.pilgrimDisplay.setValue(`${p.firstName} ${p.lastName}`, { emitEvent: false });
  }

  selectGroup(g: GroupOption): void {
    this.form.patchValue({ groupId: g.id });
    this.groupDisplay.setValue(g.name, { emitEvent: false });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input?.files?.[0];
    if (!file) return;
    this.uploading = true;
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', this.form.get('type')?.value || 'general');
    this.http.post<unknown>(this.api.files.upload, formData).subscribe({
      next: (res) => {
        this.uploading = false;
        const u = fileUrlFromUploadResponse(res);
        if (u) this.form.patchValue({ fileUrl: u });
        if (u) this.notif.success('Fichier uploadé');
        else this.notif.error('Réponse serveur inattendue après upload');
      },
      error: () => {
        this.uploading = false;
        this.notif.error('Échec de l\'upload');
      },
    });
    input.value = '';
  }

  onSubmit(): void {
    if (this.form.invalid || this.initialLoading || this.saving) return;
    this.saving = true;
    const v = this.form.getRawValue();
    const body = {
      pilgrimId: v.pilgrimId != null && v.pilgrimId !== '' ? Number(v.pilgrimId) : undefined,
      groupId: v.groupId != null && v.groupId !== '' ? Number(v.groupId) : undefined,
      type: v.type || 'PASSPORT',
      fileUrl: v.fileUrl,
      status: v.status || 'UPLOADED',
    };
    const req$ = this.editingId
      ? this.http.patch(this.api.documents.patch(this.editingId), body)
      : this.http.post(this.api.documents.list, body);
    req$.subscribe({
      next: () => {
        this.notif.success(this.editingId ? 'Document modifié' : 'Document enregistré');
        this.router.navigate(['/documents']);
      },
      error: (err) => {
        this.saving = false;
        this.notif.error(err.error?.message || 'Erreur lors de l\'enregistrement');
      },
    });
  }
}
