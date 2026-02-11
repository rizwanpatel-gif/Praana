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
      <div class="flex justify-center py-12"><mat-spinner></mat-spinner></div>
    } @else if (patient()) {
      <div class="flex justify-between items-start mb-6">
        <div>
          <h2 class="text-2xl font-bold bg-gradient-to-r from-pink-600 to-rose-500 bg-clip-text text-transparent">{{ patient()!.name }}</h2>
          <p class="text-pink-400 text-sm mt-1">
            {{ patient()!.age }}y, {{ patient()!.gender }} &middot; Bed {{ patient()!.bed_number }} &middot; {{ patient()!.ward }}
          </p>
          <span class="inline-block mt-2 text-[10px] font-semibold uppercase px-3 py-1 rounded-full"
            [class]="'status-' + patient()!.status">{{ patient()!.status }}</span>
        </div>
        <div class="flex gap-2">
          <a mat-flat-button color="primary" [routerLink]="['/vitals', patient()!.id, 'record']">
            <mat-icon>monitor_heart</mat-icon> Record Vitals
          </a>
          <a mat-stroked-button [routerLink]="['/patients', patient()!.id, 'edit']">
            <mat-icon>edit</mat-icon> Edit
          </a>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Patient Info -->
        <div class="glass-card p-5">
          <h3 class="text-sm font-semibold text-pink-600 uppercase tracking-wider mb-4">Patient Info</h3>
          <div class="grid grid-cols-2 gap-4 text-sm">
            <div><span class="text-pink-400">Diagnosis:</span> <span class="text-gray-700">{{ patient()!.diagnosis }}</span></div>
            <div><span class="text-pink-400">Admitted:</span> <span class="text-gray-700">{{ formatDate(patient()!.admitted_at) }}</span></div>
          </div>
        </div>

        <!-- Latest Vitals -->
        <div class="glass-card p-5">
          <h3 class="text-sm font-semibold text-pink-600 uppercase tracking-wider mb-4">Latest Vitals</h3>
          @if (latestVitals()) {
            <div class="grid grid-cols-3 gap-3">
              <div class="vital-cell">
                <p class="vital-num" [class.!text-rose-500]="latestVitals()!.heart_rate > 100 || latestVitals()!.heart_rate < 60">
                  {{ latestVitals()!.heart_rate }}
                </p>
                <p class="vital-label">Heart Rate</p>
              </div>
              <div class="vital-cell">
                <p class="vital-num">{{ latestVitals()!.systolic_bp }}/{{ latestVitals()!.diastolic_bp }}</p>
                <p class="vital-label">Blood Pressure</p>
              </div>
              <div class="vital-cell">
                <p class="vital-num" [class.!text-rose-500]="latestVitals()!.spo2 < 92">
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
                <p class="text-xs text-pink-400">{{ formatTime(latestVitals()!.recorded_at) }}</p>
                <p class="vital-label">Recorded</p>
              </div>
            </div>
          } @else {
            <p class="text-pink-300 text-sm italic">No vitals recorded yet</p>
          }
        </div>
      </div>

      <!-- Vitals History -->
      <div class="glass-card p-5 mt-6">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-sm font-semibold text-pink-600 uppercase tracking-wider">Vitals History</h3>
          <div class="flex gap-2">
            @for (r of ranges; track r) {
              <button mat-stroked-button
                [class.!bg-pink-100]="selectedRange() === r"
                [class.!text-pink-700]="selectedRange() === r"
                (click)="loadHistory(r)">
                {{ r }}
              </button>
            }
          </div>
        </div>
        @if (history().length > 0) {
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="border-b border-pink-100">
                  <th class="p-2 text-left text-pink-600 font-semibold">Time</th>
                  <th class="p-2 text-pink-600 font-semibold">HR</th>
                  <th class="p-2 text-pink-600 font-semibold">BP</th>
                  <th class="p-2 text-pink-600 font-semibold">Temp</th>
                  <th class="p-2 text-pink-600 font-semibold">SpO2</th>
                  <th class="p-2 text-pink-600 font-semibold">RR</th>
                  <th class="p-2 text-left text-pink-600 font-semibold">Notes</th>
                </tr>
              </thead>
              <tbody>
                @for (v of history(); track v.id) {
                  <tr class="border-t border-pink-50 hover:bg-pink-50/30 transition-colors">
                    <td class="p-2 text-gray-600">{{ formatTime(v.recorded_at) }}</td>
                    <td class="p-2 text-center" [class.text-rose-500]="v.heart_rate > 100 || v.heart_rate < 60">{{ v.heart_rate }}</td>
                    <td class="p-2 text-center">{{ v.systolic_bp }}/{{ v.diastolic_bp }}</td>
                    <td class="p-2 text-center">{{ v.temperature }}°</td>
                    <td class="p-2 text-center" [class.text-rose-500]="v.spo2 < 92">{{ v.spo2 }}%</td>
                    <td class="p-2 text-center">{{ v.respiratory_rate }}</td>
                    <td class="p-2 text-gray-500">{{ v.notes }}</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        } @else {
          <p class="text-pink-300 text-sm italic text-center py-6">No vitals in this range</p>
        }
      </div>
    }
  `,
  styles: [`
    .vital-cell {
      text-align: center; padding: 10px;
      background: rgba(253, 242, 248, 0.5);
      border-radius: 12px;
    }
    .vital-num { font-size: 20px; font-weight: 700; color: #374151; }
    .vital-label { font-size: 10px; color: #d946ef; margin-top: 4px; }
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
