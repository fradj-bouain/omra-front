import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import {
  AbstractControl,
  FormArray,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
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
import { trigger, transition, style, animate } from '@angular/animations';

interface PilgrimDto {
  id: number;
}

interface PilgrimFamilyBatchResponse {
  familyId: number;
  pilgrims: PilgrimDto[];
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

export type FamilyRole = 'PERE' | 'MERE' | 'ENFANT' | 'AUTRE';

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
    MatButtonToggleModule,
    AsyncPipe,
    FormsModule,
    MatDividerModule,
    PageHeaderComponent,
    TranslatePipe,
    PilgrimDocumentsPanelComponent,
  ],
  templateUrl: './pilgrim-form.component.html',
  styleUrl: './pilgrim-form.component.scss',
  animations: [
    trigger('famillePanel', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(10px)' }),
        animate(
          '260ms cubic-bezier(0.22, 1, 0.36, 1)',
          style({ opacity: 1, transform: 'none' }),
        ),
      ]),
      transition(':leave', [
        animate(
          '200ms ease-in',
          style({ opacity: 0, transform: 'translateY(-8px)' }),
        ),
      ]),
    ]),
    trigger('individuelPanel', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(10px)' }),
        animate(
          '260ms cubic-bezier(0.22, 1, 0.36, 1)',
          style({ opacity: 1, transform: 'none' }),
        ),
      ]),
      transition(':leave', [
        animate(
          '200ms ease-in',
          style({ opacity: 0, transform: 'translateY(-8px)' }),
        ),
      ]),
    ]),
  ],
})
export class PilgrimFormComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);

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
  readonly familyRoles: { value: FamilyRole; labelKey: string }[] = [
    { value: 'PERE', labelKey: 'pilgrims.mo3tamir.rolePere' },
    { value: 'MERE', labelKey: 'pilgrims.mo3tamir.roleMere' },
    { value: 'ENFANT', labelKey: 'pilgrims.mo3tamir.roleEnfant' },
    { value: 'AUTRE', labelKey: 'pilgrims.mo3tamir.roleAutre' },
  ];

  readonly travelerTypes = ['PILGRIM', 'LEISURE', 'WORK', 'BUSINESS', 'OTHER'] as const;

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
    private i18n: I18nService,
  ) {
    this.form = this.fb.group({
      type: ['individuel'],
      membersCount: [2],
      members: this.fb.array<FormGroup>([]),
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
      travelerType: ['PILGRIM'],
      sponsorType: [''],
      sponsorLabel: [''],
      referrerPilgrim: [null as PilgrimSearchResult | string | null, this.validateReferrerPilgrim],
    });
  }

  get members(): FormArray<FormGroup> {
    return this.form.get('members') as FormArray<FormGroup>;
  }

  /** Création uniquement : mode famille. */
  get isFamilleCreate(): boolean {
    return !this.isEdit && this.form.get('type')?.value === 'famille';
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
      }),
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

    this.applyCreationTypeValidators();

    this.form
      .get('type')
      ?.valueChanges.pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((t) => {
        if (this.isEdit) return;
        if (t === 'individuel') {
          this.members.clear();
        } else {
          const n = Math.max(2, Number(this.form.get('membersCount')?.value) || 2);
          this.form.patchValue({ membersCount: n }, { emitEvent: false });
          this.rebuildMembersArray(n);
        }
        this.applyCreationTypeValidators();
        this.form.updateValueAndValidity({ emitEvent: false });
      });

    this.form
      .get('membersCount')
      ?.valueChanges.pipe(debounceTime(400), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe((raw) => {
        if (this.isEdit || this.form.get('type')?.value !== 'famille') return;
        const n = Math.max(2, parseInt(String(raw ?? '2'), 10) || 2);
        this.rebuildMembersArray(n);
      });
  }

  createMemberGroup(): FormGroup {
    return this.fb.group({
      fullName: ['', Validators.required],
      birthDate: [null as Date | null, Validators.required],
      cin: [''],
      documentsNotes: [''],
      familyRole: ['AUTRE' as FamilyRole],
    });
  }

  rebuildMembersArray(count: number): void {
    const n = Math.max(2, Math.floor(count));
    const arr = this.members;
    while (arr.length > n) {
      arr.removeAt(arr.length - 1);
    }
    while (arr.length < n) {
      arr.push(this.createMemberGroup());
    }
  }

  addFamilyMember(): void {
    if (this.isEdit || !this.isFamilleCreate) return;
    const next = this.members.length + 1;
    this.form.patchValue({ membersCount: next });
    this.members.push(this.createMemberGroup());
  }

  removeLastFamilyMember(): void {
    if (this.isEdit || !this.isFamilleCreate || this.members.length <= 2) return;
    this.members.removeAt(this.members.length - 1);
    this.form.patchValue({ membersCount: this.members.length }, { emitEvent: false });
  }

  applyMembersCountFromInput(): void {
    if (this.isEdit || !this.isFamilleCreate) return;
    const n = Math.max(2, parseInt(String(this.form.get('membersCount')?.value ?? 2), 10) || 2);
    this.form.patchValue({ membersCount: n }, { emitEvent: false });
    this.rebuildMembersArray(n);
  }

  private applyCreationTypeValidators(): void {
    if (this.isEdit) return;
    const t = this.form.get('type')?.value;
    const fn = this.form.get('firstName');
    const ln = this.form.get('lastName');
    const mc = this.form.get('membersCount');

    if (t === 'individuel') {
      fn?.setValidators([Validators.required]);
      ln?.setValidators([Validators.required]);
      mc?.clearValidators();
    } else {
      fn?.clearValidators();
      ln?.clearValidators();
      mc?.setValidators([Validators.required, Validators.min(2)]);
    }
    fn?.updateValueAndValidity({ emitEvent: false });
    ln?.updateValueAndValidity({ emitEvent: false });
    mc?.updateValueAndValidity({ emitEvent: false });
  }

  createSubmitDisabled(): boolean {
    if (this.loading) return true;
    if (this.isEdit) return this.form.invalid;
    if (this.isFamilleCreate) {
      return this.members.length < 2 || this.members.invalid || !!this.form.get('membersCount')?.invalid;
    }
    return this.form.invalid;
  }

  submitLabel(): string {
    if (this.loading) return this.i18n.instant('pilgrims.mo3tamir.saving');
    if (this.isEdit) return this.i18n.instant('pilgrims.mo3tamir.savePilgrim');
    if (this.isFamilleCreate) {
      return this.i18n.instant('pilgrims.mo3tamir.createFamily', { n: this.members.length });
    }
    return this.i18n.instant('pilgrims.mo3tamir.createPilgrim');
  }

  /** Découpe « prénom » / « reste » pour l’API firstName / lastName. */
  static splitFullName(full: string): { firstName: string; lastName: string } {
    const t = full.trim();
    if (!t) return { firstName: '', lastName: '' };
    const i = t.indexOf(' ');
    if (i === -1) return { firstName: t, lastName: '-' };
    const rest = t.slice(i + 1).trim();
    return { firstName: t.slice(0, i).trim(), lastName: rest || '-' };
  }

  private genderFromFamilyRole(role: FamilyRole): string | undefined {
    if (role === 'PERE') return 'M';
    if (role === 'MERE') return 'F';
    return undefined;
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
          travelerType: (res['travelerType'] as string) ?? 'PILGRIM',
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
        this.notif.error(this.i18n.instant('pilgrims.notif.notFound'));
        this.loading = false;
        this.router.navigate(['/pilgrims']);
      },
    });
  }

  sponsorTypeLabel(code: string | undefined): string {
    if (!code) return '—';
    if (code === 'PILGRIM') return this.i18n.instant('pilgrims.sponsorship.typePilgrim');
    if (code === 'AGENT') return this.i18n.instant('pilgrims.sponsorship.typeAgent');
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
      tempId:
        typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random()}`,
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
      map(() => void 0),
    );
  }

  onSubmit(): void {
    if (this.createSubmitDisabled()) {
      this.form.markAllAsTouched();
      this.members.controls.forEach((c) => c.markAllAsTouched());
      return;
    }
    this.loading = true;
    const v = this.form.getRawValue();

    if (this.isEdit && this.pilgrimId != null) {
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
        travelerType: v.travelerType || 'PILGRIM',
      };
      this.http.put(this.api.pilgrims.byId(this.pilgrimId), body).subscribe({
        next: () => {
          this.notif.success(this.i18n.instant('pilgrims.notif.updated'));
          this.router.navigate(['/pilgrims', this.pilgrimId]);
        },
        error: (err) => {
          this.loading = false;
          this.notif.error(err.error?.message || 'Erreur lors de la modification');
        },
      });
      return;
    }

    if (v.type === 'famille') {
      const rows = this.members.getRawValue() as {
        fullName: string;
        birthDate: Date | null;
        cin: string;
        documentsNotes: string;
        familyRole: FamilyRole;
      }[];

      const members = rows.map((row) => {
        const { firstName, lastName } = PilgrimFormComponent.splitFullName(row.fullName);
        const dob = toIsoDateString(row.birthDate)!;
        return {
          firstName: firstName || '-',
          lastName: lastName || '-',
          dateOfBirth: dob,
          passportNumber: String(row.cin || '').trim() || undefined,
          gender: this.genderFromFamilyRole(row.familyRole),
          familyRole: row.familyRole,
          documentNotes: String(row.documentsNotes || '').trim() || undefined,
        };
      });

      const batchBody: Record<string, unknown> = {
        nationality: v.nationality || undefined,
        phone: v.phone || undefined,
        email: v.email || undefined,
        address: v.address || undefined,
        visaStatus: v.visaStatus || 'PENDING',
        travelerType: v.travelerType || 'PILGRIM',
        members,
      };
      const st = v.sponsorType as string;
      if (st === 'PILGRIM' || st === 'AGENT') {
        batchBody['sponsorType'] = st;
        const label = String(v.sponsorLabel || '').trim();
        if (label) batchBody['sponsorLabel'] = label;
        if (st === 'PILGRIM') {
          const ref = v.referrerPilgrim;
          if (ref && typeof ref === 'object' && 'id' in ref) {
            batchBody['referrerPilgrimId'] = (ref as PilgrimSearchResult).id;
          }
        }
      }

      this.http.post<PilgrimFamilyBatchResponse>(this.api.pilgrims.familyBatch, batchBody).subscribe({
        next: (res) => {
          this.loading = false;
          const n = res.pilgrims?.length ?? 0;
          this.notif.success(this.i18n.instant('pilgrims.mo3tamir.familyCreated', { n }));
          this.router.navigate(['/pilgrims']);
        },
        error: (err) => {
          this.loading = false;
          this.notif.error(err.error?.message || this.i18n.instant('pilgrims.mo3tamir.familyCreateError'));
        },
      });
      return;
    }

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
      travelerType: v.travelerType || 'PILGRIM',
    };

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
            catchError(() => of({ created, docsOk: false as const })),
          );
        }),
      )
      .subscribe({
        next: ({ created, docsOk }) => {
          this.loading = false;
          this.notif.success(this.i18n.instant('pilgrims.notif.created'));
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
