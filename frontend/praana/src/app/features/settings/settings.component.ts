import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ApiService } from '../../core/services/api.service';
import { Org, OrgStats, UsageStats } from '../../core/models';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    MatCardModule, MatFormFieldModule, MatInputModule,
    MatButtonModule, MatChipsModule, MatIconModule, MatSnackBarModule, MatProgressSpinnerModule,
  ],
  template: `
    <h2 class="text-2xl font-bold bg-gradient-to-r from-pink-600 to-rose-500 bg-clip-text text-transparent mb-6">Organization Settings</h2>

    @if (loading()) {
      <div class="flex justify-center py-12"><mat-spinner></mat-spinner></div>
    } @else {
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Org Info -->
        <div class="glass-card p-5">
          <h3 class="text-sm font-semibold text-pink-600 uppercase tracking-wider mb-4">
            <mat-icon class="!text-base align-middle mr-1">apartment</mat-icon> Organization
          </h3>
          <form (ngSubmit)="updateOrg()" class="flex flex-col gap-4">
            <mat-form-field appearance="outline">
              <mat-label>Organization Name</mat-label>
              <input matInput [(ngModel)]="orgName" name="orgName" required>
            </mat-form-field>
            <div class="flex items-center gap-2">
              <span class="text-pink-400 text-sm">Plan:</span>
              <span class="status-active text-xs font-semibold uppercase px-3 py-1 rounded-full">{{ org()?.plan }}</span>
            </div>
            <button mat-flat-button color="primary" type="submit" class="!rounded-xl !h-11">Save</button>
          </form>
        </div>

        <!-- Org Stats -->
        @if (stats()) {
          <div class="glass-card p-5">
            <h3 class="text-sm font-semibold text-pink-600 uppercase tracking-wider mb-4">
              <mat-icon class="!text-base align-middle mr-1">analytics</mat-icon> Statistics
            </h3>
            <div class="grid grid-cols-2 gap-3">
              <div class="stat-cell">
                <p class="text-2xl font-bold text-gray-800">{{ stats()!.total_patients }}</p>
                <p class="text-xs text-pink-400 mt-1">Total Patients</p>
              </div>
              <div class="stat-cell">
                <p class="text-2xl font-bold text-gray-800">{{ stats()!.active_patients }}</p>
                <p class="text-xs text-pink-400 mt-1">Active Patients</p>
              </div>
              <div class="stat-cell">
                <p class="text-2xl font-bold text-gray-800">{{ stats()!.total_members }}</p>
                <p class="text-xs text-pink-400 mt-1">Team Members</p>
              </div>
              <div class="stat-cell">
                <p class="text-2xl font-bold text-gray-800">{{ stats()!.total_vitals }}</p>
                <p class="text-xs text-pink-400 mt-1">Vitals This Month</p>
              </div>
            </div>
          </div>
        }

        <!-- Usage -->
        @if (usage()) {
          <div class="glass-card p-5 lg:col-span-2">
            <h3 class="text-sm font-semibold text-pink-600 uppercase tracking-wider mb-4">
              <mat-icon class="!text-base align-middle mr-1">bar_chart</mat-icon> Usage ({{ usage()!.month }})
            </h3>
            <div class="grid grid-cols-3 gap-3">
              <div class="stat-cell">
                <p class="text-2xl font-bold text-gray-800">{{ usage()!.vitals_recorded }}</p>
                <p class="text-xs text-pink-400 mt-1">Vitals Recorded</p>
              </div>
              <div class="stat-cell">
                <p class="text-2xl font-bold text-gray-800">{{ usage()!.alerts_generated }}</p>
                <p class="text-xs text-pink-400 mt-1">Alerts Generated</p>
              </div>
              <div class="stat-cell">
                <p class="text-2xl font-bold text-gray-800">{{ usage()!.active_patients }}</p>
                <p class="text-xs text-pink-400 mt-1">Active Patients</p>
              </div>
            </div>
          </div>
        }
      </div>
    }
  `,
  styles: [`
    .stat-cell {
      text-align: center; padding: 16px;
      background: rgba(253, 242, 248, 0.5);
      border-radius: 12px;
    }
  `]
})
export class SettingsComponent implements OnInit {
  org = signal<Org | null>(null);
  stats = signal<OrgStats | null>(null);
  usage = signal<UsageStats | null>(null);
  loading = signal(true);
  orgName = '';

  constructor(private api: ApiService, private snackBar: MatSnackBar) {}

  ngOnInit() {
    this.api.getOrg().subscribe(res => {
      if (res.success && res.data) {
        this.org.set(res.data);
        this.orgName = res.data.name;
      }
      this.loading.set(false);
    });
    this.api.getOrgStats().subscribe(res => {
      if (res.success && res.data) this.stats.set(res.data);
    });
    this.api.getUsage().subscribe(res => {
      if (res.success && res.data) this.usage.set(res.data);
    });
  }

  updateOrg() {
    this.api.updateOrg(this.orgName).subscribe(res => {
      if (res.success) {
        this.snackBar.open('Organization updated', 'OK', { duration: 2000 });
      }
    });
  }
}
