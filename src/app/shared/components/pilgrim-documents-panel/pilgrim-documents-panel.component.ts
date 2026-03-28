import { Component, Input, OnChanges, OnInit, SimpleChanges, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { DatePipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FormsModule } from '@angular/forms';
import { MatDividerModule } from '@angular/material/divider';
import { ApiService } from '../../../core/services/api.service';
import { NotificationService } from '../../../core/services/notification.service';
import { I18nService } from '../../../core/services/i18n.service';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { resolveMediaUrl } from '../../utils/media-url';
import { fileUrlFromUploadResponse } from '../../utils/upload-response';

export interface PilgrimDocumentRow {
  id: number;
  pilgrimId?: number;
  type: string;
  status: string;
  fileUrl?: string;
  createdAt?: string;
}

@Component({
  selector: 'app-pilgrim-documents-panel',
  standalone: true,
  imports: [
    DatePipe,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatSelectModule,
    MatTooltipModule,
    MatDividerModule,
    FormsModule,
    TranslatePipe,
  ],
  templateUrl: './pilgrim-documents-panel.component.html',
  styleUrl: './pilgrim-documents-panel.component.scss',
})
export class PilgrimDocumentsPanelComponent implements OnInit, OnChanges {
  private readonly http = inject(HttpClient);
  private readonly api = inject(ApiService);
  private readonly notif = inject(NotificationService);
  private readonly i18n = inject(I18nService);

  readonly resolveMediaUrl = resolveMediaUrl;
  readonly documentTypes = ['PASSPORT', 'VISA', 'FLIGHT_TICKET', 'CONTRACT', 'PROGRAM'] as const;
  readonly statusOptions = ['UPLOADED', 'VERIFIED', 'REJECTED'] as const;

  @Input({ required: true }) pilgrimId!: number;
  @Input() pilgrimLabel = '';
  /** Dans le dialogue documents : masque le gros titre pour éviter la redondance avec le titre du dialog. */
  @Input() compactHeader = false;

  documents: PilgrimDocumentRow[] = [];
  loading = false;
  showAddForm = false;
  addType = 'PASSPORT';
  addStatus: (typeof this.statusOptions)[number] = 'UPLOADED';
  uploading = false;
  /** Document en cours de mise à jour du statut (PATCH). */
  updatingStatusDocId: number | null = null;

  ngOnInit(): void {
    this.load();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['pilgrimId'] && !changes['pilgrimId'].firstChange && this.pilgrimId) {
      this.load();
    }
  }

  load(): void {
    if (this.pilgrimId == null) return;
    this.loading = true;
    this.http.get<PilgrimDocumentRow[]>(this.api.documents.byPilgrim(this.pilgrimId)).subscribe({
      next: (list) => {
        this.documents = list;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.notif.error(this.i18n.instant('err.pilgrimDocumentsLoad'));
      },
    });
  }

  toggleAddForm(): void {
    this.showAddForm = !this.showAddForm;
  }

  typeLabelKey(t: string | undefined): string {
    if (!t) return 'common.emDash';
    return `doc.type.${t}`;
  }

  statusLabelKey(s: string | undefined): string {
    if (!s) return 'common.emDash';
    return `doc.status.${s}`;
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input?.files?.[0];
    if (!file) return;
    this.uploading = true;
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', 'general');
    this.http.post<unknown>(this.api.files.upload, formData).subscribe({
      next: (res) => {
        const url = fileUrlFromUploadResponse(res);
        if (!url) {
          this.uploading = false;
          this.notif.error(this.i18n.instant('err.documentSave'));
          input.value = '';
          return;
        }
        this.http.post<PilgrimDocumentRow>(this.api.documents.list, {
          pilgrimId: this.pilgrimId,
          type: this.addType,
          fileUrl: url,
          status: this.addStatus,
        }).subscribe({
          next: () => {
            this.uploading = false;
            this.notif.success(this.i18n.instant('pilgrims.documents.uploaded'));
            this.showAddForm = false;
            this.load();
          },
          error: () => {
            this.uploading = false;
            this.notif.error(this.i18n.instant('err.documentSave'));
          },
        });
      },
      error: () => {
        this.uploading = false;
        this.notif.error(this.i18n.instant('err.documentUpload'));
      },
    });
    input.value = '';
  }

  deleteDoc(doc: PilgrimDocumentRow, ev: Event): void {
    ev.stopPropagation();
    if (!confirm(this.i18n.instant('pilgrims.documents.deleteConfirm'))) return;
    this.http.delete(this.api.documents.delete(doc.id)).subscribe({
      next: () => {
        this.notif.success(this.i18n.instant('pilgrims.documents.deleted'));
        this.load();
      },
      error: () => this.notif.error(this.i18n.instant('err.delete')),
    });
  }

  onDocStatusChange(doc: PilgrimDocumentRow, status: string): void {
    if (!status || status === doc.status) return;
    this.updatingStatusDocId = doc.id;
    this.http.patch<PilgrimDocumentRow>(this.api.documents.patch(doc.id), { status }).subscribe({
      next: (updated) => {
        doc.status = updated.status ?? status;
        this.updatingStatusDocId = null;
        this.notif.success(this.i18n.instant('pilgrims.documents.statusUpdated'));
      },
      error: () => {
        this.updatingStatusDocId = null;
        this.notif.error(this.i18n.instant('err.documentStatusUpdate'));
        this.load();
      },
    });
  }
}
