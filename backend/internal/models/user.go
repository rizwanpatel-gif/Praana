package models

type Role string

const (
	RoleAdmin  Role = "admin"
	RoleDoctor Role = "doctor"
	RoleNurse  Role = "nurse"
)

type User struct {
	ID        string `json:"id"`
	Email     string `json:"email" validate:"required,email"`
	Password  string `json:"-"`
	Name      string `json:"name" validate:"required,min=2,max=100"`
	Role      Role   `json:"role"`
	OrgID     string `json:"org_id"`
	CreatedAt int64  `json:"created_at"`
}

type SignupRequest struct {
	Email    string `json:"email" validate:"required,email"`
	Password string `json:"password" validate:"required,min=8"`
	Name     string `json:"name" validate:"required,min=2,max=100"`
	OrgName  string `json:"org_name" validate:"required,min=2,max=100"`
}

type LoginRequest struct {
	Email    string `json:"email" validate:"required,email"`
	Password string `json:"password" validate:"required"`
}

type LoginResponse struct {
	Token string `json:"token"`
	User  User   `json:"user"`
}

type InviteRequest struct {
	Email string `json:"email" validate:"required,email"`
	Role  Role   `json:"role" validate:"required,oneof=doctor nurse"`
}

type AcceptInviteRequest struct {
	Code     string `json:"code" validate:"required"`
	Email    string `json:"email" validate:"required,email"`
	Password string `json:"password" validate:"required,min=8"`
	Name     string `json:"name" validate:"required,min=2,max=100"`
}

type Invite struct {
	Code      string `json:"code"`
	Email     string `json:"email"`
	Role      Role   `json:"role"`
	OrgID     string `json:"org_id"`
	CreatedAt int64  `json:"created_at"`
}
