import { Routes } from '@angular/router';
import { authGuard, guestGuard, adminGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  {
    path: 'auth',
    canActivate: [guestGuard],
    children: [
      { path: 'login', loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent) },
      { path: 'signup', loadComponent: () => import('./features/auth/signup/signup.component').then(m => m.SignupComponent) },
      { path: 'invite', loadComponent: () => import('./features/auth/invite/invite.component').then(m => m.InviteComponent) },
    ]
  },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent),
  },
  {
    path: 'patients',
    canActivate: [authGuard],
    children: [
      { path: '', loadComponent: () => import('./features/patients/patient-list/patient-list.component').then(m => m.PatientListComponent) },
      { path: 'add', loadComponent: () => import('./features/patients/patient-form/patient-form.component').then(m => m.PatientFormComponent) },
      { path: ':id', loadComponent: () => import('./features/patients/patient-detail/patient-detail.component').then(m => m.PatientDetailComponent) },
      { path: ':id/edit', loadComponent: () => import('./features/patients/patient-form/patient-form.component').then(m => m.PatientFormComponent) },
    ]
  },
  {
    path: 'vitals',
    canActivate: [authGuard],
    children: [
      { path: 'quick-entry', loadComponent: () => import('./features/vitals/quick-entry/quick-entry.component').then(m => m.QuickEntryComponent) },
      { path: ':patientId/record', loadComponent: () => import('./features/vitals/vitals-entry/vitals-entry.component').then(m => m.VitalsEntryComponent) },
      { path: ':patientId/history', loadComponent: () => import('./features/vitals/vitals-history/vitals-history.component').then(m => m.VitalsHistoryComponent) },
    ]
  },
  {
    path: 'alerts',
    canActivate: [authGuard],
    children: [
      { path: '', loadComponent: () => import('./features/alerts/alert-list/alert-list.component').then(m => m.AlertListComponent) },
      { path: 'thresholds', loadComponent: () => import('./features/alerts/threshold-config/threshold-config.component').then(m => m.ThresholdConfigComponent) },
    ]
  },
  {
    path: 'settings',
    canActivate: [authGuard, adminGuard],
    children: [
      { path: '', loadComponent: () => import('./features/settings/settings.component').then(m => m.SettingsComponent) },
      { path: 'team', loadComponent: () => import('./features/settings/team/team.component').then(m => m.TeamComponent) },
    ]
  },
  { path: '**', redirectTo: '/dashboard' },
];
