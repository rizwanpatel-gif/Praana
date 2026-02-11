package models

type DashboardOverview struct {
	TotalPatients    int              `json:"total_patients"`
	CriticalCount    int              `json:"critical_count"`
	StableCount      int              `json:"stable_count"`
	ActiveAlerts     int              `json:"active_alerts"`
	Patients         []PatientSummary `json:"patients"`
}

type PatientSummary struct {
	Patient      Patient  `json:"patient"`
	LatestVitals *Vitals  `json:"latest_vitals,omitempty"`
	AlertCount   int      `json:"alert_count"`
}

type ShiftSummary struct {
	ShiftStart      int64 `json:"shift_start"`
	ShiftEnd        int64 `json:"shift_end"`
	VitalsRecorded  int   `json:"vitals_recorded"`
	AlertsTriggered int   `json:"alerts_triggered"`
	AlertsAcked     int   `json:"alerts_acknowledged"`
	PatientsChecked int   `json:"patients_checked"`
}

type OrgStats struct {
	TotalPatients   int `json:"total_patients"`
	ActivePatients  int `json:"active_patients"`
	TotalMembers    int `json:"total_members"`
	TotalVitals     int `json:"total_vitals"`
	TotalAlerts     int `json:"total_alerts"`
}

type UsageStats struct {
	Month          string `json:"month"`
	VitalsRecorded int    `json:"vitals_recorded"`
	AlertsGenerated int   `json:"alerts_generated"`
	ActivePatients int    `json:"active_patients"`
}
