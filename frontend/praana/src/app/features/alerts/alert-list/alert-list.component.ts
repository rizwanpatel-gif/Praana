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
    <div class="flex justify-between items-center mb-6">
      <div>
        <h2 class="text-2xl font-bold bg-gradient-to-r from-pink-600 to-rose-500 bg-clip-text text-transparent">Alerts</h2>
        <p class="text-pink-300 text-sm">{{ activeAlerts().length }} active alerts</p>
      </div>
      <a mat-stroked-button routerLink="/alerts/thresholds">
        <mat-icon>tune</mat-icon> Configure Thresholds
      </a>
    </div>

    <mat-tab-group>
      <mat-tab label="Active ({{ activeAlerts().length }})">
        @if (loading()) {
          <div class="flex justify-center py-12"><mat-spinner></mat-spinner></div>
        } @else if (activeAlerts().length === 0) {
          <div class="text-center py-12">
            <mat-icon class="!text-6xl !w-16 !h-16 text-pink-200">check_circle</mat-icon>
            <p class="mt-4 text-pink-300">No active alerts</p>
          </div>
        } @else {
          <div class="flex flex-col gap-3 mt-4">
            @for (alert of activeAlerts(); track alert.id) {
              <div class="glass-card alert-card"
                [style.border-left-color]="alert.severity === 'critical' ? '#f43f5e' : '#f59e0b'">
                <div class="p-4 flex justify-between items-center">
                  <div class="min-w-0">
                    <div class="flex items-center gap-2">
                      <span class="status-pill"
                        [class]="alert.severity === 'critical' ? 'status-critical' : 'status-warning'">
                        {{ alert.severity }}
                      </span>
                      <span class="font-medium text-gray-700 truncate">{{ alert.message }}</span>
                    </div>
                    <p class="text-xs text-pink-400 mt-1">
                      <a [routerLink]="['/patients', alert.patient_id]" class="text-pink-600 hover:text-pink-800">
                        {{ alert.patient_name }}
                      </a>
                      &middot; {{ formatTime(alert.created_at) }}
                    </p>
                  </div>
                  <button mat-flat-button color="primary" (click)="acknowledge(alert.id)" class="!rounded-xl flex-shrink-0">
                    <mat-icon>check</mat-icon> Acknowledge
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
            <div class="glass-card alert-card"
              [style.border-left-color]="alert.acknowledged ? '#d1d5db' : '#f43f5e'">
              <div class="p-4 flex justify-between items-center">
                <div class="min-w-0">
                  <span class="font-medium text-gray-700 truncate block">{{ alert.message }}</span>
                  <p class="text-xs text-pink-400 mt-1">
                    {{ formatTime(alert.created_at) }}
                    @if (alert.acknowledged) {
                      &middot; Ack'd {{ formatTime(alert.acknowledged_at!) }}
                    }
                  </p>
                </div>
                <span class="status-pill flex-shrink-0"
                  [class]="alert.acknowledged ? 'status-stable' : 'status-critical'">
                  {{ alert.acknowledged ? 'Acknowledged' : 'Unacknowledged' }}
                </span>
              </div>
            </div>
          }
        </div>
      </mat-tab>
    </mat-tab-group>
  `,
  styles: [`
    .alert-card {
      border-left: 4px solid transparent;
    }
    .status-pill {
      font-size: 10px; font-weight: 600; text-transform: uppercase;
      padding: 3px 10px; border-radius: 20px; letter-spacing: 0.5px;
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
    this.api.acknowledgeAlert(alertId).subscribe(res => {
      if (res.success) {
        this.snackBar.open('Alert acknowledged', 'OK', { duration: 2000 });
        this.loadAlerts();
      }
    });
  }

  formatTime(ts: number): string {
    return format(new Date(ts * 1000), 'MMM dd HH:mm');
  }
}
