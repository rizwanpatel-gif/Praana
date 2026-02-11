import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ApiService } from '../../../core/services/api.service';
import { Patient } from '../../../core/models';

@Component({
  selector: 'app-vitals-entry',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    MatCardModule, MatFormFieldModule, MatInputModule,
    MatButtonModule, MatIconModule, MatSnackBarModule, MatProgressSpinnerModule,
  ],
  template: `
    <h2 class="text-2xl font-bold bg-gradient-to-r from-pink-600 to-rose-500 bg-clip-text text-transparent mb-1">Record Vitals</h2>
    @if (patient()) {
      <p class="text-pink-400 text-sm mb-6">{{ patient()!.name }} &middot; Bed {{ patient()!.bed_number }}</p>
    }

    <div class="glass-card max-w-2xl p-6">
      @if (error()) {
        <div class="error-toast mb-4">
          <mat-icon class="!text-base mr-2">error_outline</mat-icon>
          {{ error() }}
        </div>
      }
      <form (ngSubmit)="onSubmit()" class="flex flex-col gap-4">
        <div class="grid grid-cols-2 gap-4">
          <mat-form-field appearance="outline">
            <mat-label>Heart Rate (bpm)</mat-label>
            <input matInput type="number" [(ngModel)]="form.heart_rate" name="heart_rate" min="0" max="300">
            <mat-icon matSuffix class="!text-pink-300">favorite</mat-icon>
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>SpO2 (%)</mat-label>
            <input matInput type="number" [(ngModel)]="form.spo2" name="spo2" min="0" max="100">
            <mat-icon matSuffix class="!text-pink-300">air</mat-icon>
          </mat-form-field>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <mat-form-field appearance="outline">
            <mat-label>Systolic BP (mmHg)</mat-label>
            <input matInput type="number" [(ngModel)]="form.systolic_bp" name="systolic_bp" min="0" max="300">
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Diastolic BP (mmHg)</mat-label>
            <input matInput type="number" [(ngModel)]="form.diastolic_bp" name="diastolic_bp" min="0" max="200">
          </mat-form-field>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <mat-form-field appearance="outline">
            <mat-label>Temperature (°C)</mat-label>
            <input matInput type="number" [(ngModel)]="form.temperature" name="temperature" min="30" max="45" step="0.1">
            <mat-icon matSuffix class="!text-pink-300">thermostat</mat-icon>
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Respiratory Rate (/min)</mat-label>
            <input matInput type="number" [(ngModel)]="form.respiratory_rate" name="respiratory_rate" min="0" max="60">
          </mat-form-field>
        </div>
        <mat-form-field appearance="outline">
          <mat-label>Notes</mat-label>
          <input matInput [(ngModel)]="form.notes" name="notes">
          <mat-icon matPrefix class="!text-pink-300 mr-2">notes</mat-icon>
        </mat-form-field>
        <div class="flex gap-4 mt-2">
          <button mat-flat-button color="primary" type="submit" [disabled]="saving()" class="!rounded-xl !h-12 !px-8">
            @if (saving()) {
              <mat-spinner diameter="20"></mat-spinner>
            } @else {
              Save Vitals
            }
          </button>
          <button mat-stroked-button type="button" (click)="onCancel()" class="!rounded-xl !h-12">Cancel</button>
        </div>
      </form>
    </div>
  `,
  styles: [`
    .error-toast {
      background: #fff1f2; color: #9f1239; padding: 10px 14px;
      border-radius: 12px; font-size: 13px;
      display: flex; align-items: center; border: 1px solid #fecdd3;
    }
  `]
})
export class VitalsEntryComponent implements OnInit {
  form = { heart_rate: 0, systolic_bp: 0, diastolic_bp: 0, temperature: 0, spo2: 0, respiratory_rate: 0, notes: '' };
  patient = signal<Patient | null>(null);
  saving = signal(false);
  error = signal('');
  private patientId = '';

  constructor(
    private api: ApiService,
    private router: Router,
    private route: ActivatedRoute,
    private snackBar: MatSnackBar,
  ) {}

  ngOnInit() {
    this.patientId = this.route.snapshot.params['patientId'];
    this.api.getPatient(this.patientId).subscribe(res => {
      if (res.success && res.data) this.patient.set(res.data.patient);
    });
  }

  onSubmit() {
    this.saving.set(true);
    this.error.set('');
    this.api.recordVitals(this.patientId, this.form).subscribe({
      next: (res) => {
        if (res.success) {
          this.snackBar.open('Vitals recorded successfully', 'OK', { duration: 3000 });
          this.router.navigate(['/patients', this.patientId]);
        } else {
          this.error.set(res.error || 'Failed');
        }
        this.saving.set(false);
      },
      error: (err) => {
        this.error.set(err.error?.error || 'Failed');
        this.saving.set(false);
      }
    });
  }

  onCancel() {
    this.router.navigate(['/patients', this.patientId]);
  }
}
