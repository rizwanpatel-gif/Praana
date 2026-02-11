import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ApiService } from '../../../core/services/api.service';
import { Patient } from '../../../core/models';

@Component({
  selector: 'app-patient-list',
  standalone: true,
  imports: [
    CommonModule, RouterLink,
    MatTableModule, MatButtonModule, MatIconModule, MatChipsModule, MatProgressSpinnerModule,
  ],
  template: `
    <div class="flex justify-between items-center mb-6">
      <div>
        <h2 class="text-2xl font-bold bg-gradient-to-r from-pink-600 to-rose-500 bg-clip-text text-transparent">Patients</h2>
        <p class="text-pink-300 text-sm">{{ patients().length }} patients</p>
      </div>
      <a mat-flat-button color="primary" routerLink="/patients/add">
        <mat-icon>add</mat-icon> Add Patient
      </a>
    </div>

    @if (loading()) {
      <div class="flex justify-center py-12"><mat-spinner></mat-spinner></div>
    } @else {
      <div class="glass-card overflow-hidden">
        <table mat-table [dataSource]="patients()" class="w-full">
          <ng-container matColumnDef="name">
            <th mat-header-cell *matHeaderCellDef class="!text-pink-600 !font-semibold">Name</th>
            <td mat-cell *matCellDef="let p">
              <a [routerLink]="['/patients', p.id]" class="text-pink-600 hover:text-pink-800 font-medium">{{ p.name }}</a>
            </td>
          </ng-container>
          <ng-container matColumnDef="age">
            <th mat-header-cell *matHeaderCellDef class="!text-pink-600 !font-semibold">Age</th>
            <td mat-cell *matCellDef="let p">{{ p.age }}</td>
          </ng-container>
          <ng-container matColumnDef="gender">
            <th mat-header-cell *matHeaderCellDef class="!text-pink-600 !font-semibold">Gender</th>
            <td mat-cell *matCellDef="let p">{{ p.gender }}</td>
          </ng-container>
          <ng-container matColumnDef="bed">
            <th mat-header-cell *matHeaderCellDef class="!text-pink-600 !font-semibold">Bed</th>
            <td mat-cell *matCellDef="let p">{{ p.bed_number }}</td>
          </ng-container>
          <ng-container matColumnDef="ward">
            <th mat-header-cell *matHeaderCellDef class="!text-pink-600 !font-semibold">Ward</th>
            <td mat-cell *matCellDef="let p">{{ p.ward }}</td>
          </ng-container>
          <ng-container matColumnDef="status">
            <th mat-header-cell *matHeaderCellDef class="!text-pink-600 !font-semibold">Status</th>
            <td mat-cell *matCellDef="let p">
              <mat-chip [class]="'status-' + p.status">{{ p.status }}</mat-chip>
            </td>
          </ng-container>
          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef class="!text-pink-600 !font-semibold">Actions</th>
            <td mat-cell *matCellDef="let p">
              <a mat-icon-button [routerLink]="['/vitals', p.id, 'record']" class="!text-pink-500">
                <mat-icon>monitor_heart</mat-icon>
              </a>
              <a mat-icon-button [routerLink]="['/patients', p.id, 'edit']" class="!text-pink-400">
                <mat-icon>edit</mat-icon>
              </a>
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
          <tr mat-row *matRowDef="let row; columns: displayedColumns;" class="hover:!bg-pink-50/50 transition-colors"></tr>
        </table>
      </div>
    }
  `,
})
export class PatientListComponent implements OnInit {
  patients = signal<Patient[]>([]);
  loading = signal(true);
  displayedColumns = ['name', 'age', 'gender', 'bed', 'ward', 'status', 'actions'];

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.api.getPatients().subscribe(res => {
      if (res.success && res.data) {
        this.patients.set(res.data);
      }
      this.loading.set(false);
    });
  }
}
