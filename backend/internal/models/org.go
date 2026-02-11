package models

type Plan string

const (
	PlanFree       Plan = "free"
	PlanPro        Plan = "pro"
	PlanEnterprise Plan = "enterprise"
)

type PlanLimits struct {
	MaxPatients int
	MaxMembers  int
}

var PlanConfig = map[Plan]PlanLimits{
	PlanFree:       {MaxPatients: 20, MaxMembers: 3},
	PlanPro:        {MaxPatients: 200, MaxMembers: 20},
	PlanEnterprise: {MaxPatients: -1, MaxMembers: -1}, // unlimited
}

type Org struct {
	ID        string `json:"id"`
	Name      string `json:"name" validate:"required,min=2,max=100"`
	Plan      Plan   `json:"plan"`
	CreatedAt int64  `json:"created_at"`
	UpdatedAt int64  `json:"updated_at"`
}

type OrgUpdateRequest struct {
	Name string `json:"name" validate:"required,min=2,max=100"`
}
