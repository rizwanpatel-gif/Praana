import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of, switchMap } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  ApiResponse, Patient, Vitals, Alert, Threshold, Invite,
  Org, User, DashboardOverview, ShiftSummary, OrgStats, UsageStats
} from '../models';
import { DemoService } from './demo.service';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly api = environment.apiUrl;

  constructor(private http: HttpClient, private demo: DemoService) {}

  // Org
  getOrg(): Observable<ApiResponse<Org>> {
    return this.http.get<ApiResponse<Org>>(`${this.api}/org`);
  }

  updateOrg(name: string): Observable<ApiResponse<Org>> {
    return this.http.put<ApiResponse<Org>>(`${this.api}/org`, { name });
  }

  getMembers(): Observable<ApiResponse<User[]>> {
    return this.http.get<ApiResponse<User[]>>(`${this.api}/org/members`);
  }

  removeMember(id: string): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(`${this.api}/org/members/${id}`);
  }

  createInvite(email: string, role: string): Observable<ApiResponse<Invite>> {
    return this.http.post<ApiResponse<Invite>>(`${this.api}/org/invite`, { email, role });
  }

  // Patients — fallback to demo when org has no real patients
  getPatients(): Observable<ApiResponse<Patient[]>> {
    return this.http.get<ApiResponse<Patient[]>>(`${this.api}/patients`).pipe(
      switchMap(res => {
        if (res.success && (!res.data || res.data.length === 0)) return this.demo.patients();
        return of(res);
      })
    );
  }

  getPatient(id: string): Observable<ApiResponse<{ patient: Patient; latest_vitals: Vitals | null }>> {
    return this.http.get<ApiResponse<any>>(`${this.api}/patients/${id}`).pipe(
      switchMap(res => {
        if (!res.success || !res.data) return this.demo.patient(id);
        return of(res);
      })
    );
  }

  createPatient(data: Partial<Patient>): Observable<ApiResponse<Patient>> {
    return this.http.post<ApiResponse<Patient>>(`${this.api}/patients`, data);
  }

  updatePatient(id: string, data: Partial<Patient>): Observable<ApiResponse<Patient>> {
    return this.http.put<ApiResponse<Patient>>(`${this.api}/patients/${id}`, data);
  }

  deletePatient(id: string): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(`${this.api}/patients/${id}`);
  }

  // Vitals — fallback to demo when patient has no vitals history
  recordVitals(patientId: string, data: Partial<Vitals>): Observable<ApiResponse<Vitals>> {
    return this.http.post<ApiResponse<Vitals>>(`${this.api}/patients/${patientId}/vitals`, data);
  }

  bulkRecordVitals(entries: any[]): Observable<ApiResponse<Vitals[]>> {
    return this.http.post<ApiResponse<Vitals[]>>(`${this.api}/vitals/bulk`, { entries });
  }

  getVitalsHistory(patientId: string, range: string = '24h'): Observable<ApiResponse<Vitals[]>> {
    const params = new HttpParams().set('range', range);
    return this.http.get<ApiResponse<Vitals[]>>(`${this.api}/patients/${patientId}/vitals`, { params }).pipe(
      switchMap(res => {
        if (res.success && (!res.data || res.data.length === 0)) return this.demo.vitalsHistory(patientId, range);
        return of(res);
      })
    );
  }

  // Alerts — fallback to demo when no alerts exist
  getActiveAlerts(): Observable<ApiResponse<Alert[]>> {
    return this.http.get<ApiResponse<Alert[]>>(`${this.api}/alerts`).pipe(
      switchMap(res => {
        if (res.success && (!res.data || res.data.length === 0)) return this.demo.activeAlerts();
        return of(res);
      })
    );
  }

  acknowledgeAlert(id: string): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.api}/alerts/${id}/acknowledge`, {});
  }

  getAlertHistory(): Observable<ApiResponse<Alert[]>> {
    return this.http.get<ApiResponse<Alert[]>>(`${this.api}/alerts/history`).pipe(
      switchMap(res => {
        if (res.success && (!res.data || res.data.length === 0)) return this.demo.alertHistory();
        return of(res);
      })
    );
  }

  // Thresholds
  getThresholds(): Observable<ApiResponse<Threshold>> {
    return this.http.get<ApiResponse<Threshold>>(`${this.api}/thresholds`);
  }

  setOrgThresholds(data: Partial<Threshold>): Observable<ApiResponse<Threshold>> {
    return this.http.put<ApiResponse<Threshold>>(`${this.api}/thresholds`, data);
  }

  setPatientThresholds(patientId: string, data: Partial<Threshold>): Observable<ApiResponse<Threshold>> {
    return this.http.put<ApiResponse<Threshold>>(`${this.api}/thresholds/patient/${patientId}`, data);
  }

  // Dashboard — fallback to demo when org is empty
  getDashboardOverview(): Observable<ApiResponse<DashboardOverview>> {
    return this.http.get<ApiResponse<DashboardOverview>>(`${this.api}/dashboard/overview`).pipe(
      switchMap(res => {
        if (res.success && (!res.data?.patients || res.data.patients.length === 0)) return this.demo.dashboardOverview();
        return of(res);
      })
    );
  }

  getPatientTrends(patientId: string): Observable<ApiResponse<Vitals[]>> {
    return this.http.get<ApiResponse<Vitals[]>>(`${this.api}/dashboard/patient/${patientId}/trends`);
  }

  getShiftSummary(): Observable<ApiResponse<ShiftSummary>> {
    return this.http.get<ApiResponse<ShiftSummary>>(`${this.api}/dashboard/shift-summary`).pipe(
      switchMap(res => {
        if (res.success && (!res.data || res.data.vitals_recorded === 0)) return this.demo.shiftSummary();
        return of(res);
      })
    );
  }

  getOrgStats(): Observable<ApiResponse<OrgStats>> {
    return this.http.get<ApiResponse<OrgStats>>(`${this.api}/dashboard/org-stats`).pipe(
      switchMap(res => {
        if (res.success && (!res.data || res.data.total_patients === 0)) return this.demo.orgStats();
        return of(res);
      })
    );
  }

  getUsage(): Observable<ApiResponse<UsageStats>> {
    return this.http.get<ApiResponse<UsageStats>>(`${this.api}/dashboard/usage`).pipe(
      switchMap(res => {
        if (res.success && (!res.data || res.data.vitals_recorded === 0)) return this.demo.usage();
        return of(res);
      })
    );
  }
}
