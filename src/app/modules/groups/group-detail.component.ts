import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { DatePipe, DecimalPipe, NgClass } from '@angular/common';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { NotificationService } from '../../core/services/notification.service';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { toIsoDateString } from '../../shared/utils/date-form';
import { TaskTemplateNode } from '../task-templates/models/task-template-node.model';
import { PlanningTaskRoot } from './models/group-planning.model';
import { GroupHeaderComponent } from './components/group-header/group-header.component';
import { GroupStatsComponent } from './components/group-stats/group-stats.component';
import { GroupTabsComponent } from './components/group-tabs/group-tabs.component';
import { PlanningTabComponent } from './components/planning-tab/planning-tab.component';

interface Group {
  id: number;
  name: string;
  description?: string;
  departureDate?: string;
  returnDate?: string;
  maxCapacity?: number;
  price?: number;
  planningId?: number | null;
  status: string;
  companionIds?: number[];
}

interface PlanningSummary {
  id: number;
  name: string;
  description?: string;
  items?: {
    id?: number;
    taskTemplateId?: number;
    taskTemplateName: string;
    durationMinutes?: number;
    sortOrder: number;
  }[];
}

interface Pilgrim {
  id: number;
  firstName: string;
  lastName: string;
  passportNumber?: string;
  phone?: string;
  visaStatus?: string;
}

interface Flight {
  id: number;
  airline?: string;
  flightNumber?: string;
  departureCity?: string;
  arrivalCity?: string;
}

interface GroupHotel {
  id: number;
  hotelId: number;
  checkIn?: string;
  checkOut?: string;
}

interface TripCostItem {
  id: number;
  type: string;
  amount: number;
  currency: string;
}

interface Hotel {
  id: number;
  name: string;
  city?: string;
}

interface Bus {
  id: number;
  plate?: string;
  capacity?: number;
}

interface CompanionOption {
  id: number;
  name: string;
  email?: string;
}

interface Payment {
  id: number;
  groupId?: number;
  amount: number;
  currency: string;
  status: string;
}

interface GroupDocument {
  id: number;
  groupId?: number;
  pilgrimId?: number;
  type?: string;
  status?: string;
}

interface PageResponse<T> {
  content: T[];
  totalElements: number;
}

@Component({
  selector: 'app-group-detail',
  standalone: true,
  imports: [
    RouterLink,
    DatePipe,
    DecimalPipe,
    NgClass,
    FormsModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatOptionModule,
    MatAutocompleteModule,
    MatTooltipModule,
    MatDatepickerModule,
    MatTableModule,
    MatPaginatorModule,
    PageHeaderComponent,
    GroupHeaderComponent,
    GroupStatsComponent,
    GroupTabsComponent,
    PlanningTabComponent,
  ],
  templateUrl: './group-detail.component.html',
  styleUrl: './group-detail.component.scss',
})
export class GroupDetailComponent implements OnInit {
  groupId: number | null = null;
  group: Group | null = null;
  planning: PlanningSummary | null = null;
  planningRoots: PlanningTaskRoot[] = [];
  planningTreesLoading = false;
  selectedPlanningTask: TaskTemplateNode | null = null;

  pilgrims: Pilgrim[] = [];
  flights: Flight[] = [];
  groupBuses: Bus[] = [];
  groupHotels: GroupHotel[] = [];
  tripCosts: TripCostItem[] = [];
  groupPayments: Payment[] = [];
  groupDocuments: GroupDocument[] = [];

  loading = true;
  error: string | null = null;

  selectedTabIndex = 0;

  // Add pilgrim
  allPilgrims: Pilgrim[] = [];
  loadingPilgrims = false;
  showAddPilgrim = false;
  selectedPilgrimId: number | null = null;
  pilgrimSearchInput = '';
  addingPilgrim = false;

  // Pilgrims table
  pilgrimSearch = '';
  pilgrimPageIndex = 0;
  pilgrimPageSize = 10;
  pilgrimColumns: string[] = ['name', 'passport', 'phone', 'visa'];

  // Assign hotel
  allHotels: Hotel[] = [];
  showAssignHotel = false;
  assignHotelForm = {
    hotelId: null as number | null,
    checkIn: null as Date | null,
    checkOut: null as Date | null,
    city: 'MAKKAH' as string,
    roomType: '',
  };
  assigningHotel = false;

