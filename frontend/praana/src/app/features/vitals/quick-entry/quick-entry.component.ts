import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ApiService } from '../../../core/services/api.service';
import { Patient } from '../../../core/models';

interface QuickVitalRow {
  patient: Patient;
  heart_rate: number;
  systolic_bp: number;
  diastolic_bp: number;
  temperature: number;
  spo2: number;
  respiratory_rate: number;
}

@Component({
  selector: 'app-quick-entry',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    MatCardModule, MatFormFieldModule, MatInputModule,
    MatButtonModule, MatIconModule, MatSnackBarModule, MatProgressSpinnerModule,
  ],
  template: `
    <div class="flex flex-wrap justify-between items-center gap-4 mb-6">
      <div>
        <h2 class="text-xl font-bold text-gray-900">Quick Entry</h2>
        <p class="text-gray-500 text-sm mt-0.5">Record vitals for multiple patients at once</p>
      </div>
      <button mat-flat-button color="primary" (click)="onSubmitAll()" [disabled]="saving()" class="!rounded-lg !h-11">
        @if (saving()) {
          <mat-spinner diameter="18"></mat-spinner>
        } @else {
          <mat-icon class="!text-base">save</mat-icon> Save All Vitals
        }
      </button>
    </div>

    @if (loading()) {
      <div class="flex justify-center py-12"><mat-spinner diameter="36"></mat-spinner></div>
    } @else {
      <div class="prana-card overflow-hidden">
        <div class="overflow-x-auto">
          <table class="text-sm" style="width: 100%; min-width: 520px;">
            <thead>
              <tr class="border-b border-gray-200 bg-gray-50">
                <th class="p-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Patient</th>
                <th class="p-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">HR</th>
                <th class="p-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Sys BP</th>
                <th class="p-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Dia BP</th>
                <th class="p-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Temp</th>
                <th class="p-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">SpO2</th>
                <th class="p-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">RR</th>
              </tr>
            </thead>
            <tbody>
              @for (row of rows(); track row.patient.id) {
                <tr class="border-t border-gray-100 hover:bg-gray-50">
                  <td class="p-3">
                    <div class="font-medium text-gray-800 text-sm">{{ row.patient.name }}</div>
                    <div class="text-xs text-gray-400">Bed {{ row.patient.bed_number }}</div>
                  </td>
                  <td class="p-2 text-center"><input type="number" class="quick-input" [(ngModel)]="row.heart_rate" [name]="'hr_' + row.patient.id" min="0" max="300"></td>
                  <td class="p-2 text-center"><input type="number" class="quick-input" [(ngModel)]="row.systolic_bp" [name]="'sbp_' + row.patient.id" min="0" max="300"></td>
                  <td class="p-2 text-center"><input type="number" class="quick-input" [(ngModel)]="row.diastolic_bp" [name]="'dbp_' + row.patient.id" min="0" max="200"></td>
                  <td class="p-2 text-center"><input type="number" class="quick-input" [(ngModel)]="row.temperature" [name]="'temp_' + row.patient.id" min="30" max="45" step="0.1"></td>
                  <td class="p-2 text-center"><input type="number" class="quick-input" [(ngModel)]="row.spo2" [name]="'spo2_' + row.patient.id" min="0" max="100"></td>
                  <td class="p-2 text-center"><input type="number" class="quick-input" [(ngModel)]="row.respiratory_rate" [name]="'rr_' + row.patient.id" min="0" max="60"></td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    }
  `,
  styles: [`
    .quick-input {
      width: 68px;
      text-align: center;
      border: 1.5px solid #d1d5db;
      border-radius: 6px;
      padding: 5px 4px;
      font-size: 13px;
      font-family: inherit;
      color: #374151;
      background: #ffffff;

      &:focus {
        outline: none;
        border-color: #db2777;
        box-shadow: 0 0 0 2px rgba(219, 39, 119, 0.10);
      }
    }
  `]
})
export class QuickEntryComponent implements OnInit {
  rows = signal<QuickVitalRow[]>([]);
  loading = signal(true);
  saving = signal(false);

  constructor(private api: ApiService, private snackBar: MatSnackBar) {}

  ngOnInit() {
    this.api.getPatients().subscribe(res => {
      if (res.success && res.data) {
        const activePatients = res.data.filter(p => p.status !== 'discharged');
        this.rows.set(activePatients.map(p => ({
          patient: p, heart_rate: 0, systolic_bp: 0, diastolic_bp: 0,
          temperature: 0, spo2: 0, respiratory_rate: 0,
        })));
      }
      this.loading.set(false);
    });
  }

  onSubmitAll() {
    const entries = this.rows()
      .filter(r => r.heart_rate > 0 || r.spo2 > 0 || r.systolic_bp > 0 || r.temperature > 0)
      .map(r => ({
        patient_id: r.patient.id,
        heart_rate: r.heart_rate,
        systolic_bp: r.systolic_bp,
        diastolic_bp: r.diastolic_bp,
        temperature: r.temperature,
        spo2: r.spo2,
        respiratory_rate: r.respiratory_rate,
      }));

    if (entries.length === 0) {
      this.snackBar.open('No vitals to save', 'OK', { duration: 2000 });
      return;
    }

    this.saving.set(true);
    this.api.bulkRecordVitals(entries).subscribe({
      next: (res) => {
        if (res.success) {
          this.snackBar.open(`Saved vitals for ${entries.length} patients`, 'OK', { duration: 3000 });
          this.rows.update(rows => rows.map(r => ({
            ...r, heart_rate: 0, systolic_bp: 0, diastolic_bp: 0,
            temperature: 0, spo2: 0, respiratory_rate: 0,
          })));
        }
        this.saving.set(false);
      },
      error: () => {
        this.snackBar.open('Failed to save vitals', 'OK', { duration: 3000 });
        this.saving.set(false);
      }
    });
  }
}
