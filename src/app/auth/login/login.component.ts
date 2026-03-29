import { Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { finalize, switchMap } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { ThemeService } from '../../core/services/theme.service';
import { NotificationService } from '../../core/services/notification.service';
import { I18nService, type UiLang } from '../../core/services/i18n.service';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    TranslatePipe,
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent implements OnInit {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private theme = inject(ThemeService);
  private router = inject(Router);
  private notif = inject(NotificationService);
  readonly i18n = inject(I18nService);

  loading = false;
  /** Message après déconnexion forcée (abonnement / agence). */
  readonly sessionNotice = signal<{ message: string; code: string } | null>(null);

  form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  ngOnInit(): void {
    const raw = sessionStorage.getItem('omra_auth_notice');
    if (raw) {
      try {
        const o = JSON.parse(raw) as { message?: string; code?: string };
        if (o && (o.message || o.code)) {
          this.sessionNotice.set({
            message: (o.message ?? '').trim(),
            code: o.code ?? 'SUBSCRIPTION_INACTIVE',
          });
        }
      } catch {
        /* ignore */
      }
      sessionStorage.removeItem('omra_auth_notice');
    }
  }

  dismissSessionNotice(): void {
    this.sessionNotice.set(null);
  }

  sessionNoticeBody(): string {
    const n = this.sessionNotice();
    if (!n) return '';
    if (n.message) return n.message;
    return n.code === 'AGENCY_SUSPENDED'
      ? this.i18n.instant('login.sessionAgency')
      : this.i18n.instant('login.sessionSubscription');
  }

  setLang(lang: UiLang): void {
    this.i18n.setLanguage(lang);
  }

  onSubmit(): void {
    if (this.form.invalid || this.loading) return;
    this.loading = true;
    const { email, password } = this.form.getRawValue();
    this.auth
      .login(email, password)
      .pipe(
        switchMap(() => this.theme.loadTheme$()),
        finalize(() => {
          this.loading = false;
        })
      )
      .subscribe({
        next: () => this.router.navigate(['/dashboard']),
        error: (err) => {
          this.notif.error(err.error?.message || this.i18n.instant('login.error.badCredentials'));
        },
      });
  }
}
