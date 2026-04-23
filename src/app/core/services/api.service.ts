import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private base = environment.apiUrl;

  /** Traductions UI (public, sans JWT). */
  i18n = {
    translations: (locale: string) =>
      `${this.base}/api/public/translations?locale=${encodeURIComponent(locale)}`,
  };

  auth = {
    login: `${this.base}/api/auth/login`,
    refresh: `${this.base}/api/auth/refresh`,
    logout: `${this.base}/api/auth/logout`,
  };
  agencies = {
    list: `${this.base}/api/agencies`,
    theme: `${this.base}/api/agencies/theme`,
    themeByAgencyId: (id: number) => `${this.base}/api/agencies/${id}/theme`,
    branding: `${this.base}/api/agencies/branding`,
    byId: (id: number) => `${this.base}/api/agencies/${id}`,
    /** Direct sub-agencies of a main agency (single-level hierarchy). */
    subAgencies: (parentId: number) => `${this.base}/api/agencies/${parentId}/subs`,
    subAgencyQuota: (parentId: number) => `${this.base}/api/agencies/${parentId}/sub-agency-quota`,
    deactivateSubAgency: (parentId: number, subId: number) =>
      `${this.base}/api/agencies/${parentId}/subs/${subId}/deactivate`,
  };
  dashboard = {
    stats: `${this.base}/api/dashboard/stats`,
    groupKpis: `${this.base}/api/dashboard/group-kpis`,
    chartData: `${this.base}/api/dashboard/chart-data`,
  };
  pilgrims = {
    list: `${this.base}/api/pilgrims`,
    byId: (id: number) => `${this.base}/api/pilgrims/${id}`,
    autocomplete: `${this.base}/api/pilgrims/autocomplete`,
    familyBatch: `${this.base}/api/pilgrims/family-batch`,
    registrations: `${this.base}/api/pilgrims/registrations`,
    deleteFamily: (familyId: number) => `${this.base}/api/pilgrims/families/${familyId}`,
  };
  pilgrimSponsorship = {
    config: `${this.base}/api/pilgrim-sponsorship/config`,
  };
  groups = {
    list: `${this.base}/api/groups`,
    byId: (id: number) => `${this.base}/api/groups/${id}`,
    pilgrims: (id: number) => `${this.base}/api/groups/${id}/pilgrims`,
    addPilgrim: (id: number) => `${this.base}/api/groups/${id}/pilgrims`,
    removePilgrim: (id: number, pilgrimId: number) => `${this.base}/api/groups/${id}/pilgrims/${pilgrimId}`,
    flights: (id: number) => `${this.base}/api/groups/${id}/flights`,
    buses: (id: number) => `${this.base}/api/groups/${id}/buses`,
  };
  flights = {
    list: `${this.base}/api/flights`,
    byId: (id: number) => `${this.base}/api/flights/${id}`,
    seats: (flightId: number) => `${this.base}/api/flights/${flightId}/seats`,
    seatAssignments: (flightId: number) => `${this.base}/api/flights/${flightId}/seat-assignments`,
  };
  hotels = {
    list: `${this.base}/api/hotels`,
    byId: (id: number) => `${this.base}/api/hotels/${id}`,
    byGroup: (groupId: number) => `${this.base}/api/hotels/groups/${groupId}`,
    assignGroup: `${this.base}/api/hotels/groups`,
    rooms: (hotelId: number) => `${this.base}/api/hotels/${hotelId}/rooms`,
  };
  rooms = {
    byId: (id: number) => `${this.base}/api/rooms/${id}`,
    create: `${this.base}/api/rooms`,
    update: (id: number) => `${this.base}/api/rooms/${id}`,
    delete: (id: number) => `${this.base}/api/rooms/${id}`,
    roomAssignments: (groupHotelId: number) => `${this.base}/api/group-hotels/${groupHotelId}/room-assignments`,
    assign: `${this.base}/api/group-room-assignments`,
  };
  buses = {
    list: `${this.base}/api/buses`,
    byId: (id: number) => `${this.base}/api/buses/${id}`,
    seats: (id: number) => `${this.base}/api/buses/${id}/seats`,
    assignGroup: `${this.base}/api/buses/assign-group`,
  };
  taskTemplates = {
    list: `${this.base}/api/task-templates`,
    tree: `${this.base}/api/task-templates/tree`,
    byId: (id: number) => `${this.base}/api/task-templates/${id}`,
    byIdTree: (id: number) => `${this.base}/api/task-templates/${id}/tree`,
    create: `${this.base}/api/task-templates`,
    update: (id: number) => `${this.base}/api/task-templates/${id}`,
    delete: (id: number) => `${this.base}/api/task-templates/${id}`,
    totalDuration: (id: number) => `${this.base}/api/task-templates/${id}/total-duration`,
  };
  plannings = {
    list: `${this.base}/api/plannings`,
    byId: (id: number) => `${this.base}/api/plannings/${id}`,
    create: `${this.base}/api/plannings`,
    update: (id: number) => `${this.base}/api/plannings/${id}`,
    delete: (id: number) => `${this.base}/api/plannings/${id}`,
  };
  tripCosts = {
    list: (groupId: number) => `${this.base}/api/groups/${groupId}/trip-costs`,
    create: (groupId: number) => `${this.base}/api/groups/${groupId}/trip-costs`,
    update: (groupId: number, id: number) => `${this.base}/api/groups/${groupId}/trip-costs/items/${id}`,
    delete: (groupId: number, id: number) => `${this.base}/api/groups/${groupId}/trip-costs/items/${id}`,
  };
  documents = {
    list: `${this.base}/api/documents`,
    byId: (id: number) => `${this.base}/api/documents/${id}`,
    byPilgrim: (id: number) => `${this.base}/api/documents/pilgrim/${id}`,
    patch: (id: number) => `${this.base}/api/documents/${id}`,
    delete: (id: number) => `${this.base}/api/documents/${id}`,
  };
  payments = {
    list: `${this.base}/api/payments`,
    byId: (id: number) => `${this.base}/api/payments/${id}`,
  };
  notifications = {
    list: `${this.base}/api/notifications`,
    unreadCount: `${this.base}/api/notifications/unread-count`,
    markRead: (id: number) => `${this.base}/api/notifications/${id}/read`,
  };
  users = {
    list: `${this.base}/api/users`,
    byId: (id: number) => `${this.base}/api/users/${id}`,
  };
  referral = {
    code: `${this.base}/api/referral-code`,
    stats: `${this.base}/api/referral-stats`,
    list: `${this.base}/api/referrals`,
    validate: `${this.base}/api/referrals/validate`,
    grantReward: (id: number) => `${this.base}/api/referrals/${id}/grant-reward`,
  };
  referralRewardTiers = {
    list: `${this.base}/api/referral-reward-tiers`,
    update: (id: number) => `${this.base}/api/referral-reward-tiers/${id}`,
    delete: (id: number) => `${this.base}/api/referral-reward-tiers/${id}`,
  };
  referralCampaigns = {
    list: `${this.base}/api/referral-campaigns`,
    dashboard: `${this.base}/api/referral-campaigns/dashboard`,
    activate: (id: number) => `${this.base}/api/referral-campaigns/${id}/activate`,
    close: (id: number) => `${this.base}/api/referral-campaigns/${id}/close`,
  };
  files = { upload: `${this.base}/api/files/upload` };
  /** Abonnement de l’agence connectée (lecture seule, portail agence). */
  meSubscriptions = {
    summary: `${this.base}/api/me/subscriptions/summary`,
    listPage: (page: number, size: number) =>
      `${this.base}/api/me/subscriptions?page=${page}&size=${size}`,
  };
}
