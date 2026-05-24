import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-invite',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, MatIconModule, MatProgressSpinnerModule],
  template: `
    <div class="auth-bg">
      <div class="auth-card">
        <div class="text-center mb-8">
          <div class="logo-icon">
            <mat-icon class="!text-3xl !w-8 !h-8 text-pink-600">group_add</mat-icon>
          </div>
          <h1 class="text-2xl font-bold text-gray-900 mt-4">Join Team</h1>
          <p class="text-sm text-gray-500 mt-1">Accept your invite to Praana</p>
        </div>

        @if (error()) {
          <div class="alert-error">
            <mat-icon class="!text-base flex-shrink-0">error_outline</mat-icon>
            <span>{{ error() }}</span>
          </div>
        }
        @if (success()) {
          <div class="alert-success">
            <mat-icon class="!text-base flex-shrink-0">check_circle</mat-icon>
            <span>Account created! <a routerLink="/auth/login" class="underline font-semibold">Sign in</a></span>
          </div>
        }

        <form (ngSubmit)="onAccept()" class="flex flex-col gap-4">
          <div class="form-group">
            <label class="form-label">Invite Code</label>
            <input class="form-input" type="text" [(ngModel)]="code" name="code" required>
          </div>

          <div class="form-group">
            <label class="form-label">Email</label>
            <input class="form-input" type="email" [(ngModel)]="email" name="email" required>
          </div>

          <div class="form-group">
            <label class="form-label">Your Name</label>
            <input class="form-input" type="text" [(ngModel)]="name" name="name" required>
          </div>

          <div class="form-group">
            <label class="form-label">Password</label>
            <div class="input-wrap">
              <input class="form-input" [type]="showPwd ? 'text' : 'password'" [(ngModel)]="password" name="password" required minlength="8">
              <button type="button" class="input-suffix-btn" (click)="showPwd = !showPwd">
                <mat-icon class="!text-lg">{{ showPwd ? 'visibility_off' : 'visibility' }}</mat-icon>
              </button>
            </div>
          </div>

          <button type="submit" [disabled]="loading()" class="auth-btn mt-1">
            @if (loading()) {
              <mat-spinner diameter="20"></mat-spinner>
            } @else {
              Accept Invite
            }
          </button>
        </form>

        <div class="text-center mt-7 pt-6 border-t border-gray-100">
          <a routerLink="/auth/login" class="auth-link">Back to sign in</a>
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
      padding: 36px 32px;
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
    .alert-success {
      background: #ecfdf5; color: #065f46; padding: 10px 14px;
      border-radius: 8px; font-size: 13px; margin-bottom: 8px;
      display: flex; align-items: center; gap: 8px; border: 1px solid #a7f3d0;
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
export class InviteComponent {
  code = '';
  email = '';
  name = '';
  password = '';
  showPwd = false;
  loading = signal(false);
  error = signal('');
  success = signal(false);

  constructor(private auth: AuthService, private route: ActivatedRoute, private router: Router) {
    this.route.queryParams.subscribe(params => {
      if (params['code']) this.code = params['code'];
      if (params['email']) this.email = params['email'];
    });
  }

  onAccept() {
    this.loading.set(true);
    this.error.set('');
    this.auth.acceptInvite({ code: this.code, email: this.email, password: this.password, name: this.name }).subscribe({
      next: (res) => {
        if (res.success) {
          this.success.set(true);
        } else {
          this.error.set(res.error || 'Failed to accept invite');
        }
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.error?.error || 'Failed to accept invite');
        this.loading.set(false);
      }
    });
  }
}
