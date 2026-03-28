import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ApiService } from './api.service';

export type UiLang = 'fr' | 'ar';

const STORAGE_KEY = 'omra_lang';

/** Textes de secours si l’API des traductions est indisponible ou clé absente (FR). */
const FALLBACK_FR: Record<string, string> = {
  'login.title': 'Connexion',
  'login.submit': 'Se connecter',
  'nav.dashboard': 'Dashboard',
  'layout.settings': 'Paramètres',
  'layout.logout': 'Déconnexion',
  'common.save': 'Enregistrer',
  'common.cancel': 'Annuler',
  'common.loading': 'Chargement…',
  'common.edit': 'Modifier',
  'common.delete': 'Supprimer',
  'common.errorGeneric': 'Une erreur est survenue.',
  'common.emDash': '—',
  'settings.title': 'Paramètres',
  'settings.language': 'Langue de l’interface',
  /* Documents pèlerin (dialog + panneau) — évite l’affichage des clés brutes */
  'pilgrims.col.documents': 'Documents',
  'pilgrims.documents.dialogTitle': 'Documents du pèlerin',
  'pilgrims.documents.dialogEyebrow': 'Dossier',
  'pilgrims.documents.close': 'Fermer',
  'pilgrims.documents.openDialog': 'Voir les documents et pièces jointes',
  'pilgrims.documents.history': 'Historique des documents',
  'pilgrims.documents.addButton': 'Ajouter un document',
  'pilgrims.documents.formSection': 'Nouveau document',
  'pilgrims.documents.chooseType': 'Type',
  'pilgrims.documents.statusLabel': 'Statut du document',
  'pilgrims.documents.browse': 'Choisir un fichier',
  'pilgrims.documents.uploading': 'Envoi…',
  'pilgrims.documents.formHint':
    'Choisissez le type et le statut, puis sélectionnez un fichier pour l’envoyer.',
  'pilgrims.documents.empty': 'Aucun document pour ce pèlerin.',
  'pilgrims.documents.col.type': 'Type',
  'pilgrims.documents.col.status': 'Statut',
  'pilgrims.documents.col.date': 'Date',
  'pilgrims.documents.download': 'Télécharger',
  'pilgrims.documents.open': 'Ouvrir',
  'pilgrims.documents.delete': 'Supprimer',
  'pilgrims.documents.deleteConfirm': 'Supprimer ce document ?',
  'pilgrims.form.documentsHint':
    'Après la création, vous serez redirigé pour joindre passeports, visas et autres pièces.',
  'pilgrims.form.uploadZoneTitle': 'Pièces jointes & documents',
  'pilgrims.form.uploadZoneDesc':
    'Les fichiers sont liés au dossier du pèlerin : ajoutez-les ci-dessous, ils seront envoyés automatiquement dès que vous aurez cliqué sur « Créer le pèlerin ».',
  'pilgrims.form.pendingQueueTitle': 'Fichiers prêts à l’envoi',
  'pilgrims.form.pendingQueueEmpty': 'Aucun fichier pour l’instant — choisissez le type, le statut, puis un fichier.',
  'pilgrims.form.documentsQueuedUploaded': 'Pièces jointes envoyées.',
  'pilgrims.form.documentsQueuedPartialFail':
    'Pèlerin créé, mais l’envoi d’au moins une pièce a échoué. Vous pouvez les ajouter depuis cette fiche.',
  'pilgrims.sponsorship.sectionTitle': 'Parrainage',
  'pilgrims.sponsorship.lead':
    'Indiquez qui oriente ce pèlerin. Si le parrain est un autre pèlerin enregistré, des points seront crédités sur son dossier.',
  'pilgrims.sponsorship.typeLabel': 'Type de parrain',
  'pilgrims.sponsorship.typeNone': '— Non renseigné —',
  'pilgrims.sponsorship.typePilgrim': 'Pèlerin',
  'pilgrims.sponsorship.typeAgent': 'Agent',
  'pilgrims.sponsorship.labelField': 'Parrainé par (libellé)',
  'pilgrims.sponsorship.labelPlaceholder': 'Ex. Foulen, équipe commerciale…',
  'pilgrims.sponsorship.searchPilgrim': 'Pèlerin parrain',
  'pilgrims.sponsorship.searchPh': 'Nom ou n° de passeport…',
  'pilgrims.sponsorship.searchHint':
    'Saisissez au moins 2 caractères. Les points de parrainage sont attribués uniquement si vous sélectionnez un pèlerin existant.',
  'pilgrims.sponsorship.errorSelectReferrer':
    'Sélectionnez un pèlerin dans la liste ou choisissez un autre type de parrain.',
  'pilgrims.sponsorship.readOnlyHint': 'Ces informations sont figées après la création.',
  'pilgrims.sponsorship.referrerName': 'Pèlerin parrain',
  'pilgrims.sponsorship.points': 'Points parrainage',
  'pilgrims.sponsorship.nextReward': 'Prochain palier : {{pts}} points',
  'pilgrims.col.referralPoints': 'Points',
  'referral.pageTitle': 'Parrainage',
  'referral.pageSubtitle':
    'Paliers de cadeaux, jeux à durée limitée (premiers parrains gagnants), et suivi du jeu actif.',
  'referral.tabPilgrims': 'Programme pèlerins',
  'referral.tabUsers': 'Compte utilisateur',
  'referral.pointsHeroTitle': 'Comment gagner des points ?',
  'referral.pointsRule':
    'Chaque fois qu’un nouveau pèlerin est enregistré avec un parrain de type « Pèlerin », le parrain reçoit {{n}} point(s).',
  'referral.pointsHeroSub':
    'Les paliers ci-dessous définissent les cadeaux offerts lorsque le cumul de points atteint le seuil indiqué.',
  'referral.pointsUnit': 'pts / filleul',
  'referral.userTabIntro':
    'Partagez votre code ou lien pour inviter des personnes à créer un compte sur la plateforme (hors filleuls pèlerins).',
  'referral.userCodeTitle': 'Votre code et lien',
  'referral.copyCode': 'Copier le code',
  'referral.copyLink': 'Copier le lien',
  'referral.linkField': 'Lien de parrainage',
  'referral.userHint': 'Les inscriptions via ce lien sont associées à votre compte pour le suivi des parrainages.',
  'referral.userStatsTitle': 'Statistiques',
  'referral.statTotal': 'Total',
  'referral.statPending': 'En attente',
  'referral.statCompleted': 'Complétés',
  'referral.statRewards': 'Récompenses',
  'referral.userListTitle': 'Filleuls (comptes)',
  'referral.userListEmpty': 'Aucun filleul pour le moment.',
  'referral.rewardGranted': 'Récompense déjà attribuée',
  'referral.grantReward': 'Attribuer la récompense',
  'referral.loadError': 'Impossible de charger le parrainage.',
  'referral.tiersLoadError': 'Impossible de charger les paliers.',
  'referral.notifCodeCopied': 'Code copié',
  'referral.notifLinkCopied': 'Lien copié',
  'referral.notifRewardGranted': 'Récompense attribuée',
  'referral.notifTierSaved': 'Palier modifié',
  'referral.notifTierCreated': 'Palier créé',
  'referral.notifTierDeleted': 'Palier supprimé',
  'referral.confirmDeleteTier': 'Supprimer ce palier ?',
  'referral.statusCompleted': 'Complété',
  'referral.statusPending': 'En attente',
  'referral.tiers.introTitle': 'Fidélité pèlerins',
  'referral.tiers.introBody':
    'Définissez des paliers (seuil de points + cadeau). Pour chaque jeu, vous assignez un palier par rang (1er, 2e, 3e…) : le prochain gagnant doit atteindre le seuil du palier de son rang. Hors période ou une fois les places prises, le jeu se ferme jusqu’au prochain.',
  'referral.tiers.addTitle': 'Nouveau palier',
  'referral.tiers.editTitle': 'Modifier le palier',
  'referral.tiers.points': 'Seuil de points',
  'referral.tiers.sort': 'Ordre d’affichage',
  'referral.tiers.giftTitle': 'Cadeau / titre',
  'referral.tiers.giftDesc': 'Description (optionnel)',
  'referral.tiers.create': 'Ajouter le palier',
  'referral.tiers.tableTitle': 'Paliers configurés',
  'referral.tiers.empty': 'Aucun palier pour le moment. Ajoutez un premier seuil pour motiver les parrains.',
  'referral.tiers.colPoints': 'Points',
  'referral.tiers.colGift': 'Cadeau',
  'referral.tiers.colDesc': 'Description',
  'referral.campaign.title': 'Jeu de parrainage (fenêtre temporelle)',
  'referral.campaign.refresh': 'Actualiser',
  'referral.campaign.lead':
    'Indique si un jeu est actif, s’il est ouvert dans le temps, et liste les gagnants. La fin de période ou le nombre max de gagnants ferme automatiquement le jeu.',
  'referral.campaign.phaseIdle': 'Aucun jeu actif — vous pouvez en créer un ci-dessous.',
  'referral.campaign.phaseUpcoming': 'Jeu programmé — la période n’a pas encore commencé.',
  'referral.campaign.phaseLive': 'Jeu ouvert — les parrains peuvent encore gagner des places.',
  'referral.campaign.phaseEndedTime': 'Jeu terminé — la période est écoulée.',
  'referral.campaign.phaseEndedFull': 'Jeu terminé — toutes les places gagnantes sont attribuées.',
  'referral.campaign.winnersYes': '{{count}} gagnant(s) sur {{max}} place(s).',
  'referral.campaign.winnersNo': 'Aucun gagnant pour l’instant (0 / {{max}} place(s)).',
  'referral.campaign.starts': 'Début',
  'referral.campaign.ends': 'Fin',
  'referral.campaign.slotsPrizesTitle': 'Cadeau par rang (seuil du palier)',
  'referral.campaign.slots': 'Places / gagnants',
  'referral.campaign.winnersTitle': 'Gagnants',
  'referral.campaign.noWinnersYet': 'Pas encore de gagnant sur ce jeu.',
  'referral.campaign.closeManual': 'Fermer le jeu maintenant',
  'referral.campaign.closeConfirm': 'Fermer ce jeu ? Les parrains ne pourront plus gagner de place sur cette campagne.',
  'referral.campaign.closed': 'Jeu fermé.',
  'referral.campaign.pts': 'pts',
  'referral.campaign.newTitle': 'Nouveau jeu (création + activation)',
  'referral.campaign.newLead':
    'Choisissez les dates et le nombre de places. Pour chaque rang (1er, 2e, 3e…), choisissez le palier : le parrain doit atteindre le seuil de points de ce palier pour remporter ce cadeau. L’activation ferme tout autre jeu actif pour votre agence.',
  'referral.campaign.fieldTitle': 'Titre (optionnel)',
  'referral.campaign.fieldTitlePh': 'Ex. Semaine 12 — sprint parrainage',
  'referral.campaign.fieldStart': 'Début de la période',
  'referral.campaign.fieldEnd': 'Fin de la période',
  'referral.campaign.fieldRankGift': 'Palier / cadeau — rang {{rank}}',
  'referral.campaign.fieldMaxWinners': 'Nombre de gagnants (rangs / cadeaux)',
  'referral.campaign.slotTiersIncomplete': 'Choisissez un palier pour chaque rang.',
  'referral.campaign.createActivate': 'Créer et activer le jeu',
  'referral.campaign.needTiersFirst': 'Créez au moins un palier de points avant de lancer un jeu.',
  'referral.campaign.invalidDates': 'Dates invalides.',
  'referral.campaign.endBeforeStart': 'La fin doit être après le début.',
  'referral.campaign.activated': 'Jeu créé et activé.',
  'referral.campaign.dashboardError': 'Impossible de charger l’état du jeu.',
  'referral.campaign.historyTitle': 'Historique des jeux',
  'referral.campaign.historyFilterStatus': 'Filtrer par statut',
  'referral.campaign.historyStatusAll': 'Tous',
  'referral.campaign.historyFilterSearch': 'Recherche',
  'referral.campaign.historyFilterSearchPh': 'Titre ou n° du jeu…',
  'referral.campaign.historyFilterClear': 'Réinitialiser les filtres',
  'referral.campaign.historyNoMatch': 'Aucun jeu ne correspond à ces critères.',
  'referral.campaign.hColStatus': 'Statut',
  'referral.campaign.hColTitle': 'Titre',
  'referral.campaign.statusDraft': 'Brouillon',
  'referral.campaign.statusActive': 'Actif',
  'referral.campaign.statusClosed': 'Clôturé',
  'doc.type.PASSPORT': 'Passeport',
  'doc.type.VISA': 'Visa',
  'doc.type.FLIGHT_TICKET': 'Billet avion',
  'doc.type.CONTRACT': 'Contrat',
  'doc.type.PROGRAM': 'Programme',
  'doc.status.UPLOADED': 'Uploadé',
  'doc.status.VERIFIED': 'Vérifié',
  'doc.status.REJECTED': 'Refusé',
  'err.pilgrimDocumentsLoad': 'Erreur lors du chargement des documents',
  'err.documentSave': 'Erreur lors de l’enregistrement du document',
  'err.documentUpload': 'Échec de l’envoi du fichier',
  'err.delete': 'Suppression impossible',
  'err.documentStatusUpdate': 'Impossible de mettre à jour le statut du document',
  'pilgrims.documents.statusUpdated': 'Statut du document mis à jour',
  'pilgrims.documents.changeStatusHint': 'Modifier le statut (uploadé, vérifié, refusé)',
  'pilgrims.documents.uploaded': 'Document ajouté',
  'pilgrims.documents.deleted': 'Document supprimé',
};

