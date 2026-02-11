package services

import (
	"context"
	"fmt"
	"time"

	"github.com/rs/zerolog/log"
	"golang.org/x/crypto/bcrypt"
	"praana/internal/models"
	"praana/internal/repository"
	"praana/internal/utils"
)

type OrgService struct {
	repo *repository.RedisRepo
}

func NewOrgService(repo *repository.RedisRepo) *OrgService {
	return &OrgService{repo: repo}
}

func (s *OrgService) GetOrg(ctx context.Context, orgID string) (*models.Org, error) {
	return s.repo.GetOrg(ctx, orgID)
}

func (s *OrgService) UpdateOrg(ctx context.Context, orgID string, req *models.OrgUpdateRequest) (*models.Org, error) {
	org, err := s.repo.GetOrg(ctx, orgID)
	if err != nil || org == nil {
		return nil, fmt.Errorf("org not found")
	}
	org.Name = req.Name
	org.UpdatedAt = time.Now().Unix()
	if err := s.repo.UpdateOrg(ctx, org); err != nil {
		return nil, err
	}
	return org, nil
}

func (s *OrgService) GetMembers(ctx context.Context, orgID string) ([]models.User, error) {
	return s.repo.GetOrgMembers(ctx, orgID)
}

func (s *OrgService) RemoveMember(ctx context.Context, orgID, memberID string) error {
	user, err := s.repo.GetUser(ctx, memberID)
	if err != nil || user == nil {
		return fmt.Errorf("member not found")
	}
	if user.OrgID != orgID {
		return fmt.Errorf("member not in org")
	}
	if user.Role == models.RoleAdmin {
		return fmt.Errorf("cannot remove admin")
	}
	return s.repo.RemoveOrgMember(ctx, orgID, memberID)
}

func (s *OrgService) CreateInvite(ctx context.Context, orgID string, req *models.InviteRequest) (*models.Invite, error) {
	org, err := s.repo.GetOrg(ctx, orgID)
	if err != nil || org == nil {
		return nil, fmt.Errorf("org not found")
	}

	limits := models.PlanConfig[org.Plan]
	if limits.MaxMembers > 0 {
		count, _ := s.repo.GetOrgMemberCount(ctx, orgID)
		if int(count) >= limits.MaxMembers {
			return nil, fmt.Errorf("member limit reached for %s plan", org.Plan)
		}
	}

	invite := &models.Invite{
		Code:      utils.GenerateInviteCode(),
		Email:     req.Email,
		Role:      req.Role,
		OrgID:     orgID,
		CreatedAt: time.Now().Unix(),
	}
	if err := s.repo.CreateInvite(ctx, invite); err != nil {
		return nil, err
	}

	log.Info().
		Str("email", req.Email).
		Str("code", invite.Code).
		Str("org", org.Name).
		Msg("[MOCK EMAIL] Invite sent")

	return invite, nil
}

func (s *OrgService) AcceptInvite(ctx context.Context, req *models.AcceptInviteRequest) (*models.User, error) {
	invite, err := s.repo.GetInvite(ctx, req.Code)
	if err != nil || invite == nil {
		return nil, fmt.Errorf("invalid or expired invite code")
	}

	if invite.Email != req.Email {
		return nil, fmt.Errorf("email does not match invite")
	}

	existing, _ := s.repo.GetUserByEmail(ctx, req.Email)
	if existing != nil {
		return nil, fmt.Errorf("email already registered")
	}

	hashedPwd, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, fmt.Errorf("failed to hash password: %w", err)
	}

	user := &models.User{
		ID:        utils.GenerateID(),
		Email:     req.Email,
		Password:  string(hashedPwd),
		Name:      req.Name,
		Role:      invite.Role,
		OrgID:     invite.OrgID,
		CreatedAt: time.Now().Unix(),
	}
	if err := s.repo.CreateUser(ctx, user); err != nil {
		return nil, err
	}

	_ = s.repo.DeleteInvite(ctx, req.Code)
	return user, nil
}

func (s *OrgService) CheckPlanLimit(ctx context.Context, orgID string, resource string) error {
	org, err := s.repo.GetOrg(ctx, orgID)
	if err != nil || org == nil {
		return fmt.Errorf("org not found")
	}
	limits := models.PlanConfig[org.Plan]

	switch resource {
	case "patients":
		if limits.MaxPatients > 0 {
			count, _ := s.repo.GetPatientCount(ctx, orgID)
			if int(count) >= limits.MaxPatients {
				return fmt.Errorf("patient limit reached for %s plan (max %d)", org.Plan, limits.MaxPatients)
			}
		}
	case "members":
		if limits.MaxMembers > 0 {
			count, _ := s.repo.GetOrgMemberCount(ctx, orgID)
			if int(count) >= limits.MaxMembers {
				return fmt.Errorf("member limit reached for %s plan (max %d)", org.Plan, limits.MaxMembers)
			}
		}
	}
	return nil
}
