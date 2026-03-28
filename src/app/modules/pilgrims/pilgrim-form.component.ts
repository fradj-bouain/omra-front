import { Component, OnInit } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
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
import { MatDatepickerModule } from '@angular/material/datepicker';
import { parseIsoDateString, toIsoDateString } from '../../shared/utils/date-form';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';
import { I18nService } from '../../core/services/i18n.service';
import { PilgrimDocumentsPanelComponent } from '../../shared/components/pilgrim-documents-panel/pilgrim-documents-panel.component';
import { fileUrlFromUploadResponse } from '../../shared/utils/upload-response';
import {
  Observable,
  catchError,
  concatMap,
  debounceTime,
  distinctUntilChanged,
  from,
  map,
  of,
  startWith,
  switchMap,
  toArray,
} from 'rxjs';
import { FormsModule } from '@angular/forms';
import { MatDividerModule } from '@angular/material/divider';

interface PilgrimDto {
  id: number;
}

export interface PilgrimSearchResult {
  id: number;
  firstName: string;
  lastName: string;
  passportNumber?: string;
}

interface PendingPilgrimDoc {
  tempId: string;
  file: File;
  type: string;
  status: string;
}

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
    MatAutocompleteModule,
    AsyncPipe,
    FormsModule,
    MatDividerModule,
    PageHeaderComponent,
    TranslatePipe,
    PilgrimDocumentsPanelComponent,
  ],
  templateUrl: './pilgrim-form.component.html',
  styleUrl: './pilgrim-form.component.scss',
})
export class PilgrimFormComponent implements OnInit {
  loading = false;
  isEdit = false;
  pilgrimId: number | null = null;
  form: FormGroup;

  /** Affichage seul en modification (parrainage figé après création). */
  sponsorshipView: {
    sponsorType?: string;
    sponsorLabel?: string;
    referrerDisplayName?: string;
    referralPoints?: number;
    nextRewardThreshold?: number;
    nextRewardTitle?: string;
  } | null = null;

  filteredReferrers$!: Observable<PilgrimSearchResult[]>;

  /** Brouillon : fichiers à uploader juste après POST /pilgrims (l’API exige un pilgrimId). */
  pendingDocs: PendingPilgrimDoc[] = [];
  draftDocType = 'PASSPORT';
  draftDocStatus: 'UPLOADED' | 'VERIFIED' | 'REJECTED' = 'UPLOADED';
  readonly documentTypes = ['PASSPORT', 'VISA', 'FLIGHT_TICKET', 'CONTRACT', 'PROGRAM'] as const;
  readonly statusOptions = ['UPLOADED', 'VERIFIED', 'REJECTED'] as const;

