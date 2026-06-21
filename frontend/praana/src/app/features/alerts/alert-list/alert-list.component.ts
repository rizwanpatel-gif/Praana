import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatTabsModule } from '@angular/material/tabs';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ApiService } from '../../../core/services/api.service';
import { Alert } from '../../../core/models';
import { format } from 'date-fns';

@Component({
  selector: 'app-alert-list',
  standalone: true,
  imports: [
    CommonModule, RouterLink,
    MatCardModule, MatButtonModule, MatIconModule,
    MatChipsModule, MatTabsModule, MatProgressSpinnerModule, MatSnackBarModule,
  ],
  template: `
    <div class="flex flex-wrap justify-between items-center gap-3 mb-6">
      <div>
        <h2 class="text-xl font-bold text-gray-900">Alerts</h2>
        <p class="text-gray-500 text-sm mt-0.5">{{ activeAlerts().length }} active alerts</p>
      </div>
      <a mat-stroked-button routerLink="/alerts/thresholds">
        <mat-icon class="!text-base">tune</mat-icon> Configure Thresholds
      </a>
    </div>

    <mat-tab-group>
      <mat-tab label="Active ({{ activeAlerts().length }})">
        @if (loading()) {
          <div class="flex justify-center py-12"><mat-spinner diameter="36"></mat-spinner></div>
        } @else if (activeAlerts().length === 0) {
          <div class="text-center py-16">
            <div class="empty-icon-wrap">
              <mat-icon class="!text-4xl !w-10 !h-10 text-gray-300">check_circle</mat-icon>
            </div>
            <p class="mt-4 text-gray-400 font-medium">All clear — no active alerts</p>
          </div>
        } @else {
          <div class="flex flex-col gap-3 mt-4">
            @for (alert of activeAlerts(); track alert.id) {
              <div class="alert-card" [class.alert-card--critical]="alert.severity === 'critical'" [class.alert-card--warning]="alert.severity !== 'critical'">
                <div class="p-4 flex justify-between items-center gap-4">
                  <div class="min-w-0 flex-1">
                    <div class="flex items-center gap-2 flex-wrap">
                      <span class="status-badge" [class]="alert.severity === 'critical' ? 'status-critical' : 'status-warning'">
                        {{ alert.severity }}
                      </span>
                      <span class="font-medium text-gray-800 text-sm">{{ alert.message }}</span>
                    </div>
                    <p class="text-xs text-gray-400 mt-1">
                      <a [routerLink]="['/patients', alert.patient_id]" class="text-pink-600 hover:text-pink-800 font-medium">
                        {{ alert.patient_name }}
                      </a>
                      &middot; {{ formatTime(alert.created_at) }}
                    </p>
                  </div>
                  <button mat-flat-button color="primary" (click)="acknowledge(alert.id)" class="!rounded-lg !text-sm flex-shrink-0">
                    <mat-icon class="!text-base">check</mat-icon> Acknowledge
                  </button>
                </div>
              </div>
            }
          </div>
        }
      </mat-tab>

      <mat-tab label="History">
        <div class="flex flex-col gap-3 mt-4">
          @for (alert of alertHistory(); track alert.id) {
            <div class="prana-card">
              <div class="p-4 flex justify-between items-center gap-4">
                <div class="min-w-0 flex-1">
                  <span class="font-medium text-gray-800 text-sm block truncate">{{ alert.message }}</span>
                  <p class="text-xs text-gray-400 mt-1">
                    {{ formatTime(alert.created_at) }}
                    @if (alert.acknowledged) {
                      &middot; Acknowledged {{ formatTime(alert.acknowledged_at!) }}
                    }
                  </p>
                </div>
                <span class="status-badge flex-shrink-0" [class]="alert.acknowledged ? 'status-stable' : 'status-critical'">
                  {{ alert.acknowledged ? 'Acknowledged' : 'Pending' }}
                </span>
              </div>
            </div>
          }
        </div>
      </mat-tab>
    </mat-tab-group>
  `,
  styles: [`
    .empty-icon-wrap {
      width: 64px; height: 64px; border-radius: 50%;
      background: #f9fafb; border: 1px solid #e5e7eb;
      display: inline-flex; align-items: center; justify-content: center;
    }
    .alert-card {
      background: #ffffff;
      border: 1px solid #e5e7eb;
      border-radius: 10px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.06), 0 4px 12px rgba(0,0,0,0.03);
      border-left: 3px solid #e5e7eb;
      overflow: hidden;
    }
    .alert-card--critical { border-left-color: #ef4444; }
    .alert-card--warning  { border-left-color: #f59e0b; }
    .status-badge {
      font-size: 10px; font-weight: 600; text-transform: uppercase;
      padding: 2px 8px; border-radius: 4px; letter-spacing: 0.4px;
    }
  `]
})
export class AlertListComponent implements OnInit {
  activeAlerts = signal<Alert[]>([]);
  alertHistory = signal<Alert[]>([]);
  loading = signal(true);

  constructor(private api: ApiService, private snackBar: MatSnackBar) {}

  ngOnInit() {
    this.loadAlerts();
  }

  loadAlerts() {
    this.api.getActiveAlerts().subscribe(res => {
      if (res.success) this.activeAlerts.set(res.data || []);
      this.loading.set(false);
    });
    this.api.getAlertHistory().subscribe(res => {
      if (res.success) this.alertHistory.set(res.data || []);
    });
  }

  acknowledge(alertId: string) {
    this.activeAlerts.update(list => list.filter(a => a.id !== alertId));
    this.api.acknowledgeAlert(alertId).subscribe(res => {
      if (res.success) {
        this.snackBar.open('Alert acknowledged', 'OK', { duration: 2000 });
        this.api.refreshAlertCount();
        this.api.getAlertHistory().subscribe(h => {
          if (h.success) this.alertHistory.set(h.data || []);
        });
      } else {
        this.loadAlerts();
      }
    });
  }

  formatTime(ts: number): string {
    return format(new Date(ts * 1000), 'MMM dd HH:mm');
  }
}
