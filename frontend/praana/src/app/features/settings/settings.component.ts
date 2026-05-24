import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ApiService } from '../../core/services/api.service';
import { DemoService } from '../../core/services/demo.service';
import { Org, OrgStats, UsageStats } from '../../core/models';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatSnackBarModule, MatProgressSpinnerModule],
  template: `
    <div class="mb-6">
      <h2 class="text-xl font-bold text-gray-900">Organization Settings</h2>
      <p class="text-gray-500 text-sm mt-0.5">Manage your organization configuration</p>
    </div>

    <!-- Demo data banner -->
    <div class="demo-banner mb-5" [class.demo-banner--active]="demo.isActive()">
      <div class="flex items-start gap-3">
        <mat-icon class="flex-shrink-0 mt-0.5" [class.!text-indigo-500]="!demo.isActive()" [class.!text-emerald-600]="demo.isActive()">
          {{ demo.isActive() ? 'science' : 'auto_awesome' }}
        </mat-icon>
        <div class="min-w-0">
          <p class="font-semibold text-gray-800 text-sm">
            {{ demo.isActive() ? 'Demo Mode Active' : 'Load Demo Data' }}
          </p>
          <p class="text-gray-500 text-xs mt-0.5">
            {{ demo.isActive()
              ? '8 demo patients with 24 h vitals history are shown. Your real data is untouched.'
              : 'Preview the app with 8 realistic patients, vitals charts, and alerts — no backend changes needed.' }}
          </p>
        </div>
      </div>
      @if (demo.isActive()) {
        <button class="seed-btn seed-btn--off" (click)="onDeactivateDemo()">
          <mat-icon class="!text-base">close</mat-icon> Exit Demo
        </button>
      } @else {
        <button class="seed-btn" (click)="onActivateDemo()">
          <mat-icon class="!text-base">play_arrow</mat-icon> Load Demo
        </button>
      }
    </div>

    @if (loading()) {
      <div class="flex justify-center py-12"><mat-spinner diameter="36"></mat-spinner></div>
    } @else {
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <!-- Org Info -->
        <div class="prana-card p-5">
          <p class="section-label mb-4">Organization</p>
          <form (ngSubmit)="updateOrg()" class="flex flex-col gap-4">
            <div class="form-group">
              <label class="form-label">Organization Name</label>
              <input class="form-input" type="text" [(ngModel)]="orgName" name="orgName" required>
            </div>
            <div class="flex items-center gap-2">
              <span class="text-xs text-gray-500 font-medium">Plan:</span>
              <span class="plan-badge">{{ org()?.plan }}</span>
            </div>
            <button type="submit" class="submit-btn w-fit">Save Changes</button>
          </form>
        </div>

        <!-- Org Stats -->
        @if (stats()) {
          <div class="prana-card p-5">
            <p class="section-label mb-4">Statistics</p>
            <div class="grid grid-cols-2 gap-3">
              <div class="stat-cell">
                <p class="text-2xl font-bold text-gray-900">{{ stats()!.total_patients }}</p>
                <p class="text-xs text-gray-400 mt-1">Total Patients</p>
              </div>
              <div class="stat-cell">
                <p class="text-2xl font-bold text-gray-900">{{ stats()!.active_patients }}</p>
                <p class="text-xs text-gray-400 mt-1">Active Patients</p>
              </div>
              <div class="stat-cell">
                <p class="text-2xl font-bold text-gray-900">{{ stats()!.total_members }}</p>
                <p class="text-xs text-gray-400 mt-1">Team Members</p>
              </div>
              <div class="stat-cell">
                <p class="text-2xl font-bold text-gray-900">{{ stats()!.total_vitals }}</p>
                <p class="text-xs text-gray-400 mt-1">Vitals This Month</p>
              </div>
            </div>
          </div>
        }

        @if (usage()) {
          <div class="prana-card p-5 lg:col-span-2">
            <p class="section-label mb-4">Usage — {{ usage()!.month }}</p>
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div class="stat-cell">
                <p class="text-2xl font-bold text-gray-900">{{ usage()!.vitals_recorded }}</p>
                <p class="text-xs text-gray-400 mt-1">Vitals Recorded</p>
              </div>
              <div class="stat-cell">
                <p class="text-2xl font-bold text-gray-900">{{ usage()!.alerts_generated }}</p>
                <p class="text-xs text-gray-400 mt-1">Alerts Generated</p>
              </div>
              <div class="stat-cell">
                <p class="text-2xl font-bold text-gray-900">{{ usage()!.active_patients }}</p>
                <p class="text-xs text-gray-400 mt-1">Active Patients</p>
              </div>
            </div>
          </div>
        }
      </div>
    }
  `,
  styles: [`
    .section-label {
      font-size: 11px; font-weight: 600; text-transform: uppercase;
      letter-spacing: 0.06em; color: #6b7280; margin: 0;
    }
    .stat-cell {
      text-align: center; padding: 16px 12px;
      background: #f9fafb; border: 1px solid #f3f4f6; border-radius: 8px;
    }
    .plan-badge {
      font-size: 11px; font-weight: 600; text-transform: uppercase;
      padding: 2px 8px; border-radius: 4px;
      background: #fce7f3; color: #9d174d; border: 1px solid #fbcfe8;
    }
    .submit-btn {
      height: 42px; padding: 0 20px;
      background: #db2777; color: #ffffff;
      border: none; border-radius: 8px;
      font-size: 14px; font-weight: 600; font-family: inherit; cursor: pointer;
      &:hover { background: #be185d; }
    }
    .demo-banner {
      background: #f5f3ff; border: 1px solid #ddd6fe; border-radius: 10px;
      padding: 16px 20px;
      display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap;
    }
    .demo-banner--active {
      background: #f0fdf4; border-color: #bbf7d0;
    }
    .seed-btn {
      height: 38px; padding: 0 16px;
      background: #6366f1; color: #ffffff;
      border: none; border-radius: 8px;
      font-size: 13px; font-weight: 600; font-family: inherit; cursor: pointer;
      display: flex; align-items: center; gap: 6px; flex-shrink: 0;
      &:hover { background: #4f46e5; }
    }
    .seed-btn--off {
      background: #6b7280;
      &:hover { background: #4b5563; }
    }
  `]
})
export class SettingsComponent implements OnInit {
  org = signal<Org | null>(null);
  stats = signal<OrgStats | null>(null);
  usage = signal<UsageStats | null>(null);
  loading = signal(true);

  constructor(
    private api: ApiService,
    public demo: DemoService,
    private snackBar: MatSnackBar,
  ) {}

  ngOnInit() {
    this.api.getOrg().subscribe(res => {
      if (res.success && res.data) { this.org.set(res.data); this.orgName = res.data.name; }
      this.loading.set(false);
    });
    this.api.getOrgStats().subscribe(res => { if (res.success && res.data) this.stats.set(res.data); });
    this.api.getUsage().subscribe(res => { if (res.success && res.data) this.usage.set(res.data); });
  }

  orgName = '';

  updateOrg() {
    this.api.updateOrg(this.orgName).subscribe(res => {
      if (res.success) this.snackBar.open('Organization updated', 'OK', { duration: 2000 });
    });
  }

  onActivateDemo() {
    this.demo.activate();
    this.snackBar.open('Demo mode on — navigate to Dashboard or Patients to see data', 'OK', { duration: 4000 });
    this.ngOnInit();
  }

  onDeactivateDemo() {
    this.demo.deactivate();
    this.snackBar.open('Demo mode off — showing your real data', 'OK', { duration: 3000 });
    this.ngOnInit();
  }
}