@Injectable({ providedIn: 'root' })
export class I18nService {
  private readonly http = inject(HttpClient);
  private readonly api = inject(ApiService);

  private readonly dict = signal<Record<string, string>>({});
  readonly loaded = signal(false);
  readonly currentLang = signal<UiLang>('fr');

  /** Pour alignement futur (dates, nombres). */
  readonly angularLocaleId = computed(() => (this.currentLang() === 'ar' ? 'ar' : 'fr-FR'));

  async initialize(): Promise<void> {
    const stored = localStorage.getItem(STORAGE_KEY) as UiLang | null;
    const lang: UiLang = stored === 'ar' ? 'ar' : 'fr';
    this.currentLang.set(lang);
    await this.loadLocale(lang, true);
  }

  async loadLocale(lang: UiLang, isInitial = false): Promise<void> {
    try {
      const map = await firstValueFrom(
        this.http.get<Record<string, string>>(this.api.i18n.translations(lang))
      );
      this.dict.set(map && typeof map === 'object' ? map : {});
    } catch {
      this.dict.set(isInitial && lang === 'fr' ? { ...FALLBACK_FR } : {});
    }
    this.applyDocumentLang(lang);
    this.loaded.set(true);
  }

  setLanguage(lang: UiLang): void {
    localStorage.setItem(STORAGE_KEY, lang);
    this.currentLang.set(lang);
    void this.loadLocale(lang, false);
  }

  instant(key: string, params?: Record<string, string | number>): string {
    let s = this.dict()[key];
    if (s == null || s === '') {
      s = FALLBACK_FR[key] ?? key;
    }
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        s = s.split(`{{${k}}}`).join(String(v));
      }
    }
    return s;
  }

  private applyDocumentLang(lang: UiLang): void {
    if (typeof document === 'undefined') return;
    document.documentElement.lang = lang === 'ar' ? 'ar' : 'fr';
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  }
}
