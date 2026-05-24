import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
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

  // Patients
  getPatients(): Observable<ApiResponse<Patient[]>> {
    if (this.demo.isActive()) return this.demo.patients();
    return this.http.get<ApiResponse<Patient[]>>(`${this.api}/patients`);
  }

  getPatient(id: string): Observable<ApiResponse<{ patient: Patient; latest_vitals: Vitals | null }>> {
    if (this.demo.isActive()) return this.demo.patient(id);
    return this.http.get<ApiResponse<any>>(`${this.api}/patients/${id}`);
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

  // Vitals
  recordVitals(patientId: string, data: Partial<Vitals>): Observable<ApiResponse<Vitals>> {
    return this.http.post<ApiResponse<Vitals>>(`${this.api}/patients/${patientId}/vitals`, data);
  }

  bulkRecordVitals(entries: any[]): Observable<ApiResponse<Vitals[]>> {
    return this.http.post<ApiResponse<Vitals[]>>(`${this.api}/vitals/bulk`, { entries });
  }

  getVitalsHistory(patientId: string, range: string = '24h'): Observable<ApiResponse<Vitals[]>> {
    if (this.demo.isActive()) return this.demo.vitalsHistory(patientId, range);
    const params = new HttpParams().set('range', range);
    return this.http.get<ApiResponse<Vitals[]>>(`${this.api}/patients/${patientId}/vitals`, { params });
  }

  // Alerts
  getActiveAlerts(): Observable<ApiResponse<Alert[]>> {
    if (this.demo.isActive()) return this.demo.activeAlerts();
    return this.http.get<ApiResponse<Alert[]>>(`${this.api}/alerts`);
  }

  acknowledgeAlert(id: string): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.api}/alerts/${id}/acknowledge`, {});
  }

  getAlertHistory(): Observable<ApiResponse<Alert[]>> {
    if (this.demo.isActive()) return this.demo.alertHistory();
    return this.http.get<ApiResponse<Alert[]>>(`${this.api}/alerts/history`);
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

  // Dashboard
  getDashboardOverview(): Observable<ApiResponse<DashboardOverview>> {
    if (this.demo.isActive()) return this.demo.dashboardOverview();
    return this.http.get<ApiResponse<DashboardOverview>>(`${this.api}/dashboard/overview`);
  }

  getPatientTrends(patientId: string): Observable<ApiResponse<Vitals[]>> {
    return this.http.get<ApiResponse<Vitals[]>>(`${this.api}/dashboard/patient/${patientId}/trends`);
  }

  getShiftSummary(): Observable<ApiResponse<ShiftSummary>> {
    if (this.demo.isActive()) return this.demo.shiftSummary();
    return this.http.get<ApiResponse<ShiftSummary>>(`${this.api}/dashboard/shift-summary`);
  }

  getOrgStats(): Observable<ApiResponse<OrgStats>> {
    if (this.demo.isActive()) return this.demo.orgStats();
    return this.http.get<ApiResponse<OrgStats>>(`${this.api}/dashboard/org-stats`);
  }

  getUsage(): Observable<ApiResponse<UsageStats>> {
    if (this.demo.isActive()) return this.demo.usage();
    return this.http.get<ApiResponse<UsageStats>>(`${this.api}/dashboard/usage`);
  }
}
