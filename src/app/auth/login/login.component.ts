import { Component, inject } from '@angular/core';
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
export class LoginComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private theme = inject(ThemeService);
  private router = inject(Router);
  private notif = inject(NotificationService);
  readonly i18n = inject(I18nService);

  loading = false;
  form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

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
        next: () => this.router.navigate([this.auth.isAdmin() ? '/agencies' : '/dashboard']),
        error: (err) => {
          this.notif.error(err.error?.message || this.i18n.instant('login.error.badCredentials'));
        },
      });
  }
}
