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
      <h2 class="text-xl font-bold text-gray-900">Dashboard</h2>
      <p class="text-gray-500 text-sm mt-0.5">Real-time patient overview</p>
    </div>

    @if (loading()) {
      <div class="flex justify-center py-12">
        <mat-spinner diameter="36"></mat-spinner>
      </div>
    } @else {
      <!-- Stats cards -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
        <div class="stat-card">
          <div class="stat-icon bg-pink-50 border border-pink-100">
            <mat-icon class="!text-pink-600 !text-lg">groups</mat-icon>
          </div>
          <p class="stat-value">{{ overview()?.total_patients || 0 }}</p>
          <p class="stat-label">Total Patients</p>
        </div>
        <div class="stat-card">
          <div class="stat-icon bg-red-50 border border-red-100">
            <mat-icon class="!text-red-500 !text-lg">warning</mat-icon>
          </div>
          <p class="stat-value text-red-600">{{ overview()?.critical_count || 0 }}</p>
          <p class="stat-label">Critical</p>
        </div>
        <div class="stat-card">
          <div class="stat-icon bg-emerald-50 border border-emerald-100">
            <mat-icon class="!text-emerald-600 !text-lg">check_circle</mat-icon>
          </div>
          <p class="stat-value text-emerald-700">{{ overview()?.stable_count || 0 }}</p>
          <p class="stat-label">Stable</p>
        </div>
        <div class="stat-card">
          <div class="stat-icon bg-amber-50 border border-amber-100">
            <mat-icon class="!text-amber-600 !text-lg">notifications_active</mat-icon>
          </div>
          <p class="stat-value text-amber-700">{{ overview()?.active_alerts || 0 }}</p>
          <p class="stat-label">Active Alerts</p>
        </div>
      </div>

      <!-- Shift summary -->
      @if (shift()) {
        <div class="prana-card p-5 mb-5">
          <p class="section-label mb-4">Current Shift</p>
          <div class="grid grid-cols-3 gap-4 text-center">
            <div>
              <p class="text-2xl font-bold text-gray-900">{{ shift()!.vitals_recorded }}</p>
              <p class="text-xs text-gray-500 mt-1">Vitals Recorded</p>
            </div>
            <div>
              <p class="text-2xl font-bold text-red-500">{{ shift()!.alerts_triggered }}</p>
              <p class="text-xs text-gray-500 mt-1">Alerts Triggered</p>
            </div>
            <div>
              <p class="text-2xl font-bold text-emerald-600">{{ shift()!.alerts_acknowledged }}</p>
              <p class="text-xs text-gray-500 mt-1">Acknowledged</p>
            </div>
          </div>
        </div>
      }

      <!-- Patient grid header -->
      <div class="flex flex-wrap justify-between items-center gap-3 mb-4">
        <h3 class="text-sm font-semibold text-gray-700">Patients ({{ overview()?.patients?.length || 0 }})</h3>
        <div class="flex flex-wrap gap-2">
          <a mat-flat-button color="primary" routerLink="/patients/add" class="!text-sm">
            <mat-icon class="!text-base">add</mat-icon> Add Patient
          </a>
          <a mat-stroked-button routerLink="/vitals/quick-entry" class="!text-sm">
            <mat-icon class="!text-base">speed</mat-icon> Quick Entry
          </a>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        @for (ps of overview()?.patients || []; track ps.patient.id) {
          <div class="patient-card" [class]="'patient-card--' + ps.patient.status">
            <div class="p-4">
              <div class="flex justify-between items-start mb-2">
                <div class="min-w-0">
                  <a [routerLink]="['/patients', ps.patient.id]" class="text-sm font-semibold text-gray-900 hover:text-pink-600 truncate block">
                    {{ ps.patient.name }}
                  </a>
                  <p class="text-xs text-gray-400 mt-0.5">Bed {{ ps.patient.bed_number }} &middot; {{ ps.patient.ward }}</p>
                </div>
                <span class="status-badge" [class]="'status-' + ps.patient.status">{{ ps.patient.status }}</span>
              </div>
              <p class="text-xs text-gray-400 mb-3 truncate">{{ ps.patient.diagnosis }}</p>

              @if (ps.latest_vitals) {
                <div class="grid grid-cols-3 gap-1.5 text-sm">
                  <div class="vital-mini">
                    <p class="vital-val" [class.text-red-500]="isAbnormal('hr', ps.latest_vitals.heart_rate)">
                      {{ ps.latest_vitals.heart_rate }}
                    </p>
                    <p class="vital-lbl">HR</p>
                  </div>
                  <div class="vital-mini">
                    <p class="vital-val">{{ ps.latest_vitals.systolic_bp }}/{{ ps.latest_vitals.diastolic_bp }}</p>
                    <p class="vital-lbl">BP</p>
                  </div>
                  <div class="vital-mini">
                    <p class="vital-val" [class.text-red-500]="isAbnormal('spo2', ps.latest_vitals.spo2)">
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
                    <p class="text-[10px] text-gray-400">{{ formatTime(ps.latest_vitals.recorded_at) }}</p>
                    <p class="vital-lbl">Time</p>
                  </div>
                </div>
              } @else {
                <p class="text-xs text-gray-400 italic">No vitals recorded</p>
              }

              <div class="flex gap-1 mt-3 pt-3 border-t border-gray-100">
                <a mat-button class="!text-pink-600 !text-xs !font-medium" [routerLink]="['/vitals', ps.patient.id, 'record']">Record</a>
                <a mat-button class="!text-gray-500 !text-xs" [routerLink]="['/vitals', ps.patient.id, 'history']">History</a>
              </div>
            </div>
          </div>
        }
      </div>
    }
  `,
  styles: [`
    .stat-card {
      background: #ffffff;
      border: 1px solid #e5e7eb;
      border-radius: 10px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.06), 0 4px 12px rgba(0,0,0,0.03);
      padding: 18px;
      text-align: center;
    }
    .stat-icon {
      width: 40px; height: 40px; border-radius: 8px;
      display: inline-flex; align-items: center; justify-content: center;
      margin-bottom: 10px;
    }
    .stat-value { font-size: 26px; font-weight: 700; color: #111827; line-height: 1; }
    .stat-label { font-size: 12px; color: #9ca3af; margin-top: 4px; }

    .section-label {
      font-size: 11px; font-weight: 600; text-transform: uppercase;
      letter-spacing: 0.06em; color: #6b7280; margin: 0;
    }

    .patient-card {
      background: #ffffff;
      border: 1px solid #e5e7eb;
      border-radius: 10px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.06), 0 4px 12px rgba(0,0,0,0.03);
      border-left: 3px solid #e5e7eb;
      overflow: hidden;
    }
    .patient-card--critical { border-left-color: #ef4444; }
    .patient-card--stable   { border-left-color: #10b981; }
    .patient-card--active   { border-left-color: #ec4899; }

    .status-badge {
      font-size: 10px; font-weight: 600; text-transform: uppercase;
      padding: 2px 8px; border-radius: 4px; letter-spacing: 0.4px;
      flex-shrink: 0;
    }

    .vital-mini {
      text-align: center; padding: 5px 3px;
      background: #f9fafb;
      border: 1px solid #f3f4f6;
      border-radius: 6px;
    }
    .vital-val { font-weight: 600; font-size: 13px; color: #374151; }
    .vital-lbl { font-size: 9px; color: #9ca3af; margin-top: 1px; text-transform: uppercase; letter-spacing: 0.03em; }
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

  isAbnormal(type: string, value: number): boolean {
    if (type === 'hr') return value > 100 || value < 60;
    if (type === 'spo2') return value < 92;
    return false;
  }

  formatTime(ts: number): string {
    return format(new Date(ts * 1000), 'HH:mm');
  }
}
