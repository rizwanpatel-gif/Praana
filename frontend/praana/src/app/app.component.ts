import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from './core/services/auth.service';
import { WebSocketService } from './core/services/websocket.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule, RouterOutlet, RouterLink, RouterLinkActive,
    MatSidenavModule, MatListModule,
    MatIconModule, MatButtonModule, MatSnackBarModule,
  ],
  template: `
    @if (auth.isLoggedIn()) {
      <mat-sidenav-container class="h-screen">
        <mat-sidenav mode="side" opened class="sidebar">
          <!-- Logo -->
          <div class="sidebar-header">
            <div class="logo-pill">
              <mat-icon class="!text-pink-500">favorite</mat-icon>
            </div>
            <div class="ml-3 min-w-0">
              <h1 class="text-lg font-bold bg-gradient-to-r from-pink-500 to-rose-400 bg-clip-text text-transparent leading-tight">
                Praana
              </h1>
              <p class="text-xs text-pink-300 truncate">{{ auth.user()?.name }}</p>
            </div>
          </div>

          <!-- Nav -->
          <nav class="px-3 py-4 flex flex-col gap-1">
            <a class="nav-item" routerLink="/dashboard" routerLinkActive="nav-active">
              <mat-icon class="nav-icon">space_dashboard</mat-icon>
              <span>Dashboard</span>
            </a>
            <a class="nav-item" routerLink="/patients" routerLinkActive="nav-active">
              <mat-icon class="nav-icon">groups</mat-icon>
              <span>Patients</span>
            </a>
            <a class="nav-item" routerLink="/vitals/quick-entry" routerLinkActive="nav-active">
              <mat-icon class="nav-icon">monitor_heart</mat-icon>
              <span>Quick Entry</span>
            </a>
            <a class="nav-item" routerLink="/alerts" routerLinkActive="nav-active">
              <mat-icon class="nav-icon">notifications_active</mat-icon>
              <span>Alerts</span>
              @if (ws.alerts().length > 0) {
                <span class="alert-badge">{{ ws.alerts().length }}</span>
              }
            </a>

            @if (auth.isAdmin()) {
              <div class="nav-divider"></div>
              <p class="text-[10px] uppercase tracking-widest text-pink-300 px-3 mb-1">Admin</p>
              <a class="nav-item" routerLink="/alerts/thresholds" routerLinkActive="nav-active">
                <mat-icon class="nav-icon">tune</mat-icon>
                <span>Thresholds</span>
              </a>
              <a class="nav-item" routerLink="/settings" routerLinkActive="nav-active">
                <mat-icon class="nav-icon">settings</mat-icon>
                <span>Settings</span>
              </a>
              <a class="nav-item" routerLink="/settings/team" routerLinkActive="nav-active">
                <mat-icon class="nav-icon">group_add</mat-icon>
                <span>Team</span>
              </a>
            }
          </nav>

          <!-- Logout -->
          <div class="sidebar-footer">
            <button class="nav-item w-full justify-center !text-pink-400" (click)="auth.logout()">
              <mat-icon class="nav-icon">logout</mat-icon>
              <span>Sign Out</span>
            </button>
          </div>
        </mat-sidenav>

        <mat-sidenav-content class="main-content">
          <!-- Alert banner -->
          @if (ws.alerts().length > 0) {
            <div class="alert-banner animate-fade-in">
              <div class="flex items-center gap-2 min-w-0">
                <mat-icon class="!text-lg flex-shrink-0">warning</mat-icon>
                <span class="truncate text-sm">{{ ws.alerts()[0].message }}</span>
              </div>
              <button mat-icon-button class="!text-white flex-shrink-0" (click)="ws.clearAlert(ws.alerts()[0].id)">
                <mat-icon>close</mat-icon>
              </button>
            </div>
          }
          <div class="p-6 animate-fade-in">
            <router-outlet />
          </div>
        </mat-sidenav-content>
      </mat-sidenav-container>
    } @else {
      <router-outlet />
    }
  `,
  styles: [`
    :host { display: block; height: 100vh; }

    .sidebar {
      width: 240px;
      background: rgba(255, 255, 255, 0.8) !important;
      backdrop-filter: blur(20px);
      border-right: 1px solid rgba(251, 207, 232, 0.4) !important;
      overflow-x: hidden;
    }

    .sidebar-header {
      display: flex;
      align-items: center;
      padding: 20px 16px;
      border-bottom: 1px solid rgba(251, 207, 232, 0.3);
      overflow: hidden;
    }

    .logo-pill {
      width: 40px;
      height: 40px;
      border-radius: 14px;
      background: linear-gradient(135deg, #fce7f3, #fdf2f8);
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 2px 8px rgba(236, 72, 153, 0.1);
      flex-shrink: 0;
    }

    .nav-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 14px;
      border-radius: 12px;
      color: #6b7280;
      font-size: 13px;
      font-weight: 500;
      text-decoration: none;
      transition: all 0.2s ease;
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
      cursor: pointer;
      border: none;
      background: none;

      &:hover {
        background: rgba(251, 207, 232, 0.25);
        color: #db2777;
      }
    }

    .nav-active {
      background: rgba(251, 207, 232, 0.35) !important;
      color: #db2777 !important;

      .nav-icon { color: #ec4899 !important; }
    }

    .nav-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
      color: #9ca3af;
      transition: color 0.2s;
    }

    .nav-divider {
      height: 1px;
      background: rgba(251, 207, 232, 0.3);
      margin: 8px 12px;
    }

    .alert-badge {
      margin-left: auto;
      background: linear-gradient(135deg, #ec4899, #f43f5e);
      color: white;
      font-size: 11px;
      font-weight: 700;
      padding: 2px 8px;
      border-radius: 10px;
      min-width: 20px;
      text-align: center;
    }

    .sidebar-footer {
      position: absolute;
      bottom: 0;
      width: 100%;
      padding: 12px;
      border-top: 1px solid rgba(251, 207, 232, 0.3);
    }

    .main-content {
      background: linear-gradient(180deg, #fdf2f8 0%, #faf5ff 50%, #fff1f2 100%) !important;
      overflow-x: hidden;
    }

    .alert-banner {
      background: linear-gradient(135deg, #ec4899, #f43f5e);
      color: white;
      padding: 8px 16px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
    }
  `]
})
export class AppComponent implements OnInit, OnDestroy {
  constructor(
    public auth: AuthService,
    public ws: WebSocketService,
    private snackBar: MatSnackBar,
    private router: Router,
  ) {}

  ngOnInit() {
    if (this.auth.isLoggedIn()) {
      this.ws.connect();
    }
  }

  ngOnDestroy() {
    this.ws.disconnect();
  }
}