  private readonly validateReferrerPilgrim: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
    if (this.isEdit) return null;
    const st = this.form?.get('sponsorType')?.value;
    if (st !== 'PILGRIM') return null;
    const v = control.value;
    if (v && typeof v === 'object' && 'id' in v) return null;
    return { referrerRequired: true };
  };

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private api: ApiService,
    private notif: NotificationService,
    private router: Router,
    private route: ActivatedRoute,
    private i18n: I18nService
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
      sponsorType: [''],
      sponsorLabel: [''],
      referrerPilgrim: [null as PilgrimSearchResult | string | null, this.validateReferrerPilgrim],
    });
  }

  ngOnInit(): void {
    this.filteredReferrers$ = this.form.get('referrerPilgrim')!.valueChanges.pipe(
      startWith(this.form.get('referrerPilgrim')!.value),
      debounceTime(250),
      distinctUntilChanged(),
      switchMap((val) => {
        if (val !== null && typeof val !== 'string') {
          return of([]);
        }
        const q = String(val || '').trim();
        if (q.length < 2) {
          return of([]);
        }
        return this.http.get<PilgrimSearchResult[]>(this.api.pilgrims.autocomplete, {
          params: { q, limit: '15' },
        });
      })
    );

    this.form.get('sponsorType')?.valueChanges.subscribe((t) => {
      if (t !== 'PILGRIM') {
        this.form.patchValue({ referrerPilgrim: null }, { emitEvent: false });
      }
      this.form.get('referrerPilgrim')?.updateValueAndValidity({ emitEvent: false });
    });

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.pilgrimId = Number(id);
      this.isEdit = !isNaN(this.pilgrimId);
      if (this.isEdit) this.loadPilgrim();
    }
  }

  get pilgrimDisplayName(): string {
    const v = this.form.getRawValue();
    return `${v.firstName ?? ''} ${v.lastName ?? ''}`.trim();
  }

  displayReferrer(v: PilgrimSearchResult | string | null | undefined): string {
    if (v == null) return '';
    if (typeof v === 'string') return v;
    return `${v.firstName} ${v.lastName}`.trim();
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
        this.sponsorshipView = {
          sponsorType: res['sponsorType'] != null ? String(res['sponsorType']) : undefined,
          sponsorLabel: res['sponsorLabel'] != null ? String(res['sponsorLabel']) : undefined,
          referrerDisplayName: res['referrerDisplayName'] != null ? String(res['referrerDisplayName']) : undefined,
          referralPoints: typeof res['referralPoints'] === 'number' ? res['referralPoints'] : undefined,
          nextRewardThreshold: typeof res['nextRewardThreshold'] === 'number' ? res['nextRewardThreshold'] : undefined,
          nextRewardTitle: res['nextRewardTitle'] != null ? String(res['nextRewardTitle']) : undefined,
        };
        this.loading = false;
      },
      error: () => {
        this.notif.error('Pèlerin introuvable');
        this.loading = false;
        this.router.navigate(['/pilgrims']);
      },
    });
  }

  sponsorTypeLabel(code: string | undefined): string {
    if (!code) return '—';
    if (code === 'PILGRIM') return 'Pèlerin';
    if (code === 'AGENT') return 'Agent';
    return code;
  }

  docTypeLabelKey(t: string): string {
    return `doc.type.${t}`;
  }

  docStatusLabelKey(s: string): string {
    return `doc.status.${s}`;
  }

  onDraftFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input?.files?.[0];
    if (!file) return;
    this.pendingDocs.push({
      tempId: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
      file,
      type: this.draftDocType,
      status: this.draftDocStatus,
    });
    input.value = '';
  }

  removePendingDoc(tempId: string): void {
    this.pendingDocs = this.pendingDocs.filter((p) => p.tempId !== tempId);
  }

  private uploadOnePendingDoc(pilgrimId: number, p: PendingPilgrimDoc): Observable<void> {
    const formData = new FormData();
    formData.append('file', p.file);
    formData.append('type', 'general');
    return this.http.post<unknown>(this.api.files.upload, formData).pipe(
      switchMap((res) => {
        const url = fileUrlFromUploadResponse(res);
        if (!url) throw new Error('no file url');
        return this.http.post(this.api.documents.list, {
          pilgrimId,
          type: p.type,
          fileUrl: url,
          status: p.status,
        });
      }),
      map(() => void 0)
    );
  }

  onSubmit(): void {
    if (this.form.invalid || this.loading) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading = true;
    const v = this.form.getRawValue();
    const body: Record<string, unknown> = {
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

    if (!this.isEdit) {
      const st = v.sponsorType as string;
      if (st === 'PILGRIM' || st === 'AGENT') {
        body['sponsorType'] = st;
        const label = String(v.sponsorLabel || '').trim();
        if (label) body['sponsorLabel'] = label;
        if (st === 'PILGRIM') {
          const ref = v.referrerPilgrim;
          if (ref && typeof ref === 'object' && 'id' in ref) {
            body['referrerPilgrimId'] = (ref as PilgrimSearchResult).id;
          }
        }
      }
    }

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
      const queueSnapshot = [...this.pendingDocs];
      this.http
        .post<PilgrimDto>(this.api.pilgrims.list, body)
        .pipe(
          switchMap((created) => {
            if (queueSnapshot.length === 0) {
              return of({ created, docsOk: true as const });
            }
            return from(queueSnapshot).pipe(
              concatMap((p) => this.uploadOnePendingDoc(created.id, p)),
              toArray(),
              switchMap(() => of({ created, docsOk: true as const })),
              catchError(() => of({ created, docsOk: false as const }))
            );
          })
        )
        .subscribe({
          next: ({ created, docsOk }) => {
            this.loading = false;
            this.notif.success('Pèlerin créé');
            if (queueSnapshot.length > 0) {
              if (docsOk) {
                this.pendingDocs = [];
                this.notif.success(this.i18n.instant('pilgrims.form.documentsQueuedUploaded'));
              } else {
                this.pendingDocs = [];
                this.notif.error(this.i18n.instant('pilgrims.form.documentsQueuedPartialFail'));
              }
            }
            this.router.navigate(['/pilgrims', 'edit', created.id], { replaceUrl: true });
          },
          error: (err) => {
            this.loading = false;
            this.notif.error(err.error?.message || 'Erreur lors de la création');
          },
        });
    }
  }
}
