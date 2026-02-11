package models

type AlertSeverity string

const (
	SeverityWarning  AlertSeverity = "warning"
	SeverityCritical AlertSeverity = "critical"
)

type Alert struct {
	ID             string        `json:"id"`
	OrgID          string        `json:"org_id"`
	PatientID      string        `json:"patient_id"`
	PatientName    string        `json:"patient_name"`
	VitalType      string        `json:"vital_type"`
	Value          float64       `json:"value"`
	Threshold      float64       `json:"threshold"`
	Severity       AlertSeverity `json:"severity"`
	Message        string        `json:"message"`
	Acknowledged   bool          `json:"acknowledged"`
	AcknowledgedBy string        `json:"acknowledged_by,omitempty"`
	AcknowledgedAt int64         `json:"acknowledged_at,omitempty"`
	CreatedAt      int64         `json:"created_at"`
}

type Threshold struct {
	HeartRateHigh       float64 `json:"heart_rate_high"`
	HeartRateLow        float64 `json:"heart_rate_low"`
	SystolicBPHigh      float64 `json:"systolic_bp_high"`
	SystolicBPLow       float64 `json:"systolic_bp_low"`
	DiastolicBPHigh     float64 `json:"diastolic_bp_high"`
	DiastolicBPLow      float64 `json:"diastolic_bp_low"`
	TemperatureHigh     float64 `json:"temperature_high"`
	TemperatureLow      float64 `json:"temperature_low"`
	SpO2Low             float64 `json:"spo2_low"`
	RespiratoryRateHigh float64 `json:"respiratory_rate_high"`
	RespiratoryRateLow  float64 `json:"respiratory_rate_low"`
}

var DefaultThresholds = Threshold{
	HeartRateHigh:       100,
	HeartRateLow:        60,
	SystolicBPHigh:      140,
	SystolicBPLow:       90,
	DiastolicBPHigh:     90,
	DiastolicBPLow:      60,
	TemperatureHigh:     38.5,
	TemperatureLow:      36.0,
	SpO2Low:             92,
	RespiratoryRateHigh: 20,
	RespiratoryRateLow:  12,
}

type SetThresholdRequest struct {
	HeartRateHigh       *float64 `json:"heart_rate_high"`
	HeartRateLow        *float64 `json:"heart_rate_low"`
	SystolicBPHigh      *float64 `json:"systolic_bp_high"`
	SystolicBPLow       *float64 `json:"systolic_bp_low"`
	DiastolicBPHigh     *float64 `json:"diastolic_bp_high"`
	DiastolicBPLow      *float64 `json:"diastolic_bp_low"`
	TemperatureHigh     *float64 `json:"temperature_high"`
	TemperatureLow      *float64 `json:"temperature_low"`
	SpO2Low             *float64 `json:"spo2_low"`
	RespiratoryRateHigh *float64 `json:"respiratory_rate_high"`
	RespiratoryRateLow  *float64 `json:"respiratory_rate_low"`
}
