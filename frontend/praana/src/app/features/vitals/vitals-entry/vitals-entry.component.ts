import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ApiService } from '../../../core/services/api.service';
import { Patient } from '../../../core/models';

@Component({
  selector: 'app-vitals-entry',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatSnackBarModule, MatProgressSpinnerModule],
  template: `
    <div class="mb-6">
      <h2 class="text-xl font-bold text-gray-900">Record Vitals</h2>
      @if (patient()) {
        <p class="text-gray-500 text-sm mt-0.5">{{ patient()!.name }} &middot; Bed {{ patient()!.bed_number }}</p>
      }
    </div>

    <div class="prana-card max-w-2xl p-6">
      @if (error()) {
        <div class="alert-error mb-5">
          <mat-icon class="!text-base flex-shrink-0">error_outline</mat-icon>
          <span>{{ error() }}</span>
        </div>
      }

      <form (ngSubmit)="onSubmit()" class="flex flex-col gap-5">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div class="form-group">
            <label class="form-label">Heart Rate (bpm)</label>
            <input class="form-input" type="number" [(ngModel)]="form.heart_rate" name="heart_rate" min="0" max="300">
          </div>
          <div class="form-group">
            <label class="form-label">SpO2 (%)</label>
            <input class="form-input" type="number" [(ngModel)]="form.spo2" name="spo2" min="0" max="100">
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div class="form-group">
            <label class="form-label">Systolic BP (mmHg)</label>
            <input class="form-input" type="number" [(ngModel)]="form.systolic_bp" name="systolic_bp" min="0" max="300">
          </div>
          <div class="form-group">
            <label class="form-label">Diastolic BP (mmHg)</label>
            <input class="form-input" type="number" [(ngModel)]="form.diastolic_bp" name="diastolic_bp" min="0" max="200">
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div class="form-group">
            <label class="form-label">Temperature (°C)</label>
            <input class="form-input" type="number" [(ngModel)]="form.temperature" name="temperature" min="30" max="45" step="0.1">
          </div>
          <div class="form-group">
            <label class="form-label">Respiratory Rate (/min)</label>
            <input class="form-input" type="number" [(ngModel)]="form.respiratory_rate" name="respiratory_rate" min="0" max="60">
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Notes</label>
          <input class="form-input" type="text" [(ngModel)]="form.notes" name="notes">
        </div>

        <div class="flex gap-3 pt-4 border-t border-gray-100">
          <button type="submit" [disabled]="saving()" class="submit-btn">
            @if (saving()) {
              <mat-spinner diameter="18"></mat-spinner>
            } @else {
              Save Vitals
            }
          </button>
          <button type="button" (click)="onCancel()" class="cancel-btn">Cancel</button>
        </div>
      </form>
    </div>
  `,
  styles: [`
    .alert-error {
      background: #fff1f2; color: #b91c1c; padding: 10px 14px;
      border-radius: 8px; font-size: 13px;
      display: flex; align-items: center; gap: 8px; border: 1px solid #fecaca;
    }
    .submit-btn {
      height: 42px; padding: 0 24px;
      background: #db2777; color: #ffffff;
      border: none; border-radius: 8px;
      font-size: 14px; font-weight: 600; font-family: inherit;
      cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px;
      &:hover:not(:disabled) { background: #be185d; }
      &:disabled { opacity: 0.6; cursor: not-allowed; }
    }
    .cancel-btn {
      height: 42px; padding: 0 20px;
      background: #ffffff; color: #374151;
      border: 1.5px solid #d1d5db; border-radius: 8px;
      font-size: 14px; font-weight: 500; font-family: inherit; cursor: pointer;
      &:hover { background: #f9fafb; }
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
