import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-invite',
  standalone: true,
  imports: [
    CommonModule, FormsModule, RouterLink,
    MatFormFieldModule, MatInputModule,
    MatButtonModule, MatIconModule, MatProgressSpinnerModule,
  ],
  template: `
    <div class="auth-bg">
      <div class="blob blob-1"></div>
      <div class="blob blob-2"></div>
      <div class="blob blob-3"></div>

      <div class="auth-card animate-fade-in">
        <div class="text-center mb-8">
          <div class="logo-icon">
            <mat-icon class="!text-4xl !w-10 !h-10 text-pink-500">group_add</mat-icon>
          </div>
          <h1 class="text-3xl font-bold mt-4 bg-gradient-to-r from-pink-500 to-rose-400 bg-clip-text text-transparent">
            Join Team
          </h1>
          <p class="text-sm text-pink-300 mt-1 tracking-wide">Accept your invite</p>
        </div>

        @if (error()) {
          <div class="error-toast animate-fade-in">
            <mat-icon class="!text-base mr-2">error_outline</mat-icon>
            {{ error() }}
          </div>
        }
        @if (success()) {
          <div class="success-toast animate-fade-in">
            <mat-icon class="!text-base mr-2">check_circle</mat-icon>
            Account created! <a routerLink="/auth/login" class="underline ml-1 font-semibold">Sign in</a>
          </div>
        }

        <form (ngSubmit)="onAccept()" class="flex flex-col gap-4">
          <mat-form-field appearance="outline" class="w-full">
            <mat-label>Invite Code</mat-label>
            <input matInput [(ngModel)]="code" name="code" required placeholder="e.g. a1b2c3d4">
            <mat-icon matPrefix class="!text-pink-300 mr-2">vpn_key</mat-icon>
          </mat-form-field>

          <mat-form-field appearance="outline" class="w-full">
            <mat-label>Email</mat-label>
            <input matInput type="email" [(ngModel)]="email" name="email" required>
            <mat-icon matPrefix class="!text-pink-300 mr-2">email</mat-icon>
          </mat-form-field>

          <mat-form-field appearance="outline" class="w-full">
            <mat-label>Your Name</mat-label>
            <input matInput [(ngModel)]="name" name="name" required>
            <mat-icon matPrefix class="!text-pink-300 mr-2">person</mat-icon>
          </mat-form-field>

          <mat-form-field appearance="outline" class="w-full">
            <mat-label>Password</mat-label>
            <input matInput [type]="showPwd ? 'text' : 'password'" [(ngModel)]="password" name="password" required minlength="8">
            <mat-icon matPrefix class="!text-pink-300 mr-2">lock</mat-icon>
            <button type="button" mat-icon-button matSuffix (click)="showPwd = !showPwd">
              <mat-icon class="!text-pink-300">{{ showPwd ? 'visibility_off' : 'visibility' }}</mat-icon>
            </button>
          </mat-form-field>

          <button mat-flat-button color="primary" type="submit" [disabled]="loading()" class="auth-btn">
            @if (loading()) {
              <mat-spinner diameter="22"></mat-spinner>
            } @else {
              Accept Invite
            }
          </button>
        </form>

        <div class="text-center mt-8 pt-6 border-t border-pink-100">
          <a routerLink="/auth/login" class="auth-link">Back to sign in</a>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .auth-bg {
      min-height: 100vh;
      display: flex; align-items: center; justify-content: center;
      background: linear-gradient(135deg, #fdf2f8 0%, #fce7f3 30%, #f5f3ff 70%, #fdf2f8 100%);
      position: relative; overflow: hidden; padding: 20px;
    }
    .blob { position: absolute; border-radius: 50%; filter: blur(80px); opacity: 0.5; }
    .blob-1 { width: 400px; height: 400px; background: #fbcfe8; top: -100px; right: -100px; }
    .blob-2 { width: 300px; height: 300px; background: #ede9fe; bottom: -50px; left: -80px; }
    .blob-3 { width: 200px; height: 200px; background: #fce7f3; top: 50%; left: 50%; }
    .auth-card {
      width: 100%; max-width: 420px;
      background: rgba(255,255,255,0.75); backdrop-filter: blur(24px);
      border: 1px solid rgba(255,255,255,0.6); border-radius: 24px;
      padding: 36px 32px;
      box-shadow: 0 8px 40px rgba(236,72,153,0.08), 0 0 0 1px rgba(251,207,232,0.3);
      position: relative; z-index: 1;
      overflow: hidden; word-wrap: break-word; overflow-wrap: break-word;
    }
    .logo-icon {
      width: 64px; height: 64px; border-radius: 20px;
      background: linear-gradient(135deg, #fce7f3, #fdf2f8);
      display: inline-flex; align-items: center; justify-content: center;
      box-shadow: 0 4px 16px rgba(236,72,153,0.12);
    }
    .error-toast {
      background: #fff1f2; color: #9f1239; padding: 10px 14px;
      border-radius: 12px; font-size: 13px; margin-bottom: 16px;
      display: flex; align-items: center; border: 1px solid #fecdd3;
    }
    .success-toast {
      background: #ecfdf5; color: #065f46; padding: 10px 14px;
      border-radius: 12px; font-size: 13px; margin-bottom: 16px;
      display: flex; align-items: center; border: 1px solid #a7f3d0;
    }
    .auth-btn { height: 48px !important; border-radius: 14px !important; font-size: 15px !important; font-weight: 600 !important; }
    .auth-link { font-size: 13px; color: #db2777; text-decoration: none; font-weight: 500; }
    .auth-link:hover { color: #be185d; }
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