  // Add trip cost
  showAddCost = false;
  costForm = { type: 'FLIGHT' as string, amount: '', currency: 'MAD', description: '' };
  addingCost = false;
  tripCostTypes = ['FLIGHT', 'HOTEL', 'VISA', 'TRANSPORT', 'MEALS', 'OTHER'];

  // Link flight
  allFlights: Flight[] = [];
  showLinkFlight = false;
  selectedFlightId: number | null = null;
  linkingFlight = false;

  // Link bus
  allBuses: Bus[] = [];
  showLinkBus = false;
  selectedBusId: number | null = null;
  linkingBus = false;

  companionOptions: CompanionOption[] = [];
  selectedCompanionIds: number[] = [];
  savingCompanions = false;

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
    private api: ApiService,
    private notif: NotificationService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.loading = false;
      this.error = 'ID groupe manquant';
      return;
    }
    this.groupId = +id;

    this.route.queryParamMap.subscribe((q) => {
      const tab = q.get('tab');
      if (tab === 'pilgrims') this.selectedTabIndex = 1;
      else if (tab === 'flights') this.selectedTabIndex = 2;
      else if (tab === 'hotels') this.selectedTabIndex = 3;
      else if (tab === 'payments') this.selectedTabIndex = 4;
      else if (tab === 'documents') this.selectedTabIndex = 5;
      if (q.get('addPilgrim') === '1') {
        this.selectedTabIndex = 1;
        this.showAddPilgrim = true;
      }
    });

    this.loadAll();
  }

  loadAll(): void {
    if (this.groupId == null) return;
    this.loading = true;
    this.error = null;
    this.http.get<Group>(this.api.groups.byId(this.groupId)).subscribe({
      next: (g) => {
        this.group = g;
        this.selectedCompanionIds = Array.isArray(g.companionIds) ? [...g.companionIds] : [];
        this.planning = null;
        this.planningRoots = [];
        this.selectedPlanningTask = null;
        if (g.planningId) {
          this.http.get<PlanningSummary>(this.api.plannings.byId(g.planningId)).subscribe({
            next: (p) => {
              this.planning = p;
              this.loadPlanningTrees();
            },
            error: () => {
              this.planning = null;
              this.planningRoots = [];
            },
          });
        }
        this.loadRelated();
      },
      error: (err) => {
        this.loading = false;
        this.error = err.error?.message || 'Groupe introuvable';
      },
    });
  }

  private normalizeTaskTree(n: TaskTemplateNode): TaskTemplateNode {
    return {
      ...n,
      children: (n.children || []).map((c) => this.normalizeTaskTree(c)),
    };
  }

  loadPlanningTrees(): void {
    const items = this.planning?.items;
    if (!items?.length) {
      this.planningRoots = [];
      return;
    }
    const sorted = [...items].sort((a, b) => a.sortOrder - b.sortOrder);
    const valid = sorted.filter((it) => it.taskTemplateId != null);
    if (!valid.length) {
      this.planningRoots = [];
      return;
    }
    this.planningTreesLoading = true;
    const reqs = valid.map((it) =>
      this.http
        .get<TaskTemplateNode>(this.api.taskTemplates.byIdTree(it.taskTemplateId!))
        .pipe(
          catchError(() =>
            of({
              id: it.taskTemplateId!,
              name: it.taskTemplateName || '?',
              children: [],
            } as TaskTemplateNode)
          )
        )
    );
    forkJoin(reqs).subscribe({
      next: (trees) => {
        this.planningRoots = valid.map((it, i) => ({
          sortOrder: it.sortOrder,
          planItemId: it.id,
          task: this.normalizeTaskTree(trees[i]),
        }));
        this.planningTreesLoading = false;
        this.selectedPlanningTask = this.planningRoots[0]?.task ?? null;
      },
      error: () => {
        this.planningTreesLoading = false;
        this.planningRoots = [];
      },
    });
  }

  onPlanningTaskSelect(t: TaskTemplateNode): void {
    this.selectedPlanningTask = t;
  }

  private loadRelated(): void {
    if (this.groupId == null) return;
    const id = this.groupId;
    forkJoin({
      pilgrims: this.http.get<Pilgrim[]>(this.api.groups.pilgrims(id)).pipe(catchError(() => of([]))),
      companions: this.http
        .get<{ content: CompanionOption[] }>(`${this.api.users.list}?page=1&size=500&role=PILGRIM_COMPANION`)
        .pipe(catchError(() => of({ content: [] }))),
      flights: this.http.get<Flight[]>(this.api.groups.flights(id)).pipe(catchError(() => of([]))),
      buses: this.http.get<Bus[]>(this.api.groups.buses(id)).pipe(catchError(() => of([]))),
      hotels: this.http.get<GroupHotel[]>(this.api.hotels.byGroup(id)).pipe(catchError(() => of([]))),
      tripCosts: this.http.get<TripCostItem[]>(this.api.tripCosts.list(id)).pipe(catchError(() => of([]))),
      payments: this.http
        .get<PageResponse<Payment>>(`${this.api.payments.list}?page=1&size=500`)
        .pipe(catchError(() => of({ content: [], totalElements: 0 }))),
      documents: this.http
        .get<PageResponse<GroupDocument>>(`${this.api.documents.list}?page=1&size=500`)
        .pipe(catchError(() => of({ content: [], totalElements: 0 }))),
    }).subscribe({
      next: (r) => {
        this.pilgrims = r.pilgrims || [];
        this.companionOptions = r.companions.content ?? [];
        this.flights = r.flights || [];
        this.groupBuses = r.buses || [];
        this.groupHotels = r.hotels || [];
        this.tripCosts = r.tripCosts || [];
        this.groupPayments = (r.payments.content || []).filter((p) => p.groupId === id);
        this.groupDocuments = (r.documents.content || []).filter(
          (d) => d.groupId != null && d.groupId === id
        );
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.notif.error('Erreur lors du chargement des données du groupe');
      },
    });
  }

  get paymentsReceivedTotal(): number {
    return this.groupPayments
      .filter((p) => p.status === 'PAID')
      .reduce((s, p) => s + (Number(p.amount) || 0), 0);
  }

  get paymentsCurrency(): string {
    return this.groupPayments.find((p) => p.currency)?.currency || 'MAD';
  }

  get pendingVisasCount(): number {
    return this.pilgrims.filter((p) => (p.visaStatus || '') !== 'APPROVED').length;
  }

  get filteredPilgrimsTable(): Pilgrim[] {
    const q = this.pilgrimSearch.trim().toLowerCase();
    if (!q) return this.pilgrims;
    return this.pilgrims.filter((p) => {
      const name = `${p.firstName} ${p.lastName}`.toLowerCase();
      const pass = (p.passportNumber || '').toLowerCase();
      const phone = (p.phone || '').toLowerCase();
      return name.includes(q) || pass.includes(q) || phone.includes(q);
    });
  }

  get pilgrimTableRows(): Pilgrim[] {
    const rows = this.filteredPilgrimsTable;
    const start = this.pilgrimPageIndex * this.pilgrimPageSize;
    return rows.slice(start, start + this.pilgrimPageSize);
  }

  get pilgrimTableTotal(): number {
    return this.filteredPilgrimsTable.length;
  }

  onPilgrimSearchChange(): void {
    this.pilgrimPageIndex = 0;
  }

  onPilgrimPage(e: PageEvent): void {
    this.pilgrimPageIndex = e.pageIndex;
    this.pilgrimPageSize = e.pageSize;
  }

  toggleAddPilgrim(): void {
    this.showAddPilgrim = !this.showAddPilgrim;
    if (!this.showAddPilgrim) {
      this.pilgrimSearchInput = '';
      this.selectedPilgrimId = null;
    } else if (this.allPilgrims.length === 0 && !this.loadingPilgrims) {
      this.loadingPilgrims = true;
      this.http.get<{ content: Pilgrim[] }>(`${this.api.pilgrims.list}?page=1&size=300`).subscribe({
        next: (r) => {
          this.allPilgrims = (r.content || []).filter((p) => !this.pilgrims.some((g) => g.id === p.id));
          this.loadingPilgrims = false;
        },
        error: () => {
          this.notif.error('Impossible de charger les pèlerins');
          this.loadingPilgrims = false;
        },
      });
    }
  }

  get filteredPilgrims(): Pilgrim[] {
    const q = this.pilgrimSearchInput.trim().toLowerCase();
    if (!q) return this.allPilgrims;
    return this.allPilgrims.filter((p) =>
      `${p.firstName} ${p.lastName}`.toLowerCase().includes(q)
    );
  }

  selectPilgrim(p: Pilgrim): void {
    this.selectedPilgrimId = p.id;
    this.pilgrimSearchInput = `${p.firstName} ${p.lastName}`;
  }

  addPilgrim(): void {
    if (this.groupId == null || this.selectedPilgrimId == null) return;
    this.addingPilgrim = true;
    this.http
      .post(this.api.groups.addPilgrim(this.groupId), { pilgrimId: this.selectedPilgrimId }, { responseType: 'text' })
      .subscribe({
        next: () => {
          this.notif.success('Pèlerin ajouté au groupe');
          this.showAddPilgrim = false;
          this.selectedPilgrimId = null;
          this.pilgrimSearchInput = '';
          this.addingPilgrim = false;
          this.loadRelated();
        },
        error: (err) => {
          this.addingPilgrim = false;
          this.notif.error(err.error?.message || 'Erreur');
        },
      });
  }

  removePilgrim(pilgrimId: number): void {
    if (this.groupId == null) return;
    if (!confirm('Retirer ce pèlerin du groupe ?')) return;
    this.http.delete(this.api.groups.removePilgrim(this.groupId, pilgrimId)).subscribe({
      next: () => {
        this.notif.success('Pèlerin retiré');
        this.loadRelated();
      },
      error: (err) => this.notif.error(err.error?.message || 'Erreur'),
    });
  }

  toggleAssignHotel(): void {
    this.showAssignHotel = !this.showAssignHotel;
    if (this.showAssignHotel && this.allHotels.length === 0) {
      this.http.get<Hotel[]>(this.api.hotels.list).subscribe({
        next: (h) => (this.allHotels = h || []),
        error: () => this.notif.error('Impossible de charger les hôtels'),
      });
    }
  }

  assignHotel(): void {
    if (this.groupId == null || this.assignHotelForm.hotelId == null) {
      this.notif.error('Sélectionnez un hôtel');
      return;
    }
    this.assigningHotel = true;
    const body = {
      groupId: this.groupId,
      hotelId: this.assignHotelForm.hotelId,
      checkIn: toIsoDateString(this.assignHotelForm.checkIn),
      checkOut: toIsoDateString(this.assignHotelForm.checkOut),
      city: this.assignHotelForm.city || undefined,
      roomType: this.assignHotelForm.roomType || undefined,
    };
    this.http.post<GroupHotel>(this.api.hotels.assignGroup, body).subscribe({
      next: () => {
        this.notif.success('Hôtel assigné');
        this.showAssignHotel = false;
        this.assignHotelForm = {
          hotelId: null,
          checkIn: null,
          checkOut: null,
          city: 'MAKKAH',
          roomType: '',
        };
        this.assigningHotel = false;
        this.loadRelated();
      },
      error: (err) => {
        this.assigningHotel = false;
        this.notif.error(err.error?.message || 'Erreur');
      },
    });
  }

  toggleAddCost(): void {
    this.showAddCost = !this.showAddCost;
  }

  addCost(): void {
    if (this.groupId == null) return;
    const amount = parseFloat(this.costForm.amount);
    if (isNaN(amount) || amount <= 0) {
      this.notif.error('Montant invalide');
      return;
    }
    this.addingCost = true;
    const body = {
      type: this.costForm.type,
      amount,
      currency: this.costForm.currency || 'MAD',
      description: this.costForm.description || undefined,
    };
    this.http.post(this.api.tripCosts.create(this.groupId), body).subscribe({
      next: () => {
        this.notif.success('Coût ajouté');
        this.showAddCost = false;
        this.costForm = { type: 'FLIGHT', amount: '', currency: 'MAD', description: '' };
        this.addingCost = false;
        this.loadRelated();
      },
      error: (err) => {
        this.addingCost = false;
        this.notif.error(err.error?.message || 'Erreur');
      },
    });
  }

  toggleLinkFlight(): void {
    this.showLinkFlight = !this.showLinkFlight;
    if (this.showLinkFlight && this.allFlights.length === 0) {
      this.http.get<{ content: Flight[] }>(`${this.api.flights.list}?page=1&size=200`).subscribe({
        next: (r) => (this.allFlights = r.content || []),
        error: () => this.notif.error('Impossible de charger les vols'),
      });
    }
  }

  linkFlight(): void {
    if (this.groupId == null || this.selectedFlightId == null) return;
    this.linkingFlight = true;
    this.http.put(this.api.flights.byId(this.selectedFlightId), { groupId: this.groupId }).subscribe({
      next: () => {
        this.notif.success('Vol lié au groupe');
        this.showLinkFlight = false;
        this.selectedFlightId = null;
        this.linkingFlight = false;
        this.loadRelated();
      },
      error: (err) => {
        this.linkingFlight = false;
        this.notif.error(err.error?.message || 'Erreur');
      },
    });
  }

  toggleLinkBus(): void {
    this.showLinkBus = !this.showLinkBus;
    if (this.showLinkBus && this.allBuses.length === 0) {
      this.http.get<{ content: Bus[] }>(`${this.api.buses.list}?page=0&size=200`).subscribe({
        next: (r) => (this.allBuses = r.content || []),
        error: () => this.notif.error('Impossible de charger les bus'),
      });
    }
  }

  linkBus(): void {
    if (this.groupId == null || this.selectedBusId == null) return;
    this.linkingBus = true;
    this.http
      .post(this.api.buses.assignGroup, { groupId: this.groupId, busId: this.selectedBusId }, { responseType: 'text' })
      .subscribe({
        next: () => {
          this.notif.success('Bus lié au groupe');
          this.showLinkBus = false;
          this.selectedBusId = null;
          this.linkingBus = false;
          this.loadRelated();
        },
        error: (err) => {
          this.linkingBus = false;
          this.notif.error(err.error?.message || 'Erreur');
        },
      });
  }

  saveCompanions(): void {
    if (this.groupId == null || this.group == null) return;
    this.savingCompanions = true;
    const body = {
      name: this.group.name,
      description: this.group.description,
      departureDate: this.group.departureDate,
      returnDate: this.group.returnDate,
      maxCapacity: this.group.maxCapacity,
      price: this.group.price,
      planningId: this.group.planningId,
      status: this.group.status,
      companionIds: this.selectedCompanionIds,
    };
    this.http.put<Group>(this.api.groups.byId(this.groupId), body).subscribe({
      next: (g) => {
        this.group = g;
        this.selectedCompanionIds = Array.isArray(g.companionIds) ? [...g.companionIds] : [];
        this.savingCompanions = false;
        this.notif.success('Accompagnateurs mis à jour');
      },
      error: (err) => {
        this.savingCompanions = false;
        this.notif.error(err.error?.message || 'Erreur');
      },
    });
  }

  getCostTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      FLIGHT: 'Vol',
      HOTEL: 'Hôtel',
      VISA: 'Visa',
      TRANSPORT: 'Transport',
      MEALS: 'Repas',
      OTHER: 'Autre',
    };
    return labels[type] ?? type;
  }

  visaLabel(status?: string): string {
    if (!status) return '—';
    const labels: Record<string, string> = {
      PENDING: 'En attente',
      SUBMITTED: 'Soumis',
      APPROVED: 'Approuvé',
      REJECTED: 'Refusé',
    };
    return labels[status] ?? status;
  }

  visaClass(status?: string): string {
    const s = status || '';
    if (s === 'APPROVED') return 'visa-pill--ok';
    if (s === 'REJECTED') return 'visa-pill--bad';
    if (s === 'SUBMITTED') return 'visa-pill--warn';
    return 'visa-pill--muted';
  }

  paymentStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      PENDING: 'En attente',
      PAID: 'Payé',
      PARTIAL: 'Partiel',
      REFUNDED: 'Remboursé',
    };
    return labels[status] ?? status;
  }

  documentTypeLabel(t?: string): string {
    return t || '—';
  }
}
