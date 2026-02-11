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
import { Threshold } from '../../../core/models';

@Component({
  selector: 'app-threshold-config',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    MatCardModule, MatFormFieldModule, MatInputModule,
    MatButtonModule, MatIconModule, MatSnackBarModule, MatProgressSpinnerModule,
  ],
  template: `
    <h2 class="text-2xl font-bold bg-gradient-to-r from-pink-600 to-rose-500 bg-clip-text text-transparent mb-1">Alert Thresholds</h2>
    <p class="text-pink-300 text-sm mb-6">Configure when alerts are triggered for vital signs</p>

    @if (loading()) {
      <div class="flex justify-center py-12"><mat-spinner></mat-spinner></div>
    } @else {
      <div class="glass-card max-w-3xl p-6">
        <form (ngSubmit)="onSave()">
          <div class="grid grid-cols-1 gap-6">
            <div>
              <h3 class="text-sm font-semibold text-pink-600 uppercase tracking-wider mb-3">
                <mat-icon class="!text-base align-middle mr-1">favorite</mat-icon> Heart Rate (bpm)
              </h3>
              <div class="grid grid-cols-2 gap-4">
                <mat-form-field appearance="outline">
                  <mat-label>High</mat-label>
                  <input matInput type="number" [(ngModel)]="form.heart_rate_high" name="heart_rate_high" step="1">
                </mat-form-field>
                <mat-form-field appearance="outline">
                  <mat-label>Low</mat-label>
                  <input matInput type="number" [(ngModel)]="form.heart_rate_low" name="heart_rate_low" step="1">
                </mat-form-field>
              </div>
            </div>

            <div class="border-t border-pink-100 pt-4">
              <h3 class="text-sm font-semibold text-pink-600 uppercase tracking-wider mb-3">
                <mat-icon class="!text-base align-middle mr-1">speed</mat-icon> Systolic BP (mmHg)
              </h3>
              <div class="grid grid-cols-2 gap-4">
                <mat-form-field appearance="outline">
                  <mat-label>High</mat-label>
                  <input matInput type="number" [(ngModel)]="form.systolic_bp_high" name="systolic_bp_high" step="1">
                </mat-form-field>
                <mat-form-field appearance="outline">
                  <mat-label>Low</mat-label>
                  <input matInput type="number" [(ngModel)]="form.systolic_bp_low" name="systolic_bp_low" step="1">
                </mat-form-field>
              </div>
            </div>

            <div class="border-t border-pink-100 pt-4">
              <h3 class="text-sm font-semibold text-pink-600 uppercase tracking-wider mb-3">
                <mat-icon class="!text-base align-middle mr-1">speed</mat-icon> Diastolic BP (mmHg)
              </h3>
              <div class="grid grid-cols-2 gap-4">
                <mat-form-field appearance="outline">
                  <mat-label>High</mat-label>
                  <input matInput type="number" [(ngModel)]="form.diastolic_bp_high" name="diastolic_bp_high" step="1">
                </mat-form-field>
                <mat-form-field appearance="outline">
                  <mat-label>Low</mat-label>
                  <input matInput type="number" [(ngModel)]="form.diastolic_bp_low" name="diastolic_bp_low" step="1">
                </mat-form-field>
              </div>
            </div>

            <div class="border-t border-pink-100 pt-4">
              <h3 class="text-sm font-semibold text-pink-600 uppercase tracking-wider mb-3">
                <mat-icon class="!text-base align-middle mr-1">thermostat</mat-icon> Temperature (°C)
              </h3>
              <div class="grid grid-cols-2 gap-4">
                <mat-form-field appearance="outline">
                  <mat-label>High</mat-label>
                  <input matInput type="number" [(ngModel)]="form.temperature_high" name="temperature_high" step="0.1">
                </mat-form-field>
                <mat-form-field appearance="outline">
                  <mat-label>Low</mat-label>
                  <input matInput type="number" [(ngModel)]="form.temperature_low" name="temperature_low" step="0.1">
                </mat-form-field>
              </div>
            </div>

            <div class="border-t border-pink-100 pt-4">
              <h3 class="text-sm font-semibold text-pink-600 uppercase tracking-wider mb-3">
                <mat-icon class="!text-base align-middle mr-1">air</mat-icon> SpO2 (%)
              </h3>
              <div class="grid grid-cols-2 gap-4">
                <mat-form-field appearance="outline">
                  <mat-label>Low Threshold</mat-label>
                  <input matInput type="number" [(ngModel)]="form.spo2_low" name="spo2_low" step="1">
                </mat-form-field>
              </div>
            </div>

            <div class="border-t border-pink-100 pt-4">
              <h3 class="text-sm font-semibold text-pink-600 uppercase tracking-wider mb-3">
                <mat-icon class="!text-base align-middle mr-1">waves</mat-icon> Respiratory Rate (/min)
              </h3>
              <div class="grid grid-cols-2 gap-4">
                <mat-form-field appearance="outline">
                  <mat-label>High</mat-label>
                  <input matInput type="number" [(ngModel)]="form.respiratory_rate_high" name="respiratory_rate_high" step="1">
                </mat-form-field>
                <mat-form-field appearance="outline">
                  <mat-label>Low</mat-label>
                  <input matInput type="number" [(ngModel)]="form.respiratory_rate_low" name="respiratory_rate_low" step="1">
                </mat-form-field>
              </div>
            </div>
          </div>

          <button mat-flat-button color="primary" type="submit" [disabled]="saving()" class="mt-6 !rounded-xl !h-12 !px-8">
            @if (saving()) {
              <mat-spinner diameter="20"></mat-spinner>
            } @else {
              Save Thresholds
            }
          </button>
        </form>
      </div>
    }
  `,
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
      if (res.success && res.data) {
        this.form = { ...res.data };
      }
      this.loading.set(false);
    });
  }

  onSave() {
    this.saving.set(true);
    this.api.setOrgThresholds(this.form).subscribe({
      next: (res) => {
        if (res.success) {
          this.snackBar.open('Thresholds saved', 'OK', { duration: 3000 });
        }
        this.saving.set(false);
      },
      error: () => {
        this.snackBar.open('Failed to save', 'OK', { duration: 3000 });
        this.saving.set(false);
      }
    });
  }
}
