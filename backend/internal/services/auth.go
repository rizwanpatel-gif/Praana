package services

import (
	"context"
	"fmt"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/rs/zerolog/log"
	"golang.org/x/crypto/bcrypt"
	"praana/internal/models"
	"praana/internal/repository"
	"praana/internal/utils"
)

type AuthService struct {
	repo      *repository.RedisRepo
	jwtSecret string
	jwtExpiry time.Duration
}

type Claims struct {
	UserID string      `json:"user_id"`
	Email  string      `json:"email"`
	Name   string      `json:"name"`
	OrgID  string      `json:"org_id"`
	Role   models.Role `json:"role"`
	jwt.RegisteredClaims
}

func NewAuthService(repo *repository.RedisRepo, jwtSecret string, jwtExpiry time.Duration) *AuthService {
	return &AuthService{repo: repo, jwtSecret: jwtSecret, jwtExpiry: jwtExpiry}
}

func (s *AuthService) Signup(ctx context.Context, req *models.SignupRequest) (*models.LoginResponse, error) {
	existing, _ := s.repo.GetUserByEmail(ctx, req.Email)
	if existing != nil {
		return nil, fmt.Errorf("email already registered")
	}

	hashedPwd, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, fmt.Errorf("failed to hash password: %w", err)
	}

	orgID := utils.GenerateID()
	org := &models.Org{
		ID:        orgID,
		Name:      req.OrgName,
		Plan:      models.PlanFree,
		CreatedAt: time.Now().Unix(),
		UpdatedAt: time.Now().Unix(),
	}
	if err := s.repo.CreateOrg(ctx, org); err != nil {
		return nil, fmt.Errorf("failed to create org: %w", err)
	}

	userID := utils.GenerateID()
	user := &models.User{
		ID:        userID,
		Email:     req.Email,
		Password:  string(hashedPwd),
		Name:      req.Name,
		Role:      models.RoleAdmin,
		OrgID:     orgID,
		CreatedAt: time.Now().Unix(),
	}
	if err := s.repo.CreateUser(ctx, user); err != nil {
		return nil, fmt.Errorf("failed to create user: %w", err)
	}

	token, err := s.generateToken(user)
	if err != nil {
		return nil, err
	}

	log.Info().Str("email", user.Email).Str("org", org.Name).Msg("New signup")
	return &models.LoginResponse{Token: token, User: *user}, nil
}

func (s *AuthService) Login(ctx context.Context, req *models.LoginRequest) (*models.LoginResponse, error) {
	user, err := s.repo.GetUserByEmail(ctx, req.Email)
	if err != nil || user == nil {
		return nil, fmt.Errorf("invalid email or password")
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(req.Password)); err != nil {
		return nil, fmt.Errorf("invalid email or password")
	}

	token, err := s.generateToken(user)
	if err != nil {
		return nil, err
	}

	return &models.LoginResponse{Token: token, User: *user}, nil
}

func (s *AuthService) Logout(ctx context.Context, jwtID string) error {
	return s.repo.DeleteSession(ctx, jwtID)
}

func (s *AuthService) ValidateToken(tokenStr string) (*Claims, error) {
	token, err := jwt.ParseWithClaims(tokenStr, &Claims{}, func(t *jwt.Token) (interface{}, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method")
		}
		return []byte(s.jwtSecret), nil
	})
	if err != nil {
		return nil, err
	}
	claims, ok := token.Claims.(*Claims)
	if !ok || !token.Valid {
		return nil, fmt.Errorf("invalid token")
	}

	// Check session exists
	ctx := context.Background()
	_, err = s.repo.GetSession(ctx, claims.ID)
	if err != nil {
		return nil, fmt.Errorf("session expired")
	}

	return claims, nil
}

func (s *AuthService) generateToken(user *models.User) (string, error) {
	jwtID := utils.GenerateUUID()
	claims := &Claims{
		UserID: user.ID,
		Email:  user.Email,
		Name:   user.Name,
		OrgID:  user.OrgID,
		Role:   user.Role,
		RegisteredClaims: jwt.RegisteredClaims{
			ID:        jwtID,
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(s.jwtExpiry)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenStr, err := token.SignedString([]byte(s.jwtSecret))
	if err != nil {
		return "", err
	}

	ctx := context.Background()
	if err := s.repo.CreateSession(ctx, jwtID, user.ID, s.jwtExpiry); err != nil {
		return "", err
	}

	return tokenStr, nil
}
