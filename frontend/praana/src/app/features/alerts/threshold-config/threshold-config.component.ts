import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ApiService } from '../../../core/services/api.service';
import { Threshold } from '../../../core/models';

@Component({
  selector: 'app-threshold-config',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatSnackBarModule, MatProgressSpinnerModule],
  template: `
    <div class="mb-6">
      <h2 class="text-xl font-bold text-gray-900">Alert Thresholds</h2>
      <p class="text-gray-500 text-sm mt-0.5">Configure when vital sign alerts are triggered</p>
    </div>

    @if (loading()) {
      <div class="flex justify-center py-12"><mat-spinner diameter="36"></mat-spinner></div>
    } @else {
      <div class="prana-card max-w-2xl">
        <form (ngSubmit)="onSave()">

          <div class="threshold-section">
            <p class="threshold-title">
              <mat-icon class="!text-base text-pink-500">favorite</mat-icon>
              Heart Rate <span class="unit">(bpm)</span>
            </p>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div class="form-group">
                <label class="form-label">High</label>
                <input class="form-input" type="number" [(ngModel)]="form.heart_rate_high" name="heart_rate_high" step="1">
              </div>
              <div class="form-group">
                <label class="form-label">Low</label>
                <input class="form-input" type="number" [(ngModel)]="form.heart_rate_low" name="heart_rate_low" step="1">
              </div>
            </div>
          </div>

          <div class="threshold-section">
            <p class="threshold-title">
              <mat-icon class="!text-base text-blue-500">speed</mat-icon>
              Systolic BP <span class="unit">(mmHg)</span>
            </p>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div class="form-group">
                <label class="form-label">High</label>
                <input class="form-input" type="number" [(ngModel)]="form.systolic_bp_high" name="systolic_bp_high" step="1">
              </div>
              <div class="form-group">
                <label class="form-label">Low</label>
                <input class="form-input" type="number" [(ngModel)]="form.systolic_bp_low" name="systolic_bp_low" step="1">
              </div>
            </div>
          </div>

          <div class="threshold-section">
            <p class="threshold-title">
              <mat-icon class="!text-base text-blue-400">speed</mat-icon>
              Diastolic BP <span class="unit">(mmHg)</span>
            </p>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div class="form-group">
                <label class="form-label">High</label>
                <input class="form-input" type="number" [(ngModel)]="form.diastolic_bp_high" name="diastolic_bp_high" step="1">
              </div>
              <div class="form-group">
                <label class="form-label">Low</label>
                <input class="form-input" type="number" [(ngModel)]="form.diastolic_bp_low" name="diastolic_bp_low" step="1">
              </div>
            </div>
          </div>

          <div class="threshold-section">
            <p class="threshold-title">
              <mat-icon class="!text-base text-orange-500">thermostat</mat-icon>
              Temperature <span class="unit">(°C)</span>
            </p>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div class="form-group">
                <label class="form-label">High</label>
                <input class="form-input" type="number" [(ngModel)]="form.temperature_high" name="temperature_high" step="0.1">
              </div>
              <div class="form-group">
                <label class="form-label">Low</label>
                <input class="form-input" type="number" [(ngModel)]="form.temperature_low" name="temperature_low" step="0.1">
              </div>
            </div>
          </div>

          <div class="threshold-section">
            <p class="threshold-title">
              <mat-icon class="!text-base text-sky-500">air</mat-icon>
              SpO2 <span class="unit">(%)</span>
            </p>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div class="form-group">
                <label class="form-label">Low Threshold</label>
                <input class="form-input" type="number" [(ngModel)]="form.spo2_low" name="spo2_low" step="1">
              </div>
            </div>
          </div>

          <div class="threshold-section border-b-0">
            <p class="threshold-title">
              <mat-icon class="!text-base text-teal-500">waves</mat-icon>
              Respiratory Rate <span class="unit">(/min)</span>
            </p>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div class="form-group">
                <label class="form-label">High</label>
                <input class="form-input" type="number" [(ngModel)]="form.respiratory_rate_high" name="respiratory_rate_high" step="1">
              </div>
              <div class="form-group">
                <label class="form-label">Low</label>
                <input class="form-input" type="number" [(ngModel)]="form.respiratory_rate_low" name="respiratory_rate_low" step="1">
              </div>
            </div>
          </div>

          <div class="px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-[10px]">
            <button type="submit" [disabled]="saving()" class="submit-btn">
              @if (saving()) {
                <mat-spinner diameter="18"></mat-spinner>
              } @else {
                Save Thresholds
              }
            </button>
          </div>
        </form>
      </div>
    }
  `,
  styles: [`
    .threshold-section {
      padding: 20px 24px;
      border-bottom: 1px solid #f3f4f6;
    }
    .threshold-title {
      display: flex; align-items: center; gap: 8px;
      font-size: 13px; font-weight: 600; color: #374151;
      margin: 0 0 16px;
    }
    .unit { font-weight: 400; color: #9ca3af; }
    .submit-btn {
      height: 42px; padding: 0 24px;
      background: #db2777; color: #ffffff;
      border: none; border-radius: 8px;
      font-size: 14px; font-weight: 600; font-family: inherit;
      cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px;
      &:hover:not(:disabled) { background: #be185d; }
      &:disabled { opacity: 0.6; cursor: not-allowed; }
    }
  `]
})
export class ThresholdConfigComponent implements OnInit {
  form: Threshold = {
    heart_rate_high: 100, heart_rate_low: 60,
    systolic_bp_high: 140, systolic_bp_low: 90,
    diastolic_bp_high: 90, diastolic_bp_low: 60,
    temperature_high: 38.5, temperature_low: 36.0,
    spo2_low: 92,
    respiratory_rate_high: 20, respiratory_rate_low: 12,
  };
  loading = signal(true);
  saving = signal(false);

  constructor(private api: ApiService, private snackBar: MatSnackBar) {}

  ngOnInit() {
    this.api.getThresholds().subscribe(res => {
      if (res.success && res.data) this.form = { ...res.data };
      this.loading.set(false);
    });
  }

  onSave() {
    this.saving.set(true);
    this.api.setOrgThresholds(this.form).subscribe({
      next: (res) => {
        if (res.success) this.snackBar.open('Thresholds saved', 'OK', { duration: 3000 });
        this.saving.set(false);
      },
      error: () => {
        this.snackBar.open('Failed to save', 'OK', { duration: 3000 });
        this.saving.set(false);
      }
    });
  }
}
