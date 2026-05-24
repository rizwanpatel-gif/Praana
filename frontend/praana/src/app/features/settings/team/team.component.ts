import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ApiService } from '../../../core/services/api.service';
import { User } from '../../../core/models';

@Component({
  selector: 'app-team',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    MatButtonModule, MatIconModule, MatTableModule,
    MatSnackBarModule, MatProgressSpinnerModule,
  ],
  template: `
    <div class="mb-6">
      <h2 class="text-xl font-bold text-gray-900">Team Management</h2>
      <p class="text-gray-500 text-sm mt-0.5">Invite and manage team members</p>
    </div>

    <!-- Invite form -->
    <div class="prana-card p-5 mb-5 max-w-2xl">
      <p class="section-label mb-4">Invite Team Member</p>

      @if (inviteCode()) {
        <div class="alert-success mb-4">
          <mat-icon class="!text-base flex-shrink-0">check_circle</mat-icon>
          <div>
            <p class="font-medium">Invite created</p>
            <p class="text-sm mt-0.5">Code: <strong class="font-mono">{{ inviteCode() }}</strong></p>
            <p class="text-xs text-gray-400 mt-0.5">In production this would be emailed automatically</p>
          </div>
        </div>
      }

      <form (ngSubmit)="onInvite()" class="flex flex-wrap gap-4 items-end">
        <div class="form-group flex-1 min-w-48">
          <label class="form-label">Email</label>
          <input class="form-input" type="email" [(ngModel)]="inviteEmail" name="email" required>
        </div>
        <div class="form-group" style="width: 140px">
          <label class="form-label">Role</label>
          <select class="form-input" [(ngModel)]="inviteRole" name="role" required>
            <option value="doctor">Doctor</option>
            <option value="nurse">Nurse</option>
          </select>
        </div>
        <button type="submit" class="invite-btn">
          <mat-icon class="!text-base">send</mat-icon> Send Invite
        </button>
      </form>
    </div>

    <!-- Members list -->
    @if (loading()) {
      <div class="flex justify-center py-12"><mat-spinner diameter="36"></mat-spinner></div>
    } @else {
      <div class="prana-card overflow-hidden">
        <div class="px-5 pt-5 pb-3 border-b border-gray-100">
          <p class="section-label">Members ({{ members().length }})</p>
        </div>
        <div class="overflow-x-auto">
        <table mat-table [dataSource]="members()" style="width: 100%; min-width: 420px;">
          <ng-container matColumnDef="name">
            <th mat-header-cell *matHeaderCellDef>Name</th>
            <td mat-cell *matCellDef="let m" class="font-medium text-gray-800">{{ m.name }}</td>
          </ng-container>
          <ng-container matColumnDef="email">
            <th mat-header-cell *matHeaderCellDef>Email</th>
            <td mat-cell *matCellDef="let m" class="text-gray-500 text-sm">{{ m.email }}</td>
          </ng-container>
          <ng-container matColumnDef="role">
            <th mat-header-cell *matHeaderCellDef>Role</th>
            <td mat-cell *matCellDef="let m">
              <span class="role-badge" [class.role-badge--admin]="m.role === 'admin'">{{ m.role }}</span>
            </td>
          </ng-container>
          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef></th>
            <td mat-cell *matCellDef="let m">
              @if (m.role !== 'admin') {
                <button mat-icon-button class="!text-gray-400 hover:!text-red-500" (click)="removeMember(m.id)">
                  <mat-icon class="!text-base">delete</mat-icon>
                </button>
              }
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
    .section-label {
      font-size: 11px; font-weight: 600; text-transform: uppercase;
      letter-spacing: 0.06em; color: #6b7280; margin: 0;
    }
    .alert-success {
      background: #ecfdf5; color: #065f46; padding: 12px 14px;
      border-radius: 8px; font-size: 13px;
      display: flex; align-items: flex-start; gap: 8px; border: 1px solid #a7f3d0;
    }
    .invite-btn {
      height: 42px; padding: 0 20px;
      background: #db2777; color: #ffffff;
      border: none; border-radius: 8px;
      font-size: 14px; font-weight: 600; font-family: inherit;
      cursor: pointer; display: flex; align-items: center; gap: 6px;
      align-self: flex-end;
      &:hover { background: #be185d; }
    }
    .role-badge {
      font-size: 10px; font-weight: 600; text-transform: uppercase;
      padding: 2px 8px; border-radius: 4px;
      background: #d1fae5; color: #065f46; border: 1px solid #a7f3d0;
    }
    .role-badge--admin {
      background: #fce7f3; color: #9d174d; border: 1px solid #fbcfe8;
    }
  `]
})
export class TeamComponent implements OnInit {
  members = signal<User[]>([]);
  loading = signal(true);
  inviteEmail = '';
  inviteRole = 'doctor';
  inviteCode = signal('');
  displayedColumns = ['name', 'email', 'role', 'actions'];

  constructor(private api: ApiService, private snackBar: MatSnackBar) {}

  ngOnInit() { this.loadMembers(); }

  loadMembers() {
    this.api.getMembers().subscribe(res => {
      if (res.success && res.data) this.members.set(res.data);
      this.loading.set(false);
    });
  }

  onInvite() {
    this.inviteCode.set('');
    this.api.createInvite(this.inviteEmail, this.inviteRole).subscribe({
      next: (res) => {
        if (res.success && res.data) { this.inviteCode.set(res.data.code); this.inviteEmail = ''; }
      },
      error: (err) => { this.snackBar.open(err.error?.error || 'Failed to create invite', 'OK', { duration: 3000 }); }
    });
  }

  removeMember(id: string) {
    if (!confirm('Remove this team member?')) return;
    this.api.removeMember(id).subscribe({
      next: (res) => {
        if (res.success) { this.snackBar.open('Member removed', 'OK', { duration: 2000 }); this.loadMembers(); }
      },
      error: (err) => { this.snackBar.open(err.error?.error || 'Failed', 'OK', { duration: 3000 }); }
    });
  }
}
