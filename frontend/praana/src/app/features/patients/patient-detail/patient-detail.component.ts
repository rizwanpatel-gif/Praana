import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTabsModule } from '@angular/material/tabs';
import { ApiService } from '../../../core/services/api.service';
import { Patient, Vitals } from '../../../core/models';
import { format } from 'date-fns';

@Component({
  selector: 'app-patient-detail',
  standalone: true,
  imports: [
    CommonModule, RouterLink,
    MatCardModule, MatButtonModule, MatIconModule,
    MatChipsModule, MatProgressSpinnerModule, MatTabsModule,
  ],
  template: `
    @if (loading()) {
      <div class="flex justify-center py-12"><mat-spinner diameter="36"></mat-spinner></div>
    } @else if (patient()) {
      <div class="flex flex-wrap justify-between items-start gap-4 mb-6">
        <div>
          <h2 class="text-xl font-bold text-gray-900">{{ patient()!.name }}</h2>
          <p class="text-gray-500 text-sm mt-1">
            {{ patient()!.age }}y &middot; {{ patient()!.gender }} &middot; Bed {{ patient()!.bed_number }} &middot; {{ patient()!.ward }}
          </p>
          <span class="inline-block mt-2 status-badge" [class]="'status-' + patient()!.status">{{ patient()!.status }}</span>
        </div>
        <div class="flex flex-wrap gap-2">
          <a mat-flat-button color="primary" [routerLink]="['/vitals', patient()!.id, 'record']">
            <mat-icon class="!text-base">monitor_heart</mat-icon> Record Vitals
          </a>
          <a mat-stroked-button [routerLink]="['/patients', patient()!.id, 'edit']">
            <mat-icon class="!text-base">edit</mat-icon> Edit
          </a>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <!-- Patient Info -->
        <div class="prana-card p-5">
          <p class="section-label mb-4">Patient Info</p>
          <div class="grid grid-cols-1 gap-3 text-sm">
            <div class="info-row">
              <span class="info-label">Diagnosis</span>
              <span class="text-gray-800">{{ patient()!.diagnosis || '—' }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Admitted</span>
              <span class="text-gray-800">{{ formatDate(patient()!.admitted_at) }}</span>
            </div>
          </div>
        </div>

        <!-- Latest Vitals -->
        <div class="prana-card p-5">
          <p class="section-label mb-4">Latest Vitals</p>
          @if (latestVitals()) {
            <div class="grid grid-cols-3 gap-2">
              <div class="vital-cell">
                <p class="vital-num" [class.text-red-500]="latestVitals()!.heart_rate > 100 || latestVitals()!.heart_rate < 60">
                  {{ latestVitals()!.heart_rate }}
                </p>
                <p class="vital-label">Heart Rate</p>
              </div>
              <div class="vital-cell">
                <p class="vital-num">{{ latestVitals()!.systolic_bp }}/{{ latestVitals()!.diastolic_bp }}</p>
                <p class="vital-label">Blood Pressure</p>
              </div>
              <div class="vital-cell">
                <p class="vital-num" [class.text-red-500]="latestVitals()!.spo2 < 92">
                  {{ latestVitals()!.spo2 }}%
                </p>
                <p class="vital-label">SpO2</p>
              </div>
              <div class="vital-cell">
                <p class="vital-num">{{ latestVitals()!.temperature }}°C</p>
                <p class="vital-label">Temperature</p>
              </div>
              <div class="vital-cell">
                <p class="vital-num">{{ latestVitals()!.respiratory_rate }}</p>
                <p class="vital-label">Resp Rate</p>
              </div>
              <div class="vital-cell">
                <p class="vital-num text-sm">{{ formatTime(latestVitals()!.recorded_at) }}</p>
                <p class="vital-label">Recorded</p>
              </div>
            </div>
          } @else {
            <p class="text-gray-400 text-sm italic">No vitals recorded yet</p>
          }
        </div>
      </div>

      <!-- Vitals History -->
      <div class="prana-card p-5">
        <div class="flex flex-wrap justify-between items-center gap-3 mb-4">
          <p class="section-label">Vitals History</p>
          <div class="flex flex-wrap gap-1.5">
            @for (r of ranges; track r) {
              <button mat-stroked-button class="!text-xs !h-8 !px-3 !min-w-0"
                [class.!bg-pink-50]="selectedRange() === r"
                [class.!text-pink-700]="selectedRange() === r"
                [class.!border-pink-200]="selectedRange() === r"
                (click)="loadHistory(r)">{{ r }}</button>
            }
          </div>
        </div>
        @if (history().length > 0) {
          <div class="overflow-x-auto">
            <table class="text-sm" style="width: 100%; min-width: 500px;">
              <thead>
                <tr class="border-b border-gray-200">
                  <th class="p-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Time</th>
                  <th class="p-2.5 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">HR</th>
                  <th class="p-2.5 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">BP</th>
                  <th class="p-2.5 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Temp</th>
                  <th class="p-2.5 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">SpO2</th>
                  <th class="p-2.5 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">RR</th>
                  <th class="p-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Notes</th>
                </tr>
              </thead>
              <tbody>
                @for (v of history(); track v.id) {
                  <tr class="border-t border-gray-100 hover:bg-gray-50">
                    <td class="p-2.5 text-gray-600">{{ formatTime(v.recorded_at) }}</td>
                    <td class="p-2.5 text-center font-medium" [class.text-red-500]="v.heart_rate > 100 || v.heart_rate < 60">{{ v.heart_rate }}</td>
                    <td class="p-2.5 text-center text-gray-700">{{ v.systolic_bp }}/{{ v.diastolic_bp }}</td>
                    <td class="p-2.5 text-center text-gray-700">{{ v.temperature }}°</td>
                    <td class="p-2.5 text-center font-medium" [class.text-red-500]="v.spo2 < 92">{{ v.spo2 }}%</td>
                    <td class="p-2.5 text-center text-gray-700">{{ v.respiratory_rate }}</td>
                    <td class="p-2.5 text-gray-500 text-xs">{{ v.notes }}</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        } @else {
          <p class="text-gray-400 text-sm italic text-center py-8">No vitals in this range</p>
        }
      </div>
    }
  `,
  styles: [`
    .section-label {
      font-size: 11px; font-weight: 600; text-transform: uppercase;
      letter-spacing: 0.06em; color: #6b7280; margin: 0;
    }
    .info-row {
      display: flex; gap: 12px; align-items: baseline;
    }
    .info-label {
      font-size: 12px; color: #9ca3af; font-weight: 500;
      min-width: 80px; flex-shrink: 0;
    }
    .vital-cell {
      text-align: center; padding: 10px 6px;
      background: #f9fafb;
      border: 1px solid #f3f4f6;
      border-radius: 8px;
    }
    .vital-num { font-size: 18px; font-weight: 700; color: #111827; }
    .vital-label { font-size: 9px; color: #9ca3af; margin-top: 3px; text-transform: uppercase; letter-spacing: 0.04em; }
    .status-badge {
      font-size: 10px; font-weight: 600; text-transform: uppercase;
      padding: 2px 8px; border-radius: 4px; letter-spacing: 0.4px;
    }
  `]
})
export class PatientDetailComponent implements OnInit {
  patient = signal<Patient | null>(null);
  latestVitals = signal<Vitals | null>(null);
  history = signal<Vitals[]>([]);
  loading = signal(true);
  selectedRange = signal('24h');
  ranges = ['6h', '12h', '24h', '7d'];

  private patientId = '';

  constructor(private api: ApiService, private route: ActivatedRoute) {}

  ngOnInit() {
    this.patientId = this.route.snapshot.params['id'];
    this.api.getPatient(this.patientId).subscribe(res => {
      if (res.success && res.data) {
        this.patient.set(res.data.patient);
        this.latestVitals.set(res.data.latest_vitals);
      }
      this.loading.set(false);
    });
    this.loadHistory('24h');
  }

  loadHistory(range: string) {
    this.selectedRange.set(range);
    this.api.getVitalsHistory(this.patientId, range).subscribe(res => {
      if (res.success && res.data) this.history.set(res.data);
    });
  }

  formatDate(ts: number): string {
    return format(new Date(ts * 1000), 'MMM dd, yyyy');
  }

  formatTime(ts: number): string {
    return format(new Date(ts * 1000), 'MMM dd HH:mm');
  }
}
