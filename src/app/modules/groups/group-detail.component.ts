import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { DecimalPipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { NotificationService } from '../../core/services/notification.service';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';

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
  items?: { taskTemplateName: string; durationMinutes?: number; sortOrder: number }[];
}

interface Pilgrim {
  id: number;
  firstName: string;
  lastName: string;
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

@Component({
  selector: 'app-group-detail',
  standalone: true,
  imports: [
    RouterLink,
    DecimalPipe,
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
    PageHeaderComponent,
  ],
  templateUrl: './group-detail.component.html',
  styleUrl: './group-detail.component.scss',
})
export class GroupDetailComponent implements OnInit {
  groupId: number | null = null;
  group: Group | null = null;
  planning: PlanningSummary | null = null;
  pilgrims: Pilgrim[] = [];
  flights: Flight[] = [];
  groupBuses: Bus[] = [];
  groupHotels: GroupHotel[] = [];
  tripCosts: TripCostItem[] = [];
  loading = true;
  error: string | null = null;

  // Add pilgrim
  allPilgrims: Pilgrim[] = [];
  loadingPilgrims = false;
  showAddPilgrim = false;
  selectedPilgrimId: number | null = null;
  pilgrimSearchInput = '';
  addingPilgrim = false;

  // Assign hotel
  allHotels: Hotel[] = [];
  showAssignHotel = false;
  assignHotelForm = { hotelId: null as number | null, checkIn: '', checkOut: '', city: 'MAKKAH' as string, roomType: '' };
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

  // Companions (PILGRIM_COMPANION users)
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
        if (g.planningId) {
          this.http.get<PlanningSummary>(this.api.plannings.byId(g.planningId)).subscribe({
            next: (p) => (this.planning = p),
            error: () => {},
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

  private loadRelated(): void {
    if (this.groupId == null) return;
    const id = this.groupId;
    let done = 0;
    const check = () => {
      done++;
      if (done === 6) this.loading = false;
    };
    this.http.get<Pilgrim[]>(this.api.groups.pilgrims(id)).subscribe({ next: (p) => (this.pilgrims = p || []), error: () => {}, complete: check });
    this.http.get<{ content: CompanionOption[] }>(`${this.api.users.list}?page=1&size=500&role=PILGRIM_COMPANION`).subscribe({
      next: (r) => (this.companionOptions = r.content ?? []),
      error: () => (this.companionOptions = []),
      complete: check,
    });
    this.http.get<Flight[]>(this.api.groups.flights(id)).subscribe({ next: (f) => (this.flights = f || []), error: () => {}, complete: check });
    this.http.get<Bus[]>(this.api.groups.buses(id)).subscribe({ next: (b) => (this.groupBuses = b || []), error: () => {}, complete: check });
    this.http.get<GroupHotel[]>(this.api.hotels.byGroup(id)).subscribe({ next: (h) => (this.groupHotels = h || []), error: () => {}, complete: check });
    this.http.get<TripCostItem[]>(this.api.tripCosts.list(id)).subscribe({ next: (t) => (this.tripCosts = t || []), error: () => {}, complete: check });
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
    this.http.post(this.api.groups.addPilgrim(this.groupId), { pilgrimId: this.selectedPilgrimId }, { responseType: 'text' }).subscribe({
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
      checkIn: this.assignHotelForm.checkIn || undefined,
      checkOut: this.assignHotelForm.checkOut || undefined,
      city: this.assignHotelForm.city || undefined,
      roomType: this.assignHotelForm.roomType || undefined,
    };
    this.http.post<GroupHotel>(this.api.hotels.assignGroup, body).subscribe({
      next: () => {
        this.notif.success('Hôtel assigné');
        this.showAssignHotel = false;
        this.assignHotelForm = { hotelId: null, checkIn: '', checkOut: '', city: 'MAKKAH', roomType: '' };
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
    this.http.post(this.api.buses.assignGroup, { groupId: this.groupId, busId: this.selectedBusId }, { responseType: 'text' }).subscribe({
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

  /** Chart palette — same as design system --chart-1 … --chart-6 */
  private readonly chartColors = ['#0d9488', '#0891b2', '#7c3aed', '#db2777', '#ea580c', '#65a30d'];
  getChartColor(index: number): string {
    return this.chartColors[index % this.chartColors.length];
  }

  /** Cost breakdown by type for bar chart */
  get costChartData(): { type: string; amount: number; currency: string }[] {
    const byType = new Map<string, { amount: number; currency: string }>();
    for (const c of this.tripCosts) {
      const key = c.type;
      const cur = byType.get(key);
      if (cur) {
        cur.amount += c.amount;
      } else {
        byType.set(key, { amount: c.amount, currency: c.currency || 'MAD' });
      }
    }
    return Array.from(byType.entries()).map(([type, v]) => ({ type, amount: v.amount, currency: v.currency }));
  }

  getCostBarPct(amount: number): number {
    if (!this.costChartData.length) return 0;
    const max = Math.max(...this.costChartData.map((x) => x.amount), 1);
    return Math.min(100, (amount / max) * 100);
  }

  /** Capacity fill percentage */
  get capacityPct(): number {
    if (!this.group?.maxCapacity || this.group.maxCapacity <= 0) return 0;
    return Math.min(100, (this.pilgrims.length / this.group.maxCapacity) * 100);
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
}
