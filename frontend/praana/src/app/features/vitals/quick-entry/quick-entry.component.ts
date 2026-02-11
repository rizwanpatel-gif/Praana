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
    <div class="flex justify-between items-center mb-6">
      <div>
        <h2 class="text-2xl font-bold bg-gradient-to-r from-pink-600 to-rose-500 bg-clip-text text-transparent">Quick Entry</h2>
        <p class="text-pink-300 text-sm">Record vitals for multiple patients at once</p>
      </div>
      <button mat-flat-button color="primary" (click)="onSubmitAll()" [disabled]="saving()" class="!rounded-xl !h-12">
        @if (saving()) {
          <mat-spinner diameter="20"></mat-spinner>
        } @else {
          <mat-icon>save</mat-icon> Save All Vitals
        }
      </button>
    </div>

    @if (loading()) {
      <div class="flex justify-center py-12"><mat-spinner></mat-spinner></div>
    } @else {
      <div class="glass-card overflow-hidden">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-pink-100">
              <th class="p-3 text-left text-pink-600 font-semibold">Patient</th>
              <th class="p-3 text-pink-600 font-semibold">HR</th>
              <th class="p-3 text-pink-600 font-semibold">Sys BP</th>
              <th class="p-3 text-pink-600 font-semibold">Dia BP</th>
              <th class="p-3 text-pink-600 font-semibold">Temp</th>
              <th class="p-3 text-pink-600 font-semibold">SpO2</th>
              <th class="p-3 text-pink-600 font-semibold">RR</th>
            </tr>
          </thead>
          <tbody>
            @for (row of rows(); track row.patient.id) {
              <tr class="border-t border-pink-50 hover:bg-pink-50/30 transition-colors">
                <td class="p-3">
                  <div class="font-medium text-gray-700">{{ row.patient.name }}</div>
                  <div class="text-xs text-pink-400">Bed {{ row.patient.bed_number }}</div>
                </td>
                <td class="p-1"><input type="number" class="quick-input" [(ngModel)]="row.heart_rate" [name]="'hr_' + row.patient.id"></td>
                <td class="p-1"><input type="number" class="quick-input" [(ngModel)]="row.systolic_bp" [name]="'sbp_' + row.patient.id"></td>
                <td class="p-1"><input type="number" class="quick-input" [(ngModel)]="row.diastolic_bp" [name]="'dbp_' + row.patient.id"></td>
                <td class="p-1"><input type="number" class="quick-input" [(ngModel)]="row.temperature" [name]="'temp_' + row.patient.id" step="0.1"></td>
                <td class="p-1"><input type="number" class="quick-input" [(ngModel)]="row.spo2" [name]="'spo2_' + row.patient.id"></td>
                <td class="p-1"><input type="number" class="quick-input" [(ngModel)]="row.respiratory_rate" [name]="'rr_' + row.patient.id"></td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    }
  `,
  styles: [`
    .quick-input {
      width: 64px; text-align: center;
      border: 1px solid #fbcfe8; border-radius: 8px;
      padding: 6px 4px; font-size: 13px;
      background: rgba(255,255,255,0.7);
      transition: all 0.2s;
      &:focus {
        outline: none;
        border-color: #ec4899;
        box-shadow: 0 0 0 3px rgba(236, 72, 153, 0.1);
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
