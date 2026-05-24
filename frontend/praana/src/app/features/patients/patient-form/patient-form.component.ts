import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ApiService } from '../../../core/services/api.service';

@Component({
  selector: 'app-patient-form',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatProgressSpinnerModule],
  template: `
    <div class="mb-6">
      <h2 class="text-xl font-bold text-gray-900">{{ isEdit() ? 'Edit' : 'Add' }} Patient</h2>
      <p class="text-gray-500 text-sm mt-0.5">{{ isEdit() ? 'Update patient information' : 'Register a new patient' }}</p>
    </div>

    <div class="prana-card max-w-2xl p-6">
      @if (error()) {
        <div class="alert-error mb-5">
          <mat-icon class="!text-base flex-shrink-0">error_outline</mat-icon>
          <span>{{ error() }}</span>
        </div>
      }

      <form (ngSubmit)="onSubmit()" class="flex flex-col gap-5">
        <div class="form-group">
          <label class="form-label">Patient Name</label>
          <input class="form-input" type="text" [(ngModel)]="form.name" name="name" required>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div class="form-group">
            <label class="form-label">Age</label>
            <input class="form-input" type="number" [(ngModel)]="form.age" name="age" required min="0" max="150">
          </div>
          <div class="form-group">
            <label class="form-label">Gender</label>
            <select class="form-input" [(ngModel)]="form.gender" name="gender" required>
              <option value="">Select</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div class="form-group">
            <label class="form-label">Bed Number</label>
            <input class="form-input" type="text" [(ngModel)]="form.bed_number" name="bed_number">
          </div>
          <div class="form-group">
            <label class="form-label">Ward</label>
            <input class="form-input" type="text" [(ngModel)]="form.ward" name="ward">
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Diagnosis</label>
          <input class="form-input" type="text" [(ngModel)]="form.diagnosis" name="diagnosis">
        </div>

        <div class="flex gap-3 pt-4 border-t border-gray-100">
          <button type="submit" [disabled]="saving()" class="submit-btn">
            @if (saving()) {
              <mat-spinner diameter="18"></mat-spinner>
            } @else {
              {{ isEdit() ? 'Update' : 'Add' }} Patient
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
export class PatientFormComponent implements OnInit {
  form = { name: '', age: 0, gender: '', bed_number: '', ward: '', diagnosis: '' };
  isEdit = signal(false);
  saving = signal(false);
  error = signal('');
  private patientId = '';

  constructor(private api: ApiService, private router: Router, private route: ActivatedRoute) {}

  ngOnInit() {
    this.patientId = this.route.snapshot.params['id'];
    if (this.patientId) {
      this.isEdit.set(true);
      this.api.getPatient(this.patientId).subscribe(res => {
        if (res.success && res.data) {
          const p = res.data.patient;
          this.form = { name: p.name, age: p.age, gender: p.gender, bed_number: p.bed_number, ward: p.ward, diagnosis: p.diagnosis };
        }
      });
    }
  }

  onSubmit() {
    this.saving.set(true);
    this.error.set('');
    const obs = this.isEdit()
      ? this.api.updatePatient(this.patientId, this.form)
      : this.api.createPatient(this.form);

    obs.subscribe({
      next: (res) => {
        if (res.success) {
          this.router.navigate(['/patients']);
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
    this.router.navigate(['/patients']);
  }
}
