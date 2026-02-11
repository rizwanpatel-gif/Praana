import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ApiService } from '../../../core/services/api.service';

@Component({
  selector: 'app-patient-form',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    MatCardModule, MatFormFieldModule, MatInputModule,
    MatSelectModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule,
  ],
  template: `
    <h2 class="text-2xl font-bold bg-gradient-to-r from-pink-600 to-rose-500 bg-clip-text text-transparent mb-6">
      {{ isEdit() ? 'Edit' : 'Add' }} Patient
    </h2>
    <div class="glass-card max-w-2xl p-6">
      @if (error()) {
        <div class="error-toast mb-4">
          <mat-icon class="!text-base mr-2">error_outline</mat-icon>
          {{ error() }}
        </div>
      }
      <form (ngSubmit)="onSubmit()" class="flex flex-col gap-4">
        <mat-form-field appearance="outline">
          <mat-label>Patient Name</mat-label>
          <input matInput [(ngModel)]="form.name" name="name" required>
          <mat-icon matPrefix class="!text-pink-300 mr-2">person</mat-icon>
        </mat-form-field>
        <div class="grid grid-cols-2 gap-4">
          <mat-form-field appearance="outline">
            <mat-label>Age</mat-label>
            <input matInput type="number" [(ngModel)]="form.age" name="age" required min="0" max="150">
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Gender</mat-label>
            <mat-select [(ngModel)]="form.gender" name="gender" required>
              <mat-option value="male">Male</mat-option>
              <mat-option value="female">Female</mat-option>
              <mat-option value="other">Other</mat-option>
            </mat-select>
          </mat-form-field>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <mat-form-field appearance="outline">
            <mat-label>Bed Number</mat-label>
            <input matInput [(ngModel)]="form.bed_number" name="bed_number">
            <mat-icon matPrefix class="!text-pink-300 mr-2">bed</mat-icon>
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Ward</mat-label>
            <input matInput [(ngModel)]="form.ward" name="ward">
            <mat-icon matPrefix class="!text-pink-300 mr-2">location_on</mat-icon>
          </mat-form-field>
        </div>
        <mat-form-field appearance="outline">
          <mat-label>Diagnosis</mat-label>
          <input matInput [(ngModel)]="form.diagnosis" name="diagnosis">
          <mat-icon matPrefix class="!text-pink-300 mr-2">medical_information</mat-icon>
        </mat-form-field>
        <div class="flex gap-4 mt-2">
          <button mat-flat-button color="primary" type="submit" [disabled]="saving()" class="!rounded-xl !h-12 !px-8">
            @if (saving()) {
              <mat-spinner diameter="20"></mat-spinner>
            } @else {
              {{ isEdit() ? 'Update' : 'Add' }} Patient
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
