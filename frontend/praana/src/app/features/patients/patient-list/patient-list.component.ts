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
    <div class="flex flex-wrap justify-between items-center gap-3 mb-6">
      <div>
        <h2 class="text-xl font-bold text-gray-900">Patients</h2>
        <p class="text-gray-500 text-sm mt-0.5">{{ patients().length }} registered patients</p>
      </div>
      <a mat-flat-button color="primary" routerLink="/patients/add">
        <mat-icon class="!text-base">add</mat-icon> Add Patient
      </a>
    </div>

    @if (loading()) {
      <div class="flex justify-center py-12"><mat-spinner diameter="36"></mat-spinner></div>
    } @else {
      <div class="prana-card overflow-hidden">
        <div class="overflow-x-auto">
        <table mat-table [dataSource]="patients()" style="width: 100%; min-width: 580px;">
          <ng-container matColumnDef="name">
            <th mat-header-cell *matHeaderCellDef>Name</th>
            <td mat-cell *matCellDef="let p">
              <a [routerLink]="['/patients', p.id]" class="text-pink-600 hover:text-pink-800 font-medium text-sm">{{ p.name }}</a>
            </td>
          </ng-container>
          <ng-container matColumnDef="age">
            <th mat-header-cell *matHeaderCellDef>Age</th>
            <td mat-cell *matCellDef="let p" class="text-sm">{{ p.age }}</td>
          </ng-container>
          <ng-container matColumnDef="gender">
            <th mat-header-cell *matHeaderCellDef>Gender</th>
            <td mat-cell *matCellDef="let p" class="text-sm capitalize">{{ p.gender }}</td>
          </ng-container>
          <ng-container matColumnDef="bed">
            <th mat-header-cell *matHeaderCellDef>Bed</th>
            <td mat-cell *matCellDef="let p" class="text-sm">{{ p.bed_number }}</td>
          </ng-container>
          <ng-container matColumnDef="ward">
            <th mat-header-cell *matHeaderCellDef>Ward</th>
            <td mat-cell *matCellDef="let p" class="text-sm">{{ p.ward }}</td>
          </ng-container>
          <ng-container matColumnDef="status">
            <th mat-header-cell *matHeaderCellDef>Status</th>
            <td mat-cell *matCellDef="let p">
              <span class="status-badge" [class]="'status-' + p.status">{{ p.status }}</span>
            </td>
          </ng-container>
          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef>Actions</th>
            <td mat-cell *matCellDef="let p">
              <a mat-icon-button [routerLink]="['/vitals', p.id, 'record']" class="!text-pink-500" title="Record Vitals">
                <mat-icon class="!text-base">monitor_heart</mat-icon>
              </a>
              <a mat-icon-button [routerLink]="['/patients', p.id, 'edit']" class="!text-gray-400" title="Edit">
                <mat-icon class="!text-base">edit</mat-icon>
              </a>
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
          <tr mat-row *matRowDef="let row; columns: displayedColumns;" class="hover:!bg-gray-50"></tr>
        </table>
        </div>
      </div>
    }
  `,
  styles: [`
    .status-badge {
      font-size: 11px; font-weight: 600; text-transform: uppercase;
      padding: 2px 8px; border-radius: 4px; letter-spacing: 0.4px;
    }
  `]
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
