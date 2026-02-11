package models

type PatientStatus string

const (
	StatusActive     PatientStatus = "active"
	StatusDischarged PatientStatus = "discharged"
	StatusCritical   PatientStatus = "critical"
	StatusStable     PatientStatus = "stable"
)

type Patient struct {
	ID          string        `json:"id"`
	OrgID       string        `json:"org_id"`
	Name        string        `json:"name" validate:"required,min=2,max=100"`
	Age         int           `json:"age" validate:"required,min=0,max=150"`
	Gender      string        `json:"gender" validate:"required,oneof=male female other"`
	BedNumber   string        `json:"bed_number"`
	Ward        string        `json:"ward"`
	Diagnosis   string        `json:"diagnosis"`
	Status      PatientStatus `json:"status"`
	AdmittedAt  int64         `json:"admitted_at"`
	DischargedAt int64        `json:"discharged_at,omitempty"`
	CreatedAt   int64         `json:"created_at"`
	UpdatedAt   int64         `json:"updated_at"`
}

type CreatePatientRequest struct {
	Name      string `json:"name" validate:"required,min=2,max=100"`
	Age       int    `json:"age" validate:"required,min=0,max=150"`
	Gender    string `json:"gender" validate:"required,oneof=male female other"`
	BedNumber string `json:"bed_number"`
	Ward      string `json:"ward"`
	Diagnosis string `json:"diagnosis"`
}

type UpdatePatientRequest struct {
	Name      string `json:"name" validate:"omitempty,min=2,max=100"`
	Age       int    `json:"age" validate:"omitempty,min=0,max=150"`
	BedNumber string `json:"bed_number"`
	Ward      string `json:"ward"`
	Diagnosis string `json:"diagnosis"`
	Status    string `json:"status" validate:"omitempty,oneof=active discharged critical stable"`
}
