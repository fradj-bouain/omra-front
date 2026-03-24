import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

/**
 * Redirects /register?ref=CODE to /users/new?ref=CODE (preserves query params).
 * Used so referral links https://app.com/register?ref=CODE work.
 */
@Component({
  selector: 'app-register-redirect',
  standalone: true,
  template: '<p>Redirection…</p>',
  styles: ['p { margin: 2rem; color: var(--app-text-soft, #64748b); }'],
})
export class RegisterRedirectComponent implements OnInit {
  constructor(private router: Router, private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.router.navigate(['/users/new'], {
      queryParams: this.route.snapshot.queryParams,
      replaceUrl: true,
    });
  }
}
