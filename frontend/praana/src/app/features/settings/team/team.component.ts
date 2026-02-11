import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ApiService } from '../../../core/services/api.service';
import { User } from '../../../core/models';

@Component({
  selector: 'app-team',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    MatCardModule, MatFormFieldModule, MatInputModule, MatSelectModule,
    MatButtonModule, MatIconModule, MatTableModule, MatChipsModule,
    MatDialogModule, MatSnackBarModule, MatProgressSpinnerModule,
  ],
  template: `
    <h2 class="text-2xl font-bold bg-gradient-to-r from-pink-600 to-rose-500 bg-clip-text text-transparent mb-6">Team Management</h2>

    <!-- Invite form -->
    <div class="glass-card p-5 mb-6 max-w-xl">
      <h3 class="text-sm font-semibold text-pink-600 uppercase tracking-wider mb-4">
        <mat-icon class="!text-base align-middle mr-1">send</mat-icon> Invite Team Member
      </h3>
      @if (inviteCode()) {
        <div class="success-toast mb-4">
          <mat-icon class="!text-base mr-2">check_circle</mat-icon>
          <div>
            <p class="font-medium">Invite sent!</p>
            <p class="text-sm mt-0.5">Code: <strong>{{ inviteCode() }}</strong></p>
            <p class="text-xs opacity-70 mt-0.5">(In production, this would be emailed)</p>
          </div>
        </div>
      }
      <form (ngSubmit)="onInvite()" class="flex gap-4 items-end">
        <mat-form-field appearance="outline" class="flex-1">
          <mat-label>Email</mat-label>
          <input matInput type="email" [(ngModel)]="inviteEmail" name="email" required>
          <mat-icon matPrefix class="!text-pink-300 mr-2">email</mat-icon>
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Role</mat-label>
          <mat-select [(ngModel)]="inviteRole" name="role" required>
            <mat-option value="doctor">Doctor</mat-option>
            <mat-option value="nurse">Nurse</mat-option>
          </mat-select>
        </mat-form-field>
        <button mat-flat-button color="primary" type="submit" class="!h-14 !rounded-xl">
          <mat-icon>send</mat-icon> Invite
        </button>
      </form>
    </div>

    <!-- Members list -->
    @if (loading()) {
      <div class="flex justify-center py-12"><mat-spinner></mat-spinner></div>
    } @else {
      <div class="glass-card overflow-hidden">
        <div class="px-5 pt-5 pb-3">
          <h3 class="text-sm font-semibold text-pink-600 uppercase tracking-wider">
            <mat-icon class="!text-base align-middle mr-1">groups</mat-icon> Members ({{ members().length }})
          </h3>
        </div>
        <table mat-table [dataSource]="members()" class="w-full">
          <ng-container matColumnDef="name">
            <th mat-header-cell *matHeaderCellDef class="!text-pink-600 !font-semibold">Name</th>
            <td mat-cell *matCellDef="let m">{{ m.name }}</td>
          </ng-container>
          <ng-container matColumnDef="email">
            <th mat-header-cell *matHeaderCellDef class="!text-pink-600 !font-semibold">Email</th>
            <td mat-cell *matCellDef="let m" class="text-gray-600">{{ m.email }}</td>
          </ng-container>
          <ng-container matColumnDef="role">
            <th mat-header-cell *matHeaderCellDef class="!text-pink-600 !font-semibold">Role</th>
            <td mat-cell *matCellDef="let m">
              <span class="text-xs font-semibold uppercase px-3 py-1 rounded-full"
                [class]="m.role === 'admin' ? 'status-active' : 'status-stable'">{{ m.role }}</span>
            </td>
          </ng-container>
          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef class="!text-pink-600 !font-semibold">Actions</th>
            <td mat-cell *matCellDef="let m">
              @if (m.role !== 'admin') {
                <button mat-icon-button class="!text-rose-400" (click)="removeMember(m.id)">
                  <mat-icon>delete</mat-icon>
                </button>
              }
            </td>
          </ng-container>
          <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
          <tr mat-row *matRowDef="let row; columns: displayedColumns;" class="hover:!bg-pink-50/50 transition-colors"></tr>
        </table>
      </div>
    }
  `,
  styles: [`
    .success-toast {
      background: #ecfdf5; color: #065f46; padding: 12px 14px;
      border-radius: 12px; font-size: 13px;
      display: flex; align-items: flex-start; border: 1px solid #a7f3d0;
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

  ngOnInit() {
    this.loadMembers();
  }

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
        if (res.success && res.data) {
          this.inviteCode.set(res.data.code);
          this.inviteEmail = '';
        }
      },
      error: (err) => {
        this.snackBar.open(err.error?.error || 'Failed to create invite', 'OK', { duration: 3000 });
      }
    });
  }

  removeMember(id: string) {
    if (!confirm('Remove this team member?')) return;
    this.api.removeMember(id).subscribe({
      next: (res) => {
        if (res.success) {
          this.snackBar.open('Member removed', 'OK', { duration: 2000 });
          this.loadMembers();
        }
      },
      error: (err) => {
        this.snackBar.open(err.error?.error || 'Failed', 'OK', { duration: 3000 });
      }
    });
  }
}
