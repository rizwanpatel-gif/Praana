import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ApiService } from '../../core/services/api.service';
import { DashboardOverview, ShiftSummary, PatientSummary } from '../../core/models';
import { format } from 'date-fns';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule, RouterLink,
    MatCardModule, MatButtonModule, MatIconModule, MatChipsModule, MatProgressSpinnerModule,
  ],
  template: `
    <div class="mb-6">
      <h2 class="text-2xl font-bold bg-gradient-to-r from-pink-600 to-rose-500 bg-clip-text text-transparent">Dashboard</h2>
      <p class="text-pink-300 text-sm">Real-time patient overview</p>
    </div>

    @if (loading()) {
      <div class="flex justify-center py-12">
        <mat-spinner></mat-spinner>
      </div>
    } @else {
      <!-- Stats cards -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div class="stat-card glass-card">
          <div class="stat-icon" style="background: linear-gradient(135deg, #fce7f3, #fbcfe8);">
            <mat-icon class="!text-pink-500">groups</mat-icon>
          </div>
          <p class="stat-value text-pink-600">{{ overview()?.total_patients || 0 }}</p>
          <p class="stat-label">Total Patients</p>
        </div>
        <div class="stat-card glass-card">
          <div class="stat-icon" style="background: linear-gradient(135deg, #ffe4e6, #fecdd3);">
            <mat-icon class="!text-rose-500">warning</mat-icon>
          </div>
          <p class="stat-value text-rose-600">{{ overview()?.critical_count || 0 }}</p>
          <p class="stat-label">Critical</p>
        </div>
        <div class="stat-card glass-card">
          <div class="stat-icon" style="background: linear-gradient(135deg, #d1fae5, #a7f3d0);">
            <mat-icon class="!text-emerald-500">check_circle</mat-icon>
          </div>
          <p class="stat-value text-emerald-600">{{ overview()?.stable_count || 0 }}</p>
          <p class="stat-label">Stable</p>
        </div>
        <div class="stat-card glass-card">
          <div class="stat-icon" style="background: linear-gradient(135deg, #fef3c7, #fde68a);">
            <mat-icon class="!text-amber-500">notifications_active</mat-icon>
          </div>
          <p class="stat-value text-amber-600">{{ overview()?.active_alerts || 0 }}</p>
          <p class="stat-label">Active Alerts</p>
        </div>
      </div>

      <!-- Shift summary -->
      @if (shift()) {
        <div class="glass-card p-5 mb-6">
          <h3 class="text-sm font-semibold text-pink-600 uppercase tracking-wider mb-4">Current Shift</h3>
          <div class="grid grid-cols-3 gap-4">
            <div class="text-center">
              <p class="text-2xl font-bold text-gray-800">{{ shift()!.vitals_recorded }}</p>
              <p class="text-xs text-pink-400 mt-1">Vitals Recorded</p>
            </div>
            <div class="text-center">
              <p class="text-2xl font-bold text-rose-500">{{ shift()!.alerts_triggered }}</p>
              <p class="text-xs text-pink-400 mt-1">Alerts Triggered</p>
            </div>
            <div class="text-center">
              <p class="text-2xl font-bold text-emerald-500">{{ shift()!.alerts_acknowledged }}</p>
              <p class="text-xs text-pink-400 mt-1">Alerts Acknowledged</p>
            </div>
          </div>
        </div>
      }

      <!-- Patient grid -->
      <div class="flex justify-between items-center mb-4">
        <h3 class="text-lg font-semibold text-gray-700">Patients</h3>
        <div class="flex gap-2">
          <a mat-flat-button color="primary" routerLink="/patients/add">
            <mat-icon>add</mat-icon> Add Patient
          </a>
          <a mat-stroked-button routerLink="/vitals/quick-entry">
            <mat-icon>speed</mat-icon> Quick Entry
          </a>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        @for (ps of overview()?.patients || []; track ps.patient.id) {
          <div class="glass-card patient-card" [class]="getStatusClass(ps.patient.status)">
            <div class="p-4">
              <div class="flex justify-between items-start mb-2">
                <div class="min-w-0">
                  <a [routerLink]="['/patients', ps.patient.id]" class="text-base font-semibold text-gray-800 hover:text-pink-600 transition-colors truncate block">
                    {{ ps.patient.name }}
                  </a>
                  <p class="text-xs text-pink-400 mt-0.5">Bed {{ ps.patient.bed_number }} &middot; {{ ps.patient.ward }}</p>
                </div>
                <span class="status-pill" [class]="'status-pill-' + ps.patient.status">{{ ps.patient.status }}</span>
              </div>
              <p class="text-xs text-gray-500 mb-3 truncate">{{ ps.patient.diagnosis }}</p>

              @if (ps.latest_vitals) {
                <div class="grid grid-cols-3 gap-2 text-sm">
                  <div class="vital-mini">
                    <p class="vital-val" [class.!text-rose-500]="isAbnormal('hr', ps.latest_vitals.heart_rate)">
                      {{ ps.latest_vitals.heart_rate }}
                    </p>
                    <p class="vital-lbl">HR</p>
                  </div>
                  <div class="vital-mini">
                    <p class="vital-val">{{ ps.latest_vitals.systolic_bp }}/{{ ps.latest_vitals.diastolic_bp }}</p>
                    <p class="vital-lbl">BP</p>
                  </div>
                  <div class="vital-mini">
                    <p class="vital-val" [class.!text-rose-500]="isAbnormal('spo2', ps.latest_vitals.spo2)">
                      {{ ps.latest_vitals.spo2 }}%
                    </p>
                    <p class="vital-lbl">SpO2</p>
                  </div>
                  <div class="vital-mini">
                    <p class="vital-val">{{ ps.latest_vitals.temperature }}°</p>
                    <p class="vital-lbl">Temp</p>
                  </div>
                  <div class="vital-mini">
                    <p class="vital-val">{{ ps.latest_vitals.respiratory_rate }}</p>
                    <p class="vital-lbl">RR</p>
                  </div>
                  <div class="vital-mini">
                    <p class="text-[10px] text-pink-400">{{ formatTime(ps.latest_vitals.recorded_at) }}</p>
                  </div>
                </div>
              } @else {
                <p class="text-xs text-pink-300 italic">No vitals recorded</p>
              }

              <div class="flex gap-2 mt-3 pt-3 border-t border-pink-100">
                <a mat-button class="!text-pink-600 !text-xs" [routerLink]="['/vitals', ps.patient.id, 'record']">Record Vitals</a>
                <a mat-button class="!text-pink-400 !text-xs" [routerLink]="['/vitals', ps.patient.id, 'history']">History</a>
              </div>
            </div>
          </div>
        }
      </div>
    }
  `,
  styles: [`
    .stat-card {
      padding: 20px;
      text-align: center;
    }
    .stat-icon {
      width: 48px; height: 48px; border-radius: 14px;
      display: inline-flex; align-items: center; justify-content: center;
      margin-bottom: 12px;
    }
    .stat-value { font-size: 28px; font-weight: 700; line-height: 1; }
    .stat-label { font-size: 12px; color: #9ca3af; margin-top: 4px; }

    .patient-card {
      border-left: 4px solid transparent;
      transition: all 0.2s ease;
      &:hover { transform: translateY(-2px); }
    }
    .patient-card.border-rose { border-left-color: #f43f5e; }
    .patient-card.border-emerald { border-left-color: #10b981; }
    .patient-card.border-pink { border-left-color: #ec4899; }

    .status-pill {
      font-size: 10px; font-weight: 600; text-transform: uppercase;
      padding: 3px 10px; border-radius: 20px; letter-spacing: 0.5px;
      flex-shrink: 0;
    }
    .status-pill-critical { background: #ffe4e6; color: #9f1239; }
    .status-pill-stable { background: #d1fae5; color: #065f46; }
    .status-pill-active { background: #fce7f3; color: #9d174d; }

    .vital-mini {
      text-align: center; padding: 6px;
      background: rgba(253, 242, 248, 0.6);
      border-radius: 8px;
    }
    .vital-val { font-weight: 600; font-size: 14px; color: #374151; }
    .vital-lbl { font-size: 10px; color: #d946ef; margin-top: 2px; }
  `]
})
export class DashboardComponent implements OnInit {
  overview = signal<DashboardOverview | null>(null);
  shift = signal<ShiftSummary | null>(null);
  loading = signal(true);

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.api.getDashboardOverview().subscribe(res => {
      if (res.success) this.overview.set(res.data!);
      this.loading.set(false);
    });
    this.api.getShiftSummary().subscribe(res => {
      if (res.success) this.shift.set(res.data!);
    });
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'critical': return 'border-rose';
      case 'stable': return 'border-emerald';
      default: return 'border-pink';
    }
  }

  isAbnormal(type: string, value: number): boolean {
    if (type === 'hr') return value > 100 || value < 60;
    if (type === 'spo2') return value < 92;
    return false;
  }

  formatTime(ts: number): string {
    return format(new Date(ts * 1000), 'HH:mm');
  }
}
