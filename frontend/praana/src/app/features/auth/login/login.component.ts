import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../../core/services/auth.service';

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
      background: #f7f8fa; padding: 20px;
    }
    .auth-card {
      width: 100%; max-width: 400px;
      background: #ffffff;
      border: 1px solid #e5e7eb;
      border-radius: 12px;
      padding: 40px 36px;
      box-shadow: 0 4px 24px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04);
    }
    .logo-icon {
      width: 56px; height: 56px; border-radius: 10px;
      background: #fce7f3; border: 1px solid #fbcfe8;
      display: inline-flex; align-items: center; justify-content: center;
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

  constructor(private auth: AuthService, private router: Router) {}

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
