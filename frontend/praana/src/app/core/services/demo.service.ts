import { Injectable, signal } from '@angular/core';
import { Observable, of } from 'rxjs';
import {
  ApiResponse, Patient, Vitals, Alert,
  DashboardOverview, ShiftSummary, OrgStats, UsageStats
} from '../models';

const DEMO_KEY = 'praana_demo_mode';

function ts(secsBack = 0): number {
  return Math.floor(Date.now() / 1000) - secsBack;
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

interface VCfg {
  hr: number; bp: number; dbp: number; temp: number; spo2: number; rr: number;
  hrV: number; bpV: number; tempV: number; spo2V: number; rrV: number;
}

const VCFG: Record<string, VCfg> = {
  dp1: { hr:115, bp:158, dbp:96,  temp:37.9, spo2:91, rr:23, hrV:10, bpV:14, tempV:0.3, spo2V:2,  rrV:3 },
  dp2: { hr:76,  bp:126, dbp:80,  temp:36.8, spo2:97, rr:15, hrV:5,  bpV:8,  tempV:0.15,spo2V:1,  rrV:2 },
  dp3: { hr:94,  bp:118, dbp:75,  temp:37.3, spo2:93, rr:22, hrV:8,  bpV:10, tempV:0.3, spo2V:2,  rrV:4 },
  dp4: { hr:108, bp:150, dbp:90,  temp:38.3, spo2:87, rr:25, hrV:12, bpV:12, tempV:0.4, spo2V:3,  rrV:5 },
  dp5: { hr:82,  bp:130, dbp:82,  temp:37.0, spo2:96, rr:16, hrV:6,  bpV:10, tempV:0.2, spo2V:1,  rrV:2 },
  dp6: { hr:90,  bp:136, dbp:86,  temp:36.9, spo2:95, rr:18, hrV:14, bpV:12, tempV:0.2, spo2V:2,  rrV:3 },
  dp7: { hr:72,  bp:120, dbp:76,  temp:36.7, spo2:97, rr:14, hrV:4,  bpV:7,  tempV:0.15,spo2V:1,  rrV:2 },
  dp8: { hr:96,  bp:122, dbp:78,  temp:38.5, spo2:93, rr:20, hrV:8,  bpV:8,  tempV:0.5, spo2V:2,  rrV:3 },
};

function makePatients(): Patient[] {
  const n = ts();
  return [
    { id:'dp1', org_id:'demo', name:'Sarah Mitchell',   age:67, gender:'female', bed_number:'1A', ward:'Cardiac ICU',     diagnosis:'Post-operative cardiac care',        status:'critical', admitted_at:ts(50*3600), created_at:n, updated_at:n },
    { id:'dp2', org_id:'demo', name:'James Rodriguez',  age:45, gender:'male',   bed_number:'2A', ward:'Cardiology',      diagnosis:'Hypertensive crisis — stabilised',   status:'stable',   admitted_at:ts(36*3600), created_at:n, updated_at:n },
    { id:'dp3', org_id:'demo', name:'Emily Chen',       age:32, gender:'female', bed_number:'5B', ward:'Respiratory',     diagnosis:'Acute asthma exacerbation',          status:'active',   admitted_at:ts(24*3600), created_at:n, updated_at:n },
    { id:'dp4', org_id:'demo', name:'Robert Thompson',  age:78, gender:'male',   bed_number:'6B', ward:'Respiratory',     diagnosis:'COPD exacerbation',                  status:'critical', admitted_at:ts(72*3600), created_at:n, updated_at:n },
    { id:'dp5', org_id:'demo', name:'Priya Sharma',     age:55, gender:'female', bed_number:'3C', ward:'General Medicine',diagnosis:'Diabetic ketoacidosis',               status:'stable',   admitted_at:ts(48*3600), created_at:n, updated_at:n },
    { id:'dp6', org_id:'demo', name:'Michael Foster',   age:62, gender:'male',   bed_number:'4C', ward:'Cardiology',      diagnosis:'Atrial fibrillation with RVR',       status:'active',   admitted_at:ts(30*3600), created_at:n, updated_at:n },
    { id:'dp7', org_id:'demo', name:'Linda Patel',      age:70, gender:'female', bed_number:'7D', ward:'Neurology',       diagnosis:'Ischemic stroke — monitoring',        status:'stable',   admitted_at:ts(96*3600), created_at:n, updated_at:n },
    { id:'dp8', org_id:'demo', name:'David Kim',        age:41, gender:'male',   bed_number:'8D', ward:'General Medicine',diagnosis:'Community-acquired pneumonia',        status:'active',   admitted_at:ts(20*3600), created_at:n, updated_at:n },
  ];
}

function generateVitals(pid: string, steps: number, stepSecs: number): Vitals[] {
  const cfg = VCFG[pid];
  if (!cfg) return [];
  const result: Vitals[] = [];
  for (let i = steps; i >= 0; i--) {
    const t = ts(i * stepSecs);
    const phase = ((steps - i) / steps) * 2 * Math.PI;
    const s = Math.sin(phase);
    const noise = (v: number) => (Math.random() - 0.5) * v;
    result.push({
      id: `dv-${pid}-${i}`,
      patient_id: pid,
      org_id: 'demo',
      recorded_by: 'Demo User',
      heart_rate:       clamp(Math.round(cfg.hr   + s*cfg.hrV/2   + noise(cfg.hrV)),   40,  200),
      systolic_bp:      clamp(Math.round(cfg.bp   + s*cfg.bpV/2   + noise(cfg.bpV)),   70,  220),
      diastolic_bp:     clamp(Math.round(cfg.dbp  + s*cfg.bpV/3   + noise(cfg.bpV/2)), 40,  130),
      temperature:      clamp(Math.round((cfg.temp+ s*cfg.tempV/2 + noise(cfg.tempV))*10)/10, 35, 42),
      spo2:             clamp(Math.round(cfg.spo2 + s*cfg.spo2V/2 + noise(cfg.spo2V)), 70,  100),
      respiratory_rate: clamp(Math.round(cfg.rr   + s*cfg.rrV/2   + noise(cfg.rrV)),   8,   40),
      recorded_at: t,
      notes: '',
    });
  }
  return result;
}

function makeAlerts(patients: Patient[]): Alert[] {
  const critical = patients.filter(p => p.status === 'critical');
  const alerts: Alert[] = [];

  for (const p of critical) {
    const cfg = VCFG[p.id];
    alerts.push({
      id: `da-${p.id}-hr`, org_id: 'demo', patient_id: p.id, patient_name: p.name,
      vital_type: 'heart_rate', value: cfg.hr + cfg.hrV, threshold: 100,
      severity: 'critical',
      message: `${p.name}: heart_rate ${cfg.hr + cfg.hrV} exceeds 100.0`,
      acknowledged: false, created_at: ts(25 * 60),
    });
    alerts.push({
      id: `da-${p.id}-spo2`, org_id: 'demo', patient_id: p.id, patient_name: p.name,
      vital_type: 'spo2', value: cfg.spo2, threshold: 92,
      severity: 'critical',
      message: `${p.name}: spo2 ${cfg.spo2} below 92.0`,
      acknowledged: false, created_at: ts(10 * 60),
    });
  }
  return alerts;
}

function makeAlertHistory(patients: Patient[]): Alert[] {
  return patients.map((p, i) => {
    const cfg = VCFG[p.id];
    return {
      id: `dah-${p.id}`, org_id: 'demo', patient_id: p.id, patient_name: p.name,
      vital_type: 'heart_rate', value: cfg.hr + cfg.hrV * 0.5, threshold: 100,
      severity: 'warning' as const,
      message: `${p.name}: heart_rate elevated, monitoring in progress`,
      acknowledged: true,
      acknowledged_at: ts((i + 2) * 3600 - 1800),
      created_at: ts((i + 2) * 3600),
    };
  });
}

@Injectable({ providedIn: 'root' })
export class DemoService {
  private _active = signal(localStorage.getItem(DEMO_KEY) === '1');

  isActive() { return this._active(); }

  activate() {
    localStorage.setItem(DEMO_KEY, '1');
    this._active.set(true);
  }

  deactivate() {
    localStorage.removeItem(DEMO_KEY);
    this._active.set(false);
  }

  // ── API stubs ──────────────────────────────────────────────

  patients(): Observable<ApiResponse<Patient[]>> {
    return of({ success: true, data: makePatients() });
  }

  patient(id: string): Observable<ApiResponse<{ patient: Patient; latest_vitals: Vitals | null }>> {
    const p = makePatients().find(x => x.id === id);
    if (!p) return of({ success: false, error: 'not found' });
    const vitals = generateVitals(id, 48, 30 * 60);
    const latest = vitals[vitals.length - 1] ?? null;
    return of({ success: true, data: { patient: p, latest_vitals: latest } });
  }

  vitalsHistory(pid: string, range: string): Observable<ApiResponse<Vitals[]>> {
    const stepMap: Record<string, [number, number]> = {
      '6h': [12, 30*60], '12h': [24, 30*60], '24h': [48, 30*60], '7d': [56, 3*3600],
    };
    const [steps, stepSecs] = stepMap[range] ?? [48, 30*60];
    return of({ success: true, data: generateVitals(pid, steps, stepSecs) });
  }

  dashboardOverview(): Observable<ApiResponse<DashboardOverview>> {
    const patients = makePatients();
    const active = patients.filter(p => p.status !== 'discharged');
    const summary = active.map(p => {
      const vitals = generateVitals(p.id, 48, 30*60);
      return { patient: p, latest_vitals: vitals[vitals.length - 1], alert_count: p.status === 'critical' ? 2 : 0 };
    });
    return of({
      success: true,
      data: {
        total_patients: active.length,
        critical_count: active.filter(p => p.status === 'critical').length,
        stable_count:   active.filter(p => p.status !== 'critical').length,
        active_alerts:  4,
        patients: summary,
      },
    });
  }

  shiftSummary(): Observable<ApiResponse<ShiftSummary>> {
    const now = ts();
    return of({
      success: true,
      data: { shift_start: now - 6*3600, shift_end: now + 2*3600, vitals_recorded: 47, alerts_triggered: 6, alerts_acknowledged: 4, patients_checked: 8 },
    });
  }

  activeAlerts(): Observable<ApiResponse<Alert[]>> {
    return of({ success: true, data: makeAlerts(makePatients()) });
  }

  alertHistory(): Observable<ApiResponse<Alert[]>> {
    const patients = makePatients();
    return of({ success: true, data: [...makeAlerts(patients), ...makeAlertHistory(patients)] });
  }

  orgStats(): Observable<ApiResponse<OrgStats>> {
    return of({ success: true, data: { total_patients: 8, active_patients: 8, total_members: 3, total_vitals: 384, total_alerts: 12 } });
  }

  usage(): Observable<ApiResponse<UsageStats>> {
    const month = new Date().toISOString().slice(0, 7);
    return of({ success: true, data: { month, vitals_recorded: 384, alerts_generated: 12, active_patients: 8 } });
  }
}
