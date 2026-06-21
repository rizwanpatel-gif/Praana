import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../../core/services/auth.service';

const DEMO_EMAIL = 'demo@gmail.com';
const DEMO_PASSWORD = 'Demo@123';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, MatIconModule, MatProgressSpinnerModule],
  template: `
    <div class="auth-bg">
      <div class="auth-card">
        <div class="text-center mb-8">
          <div class="logo-icon">
            <mat-icon class="!text-3xl !w-8 !h-8 text-pink-600">favorite</mat-icon>
          </div>
          <h1 class="text-2xl font-bold text-gray-900 mt-4">Welcome back</h1>
          <p class="text-sm text-gray-500 mt-1">Sign in to Praana</p>
        </div>

        <!-- Demo credentials banner -->
        <div class="demo-banner">
          <div class="demo-banner-header">
            <span class="demo-title">Demo Account</span>
            <button type="button" class="demo-fill-btn" (click)="fillDemo()">Auto-fill</button>
          </div>
          <div class="demo-row">
            <span class="demo-label">Email</span>
            <span class="demo-value">{{ demoEmail }}</span>
            <button type="button" class="copy-btn" (click)="copy('email')" [attr.aria-label]="'Copy email'">
              <mat-icon class="copy-icon">{{ copied() === 'email' ? 'check' : 'content_copy' }}</mat-icon>
            </button>
          </div>
          <div class="demo-row">
            <span class="demo-label">Password</span>
            <span class="demo-value">{{ demoPassword }}</span>
            <button type="button" class="copy-btn" (click)="copy('password')" [attr.aria-label]="'Copy password'">
              <mat-icon class="copy-icon">{{ copied() === 'password' ? 'check' : 'content_copy' }}</mat-icon>
            </button>
          </div>
        </div>

        @if (error()) {
          <div class="alert-error">
            <mat-icon class="!text-base flex-shrink-0">error_outline</mat-icon>
            <span>{{ error() }}</span>
          </div>
        }

        <form (ngSubmit)="onLogin()" class="flex flex-col gap-5">
          <div class="form-group">
            <label class="form-label">Email</label>
            <input class="form-input" type="email" [(ngModel)]="email" name="email" required>
          </div>

          <div class="form-group">
            <label class="form-label">Password</label>
            <div class="input-wrap">
              <input class="form-input" [type]="showPwd ? 'text' : 'password'" [(ngModel)]="password" name="password" required>
              <button type="button" class="input-suffix-btn" (click)="showPwd = !showPwd">
                <mat-icon class="!text-lg">{{ showPwd ? 'visibility_off' : 'visibility' }}</mat-icon>
              </button>
            </div>
          </div>

          <button type="submit" [disabled]="loading()" class="auth-btn">
            @if (loading()) {
              <mat-spinner diameter="20"></mat-spinner>
            } @else {
              Sign In
            }
          </button>
        </form>

        <div class="flex justify-between items-center mt-7 pt-6 border-t border-gray-100">
          <a routerLink="/auth/signup" class="auth-link">Create account</a>
          <a routerLink="/auth/invite" class="auth-link">Have an invite?</a>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .auth-bg {
      min-height: 100vh;
      display: flex; align-items: center; justify-content: center;
      background: #f7f8fa; padding: 16px;
    }
    .auth-card {
      width: 100%; max-width: 400px;
      background: #ffffff;
      border: 1px solid #e5e7eb;
      border-radius: 12px;
      padding: 36px 32px;
      box-shadow: 0 4px 24px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04);
    }
    @media (max-width: 480px) {
      .auth-card { padding: 28px 20px; }
    }
    .logo-icon {
      width: 56px; height: 56px; border-radius: 10px;
      background: #fce7f3; border: 1px solid #fbcfe8;
      display: inline-flex; align-items: center; justify-content: center;
    }

    /* Demo banner */
    .demo-banner {
      background: #fdf2f8;
      border: 1px solid #fbcfe8;
      border-radius: 10px;
      padding: 12px 14px;
      margin-bottom: 16px;
      display: flex; flex-direction: column; gap: 8px;
    }
    .demo-banner-header {
      display: flex; align-items: center; gap: 6px;
      margin-bottom: 2px;
    }
    .demo-icon {
      font-size: 16px !important; width: 16px !important; height: 16px !important;
      color: #db2777;
    }
    .demo-title {
      font-size: 12px; font-weight: 700; color: #be185d;
      text-transform: uppercase; letter-spacing: 0.04em; flex: 1;
    }
    .demo-fill-btn {
      font-size: 11px; font-weight: 600; color: #db2777;
      background: #fce7f3; border: 1px solid #f9a8d4;
      border-radius: 5px; padding: 3px 9px;
      cursor: pointer; font-family: inherit;
      white-space: nowrap;
      &:hover { background: #fbcfe8; }
    }
    .demo-row {
      display: flex; align-items: center; gap: 8px;
      background: #fff; border: 1px solid #fce7f3;
      border-radius: 7px; padding: 7px 10px;
      min-width: 0;
    }
    .demo-label {
      font-size: 11px; color: #9ca3af; font-weight: 500;
      min-width: 52px; flex-shrink: 0;
    }
    .demo-value {
      font-size: 13px; color: #111827; font-weight: 600;
      font-family: 'Courier New', monospace;
      flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
    }
    .copy-btn {
      background: none; border: none; cursor: pointer;
      padding: 2px; border-radius: 4px; display: flex;
      color: #f9a8d4; flex-shrink: 0;
      &:hover { background: #fce7f3; color: #db2777; }
    }
    .copy-icon {
      font-size: 15px !important; width: 15px !important; height: 15px !important;
    }

    .alert-error {
      background: #fff1f2; color: #b91c1c; padding: 10px 14px;
      border-radius: 8px; font-size: 13px; margin-bottom: 8px;
      display: flex; align-items: center; gap: 8px; border: 1px solid #fecaca;
    }
    .auth-btn {
      width: 100%; height: 44px;
      background: #db2777; color: #ffffff;
      border: none; border-radius: 8px;
      font-size: 14px; font-weight: 600;
      font-family: inherit; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      &:hover:not(:disabled) { background: #be185d; }
      &:disabled { opacity: 0.6; cursor: not-allowed; }
    }
    .auth-link {
      font-size: 13px; color: #db2777;
      text-decoration: none; font-weight: 500;
      &:hover { color: #be185d; }
    }
  `]
})
export class LoginComponent {
  email = '';
  password = '';
  showPwd = false;
  loading = signal(false);
  error = signal('');
  copied = signal<'email' | 'password' | null>(null);

  readonly demoEmail = DEMO_EMAIL;
  readonly demoPassword = DEMO_PASSWORD;

  constructor(private auth: AuthService, private router: Router) {}

  fillDemo() {
    this.email = DEMO_EMAIL;
    this.password = DEMO_PASSWORD;
  }

  copy(field: 'email' | 'password') {
    const text = field === 'email' ? DEMO_EMAIL : DEMO_PASSWORD;
    navigator.clipboard.writeText(text).then(() => {
      this.copied.set(field);
      setTimeout(() => this.copied.set(null), 1500);
    });
  }

  onLogin() {
    this.loading.set(true);
    this.error.set('');
    this.auth.login(this.email, this.password).subscribe({
      next: (res) => {
        if (res.success) {
          this.router.navigate(['/dashboard']);
        } else {
          this.error.set(res.error || 'Login failed');
        }
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.error?.error || 'Login failed');
        this.loading.set(false);
      }
    });
  }
}
