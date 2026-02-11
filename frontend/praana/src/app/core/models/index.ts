export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'doctor' | 'nurse';
  org_id: string;
  created_at: number;
}

export interface Org {
  id: string;
  name: string;
  plan: 'free' | 'pro' | 'enterprise';
  created_at: number;
  updated_at: number;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface Patient {
  id: string;
  org_id: string;
  name: string;
  age: number;
  gender: string;
  bed_number: string;
  ward: string;
  diagnosis: string;
  status: 'active' | 'discharged' | 'critical' | 'stable';
  admitted_at: number;
  discharged_at?: number;
  created_at: number;
  updated_at: number;
}

export interface Vitals {
  id: string;
  patient_id: string;
  org_id: string;
  heart_rate: number;
  systolic_bp: number;
  diastolic_bp: number;
  temperature: number;
  spo2: number;
  respiratory_rate: number;
  recorded_by: string;
  recorded_at: number;
  notes?: string;
}

export interface Alert {
  id: string;
  org_id: string;
  patient_id: string;
  patient_name: string;
  vital_type: string;
  value: number;
  threshold: number;
  severity: 'warning' | 'critical';
  message: string;
  acknowledged: boolean;
  acknowledged_by?: string;
  acknowledged_at?: number;
  created_at: number;
}

export interface Threshold {
  heart_rate_high: number;
  heart_rate_low: number;
  systolic_bp_high: number;
  systolic_bp_low: number;
  diastolic_bp_high: number;
  diastolic_bp_low: number;
  temperature_high: number;
  temperature_low: number;
  spo2_low: number;
  respiratory_rate_high: number;
  respiratory_rate_low: number;
}

export interface Invite {
  code: string;
  email: string;
  role: string;
  org_id: string;
}

export interface DashboardOverview {
  total_patients: number;
  critical_count: number;
  stable_count: number;
  active_alerts: number;
  patients: PatientSummary[];
}

export interface PatientSummary {
  patient: Patient;
  latest_vitals?: Vitals;
  alert_count: number;
}

export interface ShiftSummary {
  shift_start: number;
  shift_end: number;
  vitals_recorded: number;
  alerts_triggered: number;
  alerts_acknowledged: number;
  patients_checked: number;
}

export interface OrgStats {
  total_patients: number;
  active_patients: number;
  total_members: number;
  total_vitals: number;
  total_alerts: number;
}

export interface UsageStats {
  month: string;
  vitals_recorded: number;
  alerts_generated: number;
  active_patients: number;
}
