import { Component, OnInit, OnDestroy, ViewChild, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { MatSidenavModule, MatSidenav } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { BreakpointObserver } from '@angular/cdk/layout';
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
        <mat-sidenav #sidenav [mode]="isMobile() ? 'over' : 'side'" [opened]="!isMobile()" class="sidebar">
          <!-- Logo -->
          <div class="sidebar-header">
            <div class="logo-icon">
              <mat-icon class="!text-pink-600 !text-xl">favorite</mat-icon>
            </div>
            <div class="ml-3 min-w-0">
              <h1 class="text-base font-bold text-gray-900 leading-tight">Praana</h1>
              <p class="text-xs text-gray-400 truncate">{{ auth.user()?.name }}</p>
            </div>
          </div>

          <!-- Nav -->
          <nav class="px-3 py-3 flex flex-col gap-0.5">
            <p class="nav-section-label">Main</p>
            <a class="nav-item" routerLink="/dashboard" routerLinkActive="nav-active" (click)="closeMobile(sidenav)">
              <mat-icon class="nav-icon">space_dashboard</mat-icon>
              <span>Dashboard</span>
            </a>
            <a class="nav-item" routerLink="/patients" routerLinkActive="nav-active" (click)="closeMobile(sidenav)">
              <mat-icon class="nav-icon">groups</mat-icon>
              <span>Patients</span>
            </a>
            <a class="nav-item" routerLink="/vitals/quick-entry" routerLinkActive="nav-active" (click)="closeMobile(sidenav)">
              <mat-icon class="nav-icon">monitor_heart</mat-icon>
              <span>Quick Entry</span>
            </a>
            <a class="nav-item" routerLink="/alerts" routerLinkActive="nav-active" (click)="closeMobile(sidenav)">
              <mat-icon class="nav-icon">notifications_active</mat-icon>
              <span>Alerts</span>
              @if (ws.alerts().length > 0) {
                <span class="alert-badge">{{ ws.alerts().length }}</span>
              }
            </a>

            @if (auth.isAdmin()) {
              <div class="nav-divider"></div>
              <p class="nav-section-label">Admin</p>
              <a class="nav-item" routerLink="/alerts/thresholds" routerLinkActive="nav-active" (click)="closeMobile(sidenav)">
                <mat-icon class="nav-icon">tune</mat-icon>
                <span>Thresholds</span>
              </a>
              <a class="nav-item" routerLink="/settings" routerLinkActive="nav-active" (click)="closeMobile(sidenav)">
                <mat-icon class="nav-icon">settings</mat-icon>
                <span>Settings</span>
              </a>
              <a class="nav-item" routerLink="/settings/team" routerLinkActive="nav-active" (click)="closeMobile(sidenav)">
                <mat-icon class="nav-icon">group_add</mat-icon>
                <span>Team</span>
              </a>
            }
          </nav>

          <!-- Logout -->
          <div class="sidebar-footer">
            <button class="nav-item w-full text-gray-500" (click)="auth.logout()">
              <mat-icon class="nav-icon">logout</mat-icon>
              <span>Sign Out</span>
            </button>
          </div>
        </mat-sidenav>

        <mat-sidenav-content class="main-content">
          <!-- Mobile top bar -->
          @if (isMobile()) {
            <div class="mobile-topbar">
              <button class="menu-btn" (click)="sidenav.toggle()">
                <mat-icon>menu</mat-icon>
              </button>
              <div class="flex items-center gap-2">
                <div class="logo-icon-sm">
                  <mat-icon class="!text-pink-600 !text-base">favorite</mat-icon>
                </div>
                <span class="font-bold text-gray-900 text-base">Praana</span>
              </div>
              @if (ws.alerts().length > 0) {
                <span class="alert-badge">{{ ws.alerts().length }}</span>
              }
            </div>
          }

          <!-- Alert banner -->
          @if (ws.alerts().length > 0) {
            <div class="alert-banner">
              <div class="flex items-center gap-2 min-w-0">
                <mat-icon class="!text-lg flex-shrink-0">warning</mat-icon>
                <span class="truncate text-sm font-medium">{{ ws.alerts()[0].message }}</span>
              </div>
              <button mat-icon-button class="!text-white flex-shrink-0" (click)="ws.clearAlert(ws.alerts()[0].id)">
                <mat-icon>close</mat-icon>
              </button>
            </div>
          }

          <div class="page-content">
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
      background: #ffffff !important;
      border-right: 1px solid #e5e7eb !important;
      overflow-x: hidden;
    }

    .sidebar-header {
      display: flex;
      align-items: center;
      padding: 18px 16px;
      border-bottom: 1px solid #f3f4f6;
      overflow: hidden;
    }

    .logo-icon {
      width: 36px; height: 36px; border-radius: 8px;
      background: #fce7f3; border: 1px solid #fbcfe8;
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
    }

    .nav-section-label {
      font-size: 10px; font-weight: 600; text-transform: uppercase;
      letter-spacing: 0.08em; color: #9ca3af;
      padding: 8px 12px 4px; margin: 0;
    }

    .nav-item {
      display: flex; align-items: center; gap: 10px;
      padding: 8px 12px; border-radius: 8px;
      color: #6b7280; font-size: 13.5px; font-weight: 500;
      text-decoration: none; cursor: pointer;
      border: none; background: none; width: 100%;
      overflow: hidden; white-space: nowrap; text-overflow: ellipsis;

      &:hover { background: #f9fafb; color: #374151; }
      .nav-icon { color: inherit; }
    }

    .nav-active {
      background: #fdf2f8 !important;
      color: #db2777 !important;
    }

    .nav-icon {
      font-size: 18px; width: 18px; height: 18px; flex-shrink: 0;
    }

    .nav-divider { height: 1px; background: #f3f4f6; margin: 8px 0; }

    .alert-badge {
      margin-left: auto;
      background: #db2777; color: white;
      font-size: 11px; font-weight: 700;
      padding: 1px 7px; border-radius: 10px;
      min-width: 20px; text-align: center; flex-shrink: 0;
    }

    .sidebar-footer {
      position: absolute; bottom: 0; width: 100%;
      padding: 10px 12px; border-top: 1px solid #f3f4f6;
      background: #ffffff;
    }

    .main-content {
      background: #f7f8fa !important;
      overflow-x: hidden;
    }

    .mobile-topbar {
      display: flex; align-items: center; gap: 12px;
      padding: 12px 16px;
      background: #ffffff;
      border-bottom: 1px solid #e5e7eb;
      position: sticky; top: 0; z-index: 10;
    }

    .menu-btn {
      background: none; border: none; cursor: pointer;
      color: #374151; display: flex; align-items: center;
      padding: 4px; border-radius: 6px;
      &:hover { background: #f3f4f6; }
    }

    .logo-icon-sm {
      width: 28px; height: 28px; border-radius: 6px;
      background: #fce7f3; border: 1px solid #fbcfe8;
      display: flex; align-items: center; justify-content: center;
    }

    .alert-banner {
      background: #db2777; color: white;
      padding: 10px 20px;
      display: flex; align-items: center;
      justify-content: space-between; gap: 8px;
    }

    .page-content {
      padding: 16px;
    }

    @media (min-width: 768px) {
      .page-content { padding: 24px; }
    }
  `]
})
export class AppComponent implements OnInit, OnDestroy {
  isMobile = signal(false);

  constructor(
    public auth: AuthService,
    public ws: WebSocketService,
    private breakpointObserver: BreakpointObserver,
    private router: Router,
  ) {}

  ngOnInit() {
    if (this.auth.isLoggedIn()) this.ws.connect();

    this.breakpointObserver.observe(['(max-width: 768px)']).subscribe(result => {
      this.isMobile.set(result.matches);
    });
  }

  ngOnDestroy() {
    this.ws.disconnect();
  }

  closeMobile(sidenav: MatSidenav) {
    if (this.isMobile()) sidenav.close();
  }
}
