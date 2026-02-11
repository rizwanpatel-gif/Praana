package handlers

import (
	"github.com/gin-gonic/gin"
	"praana/internal/models"
	"praana/internal/services"
	"praana/internal/utils"
)

type AuthHandler struct {
	authService *services.AuthService
	orgService  *services.OrgService
}

func NewAuthHandler(authService *services.AuthService, orgService *services.OrgService) *AuthHandler {
	return &AuthHandler{authService: authService, orgService: orgService}
}

// Signup godoc
// @Summary Create new account and organization
// @Tags auth
// @Accept json
// @Produce json
// @Param body body models.SignupRequest true "Signup details"
// @Success 201 {object} utils.APIResponse{data=models.LoginResponse}
// @Failure 400 {object} utils.APIResponse
// @Router /api/auth/signup [post]
func (h *AuthHandler) Signup(c *gin.Context) {
	var req models.SignupRequest
	if err := utils.BindAndValidate(c, &req); err != nil {
		utils.BadRequest(c, err.Error())
		return
	}

	resp, err := h.authService.Signup(c.Request.Context(), &req)
	if err != nil {
		utils.BadRequest(c, err.Error())
		return
	}

	utils.Created(c, resp)
}

// Login godoc
// @Summary Login to account
// @Tags auth
// @Accept json
// @Produce json
// @Param body body models.LoginRequest true "Login credentials"
// @Success 200 {object} utils.APIResponse{data=models.LoginResponse}
// @Failure 401 {object} utils.APIResponse
// @Router /api/auth/login [post]
func (h *AuthHandler) Login(c *gin.Context) {
	var req models.LoginRequest
	if err := utils.BindAndValidate(c, &req); err != nil {
		utils.BadRequest(c, err.Error())
		return
	}

	resp, err := h.authService.Login(c.Request.Context(), &req)
	if err != nil {
		utils.Unauthorized(c, err.Error())
		return
	}

	utils.OK(c, resp)
}

// Logout godoc
// @Summary Logout and invalidate session
// @Tags auth
// @Security BearerAuth
// @Success 200 {object} utils.APIResponse
// @Router /api/auth/logout [post]
func (h *AuthHandler) Logout(c *gin.Context) {
	jwtID := c.GetString("jwt_id")
	if err := h.authService.Logout(c.Request.Context(), jwtID); err != nil {
		utils.InternalError(c, err.Error())
		return
	}
	utils.OK(c, gin.H{"message": "logged out"})
}

// AcceptInvite godoc
// @Summary Accept team invite
// @Tags auth
// @Accept json
// @Produce json
// @Param body body models.AcceptInviteRequest true "Accept invite details"
// @Success 201 {object} utils.APIResponse{data=models.User}
// @Failure 400 {object} utils.APIResponse
// @Router /api/auth/accept-invite [post]
func (h *AuthHandler) AcceptInvite(c *gin.Context) {
	var req models.AcceptInviteRequest
	if err := utils.BindAndValidate(c, &req); err != nil {
		utils.BadRequest(c, err.Error())
		return
	}

	user, err := h.orgService.AcceptInvite(c.Request.Context(), &req)
	if err != nil {
		utils.BadRequest(c, err.Error())
		return
	}

	utils.Created(c, user)
}
