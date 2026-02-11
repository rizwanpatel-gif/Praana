package models

type Vitals struct {
	ID            string  `json:"id"`
	PatientID     string  `json:"patient_id"`
	OrgID         string  `json:"org_id"`
	HeartRate     float64 `json:"heart_rate" validate:"omitempty,min=0,max=300"`
	SystolicBP    float64 `json:"systolic_bp" validate:"omitempty,min=0,max=300"`
	DiastolicBP   float64 `json:"diastolic_bp" validate:"omitempty,min=0,max=200"`
	Temperature   float64 `json:"temperature" validate:"omitempty,min=30,max=45"`
	SpO2          float64 `json:"spo2" validate:"omitempty,min=0,max=100"`
	RespiratoryRate float64 `json:"respiratory_rate" validate:"omitempty,min=0,max=60"`
	RecordedBy    string  `json:"recorded_by"`
	RecordedAt    int64   `json:"recorded_at"`
	Notes         string  `json:"notes,omitempty"`
}

type RecordVitalsRequest struct {
	HeartRate       float64 `json:"heart_rate" validate:"omitempty,min=0,max=300"`
	SystolicBP      float64 `json:"systolic_bp" validate:"omitempty,min=0,max=300"`
	DiastolicBP     float64 `json:"diastolic_bp" validate:"omitempty,min=0,max=200"`
	Temperature     float64 `json:"temperature" validate:"omitempty,min=30,max=45"`
	SpO2            float64 `json:"spo2" validate:"omitempty,min=0,max=100"`
	RespiratoryRate float64 `json:"respiratory_rate" validate:"omitempty,min=0,max=60"`
	Notes           string  `json:"notes"`
}

type BulkVitalsEntry struct {
	PatientID       string  `json:"patient_id" validate:"required"`
	HeartRate       float64 `json:"heart_rate" validate:"omitempty,min=0,max=300"`
	SystolicBP      float64 `json:"systolic_bp" validate:"omitempty,min=0,max=300"`
	DiastolicBP     float64 `json:"diastolic_bp" validate:"omitempty,min=0,max=200"`
	Temperature     float64 `json:"temperature" validate:"omitempty,min=30,max=45"`
	SpO2            float64 `json:"spo2" validate:"omitempty,min=0,max=100"`
	RespiratoryRate float64 `json:"respiratory_rate" validate:"omitempty,min=0,max=60"`
	Notes           string  `json:"notes"`
}

type BulkVitalsRequest struct {
	Entries []BulkVitalsEntry `json:"entries" validate:"required,min=1,dive"`
}

type VitalsHistoryQuery struct {
	Range string `form:"range" validate:"omitempty,oneof=6h 12h 24h 7d"`
}
