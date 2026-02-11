package handlers

import (
	"github.com/gin-gonic/gin"
	"praana/internal/models"
	"praana/internal/services"
	"praana/internal/utils"
)

type OrgHandler struct {
	orgService *services.OrgService
}

func NewOrgHandler(orgService *services.OrgService) *OrgHandler {
	return &OrgHandler{orgService: orgService}
}

// GetOrg godoc
// @Summary Get organization details
// @Tags org
// @Security BearerAuth
// @Success 200 {object} utils.APIResponse{data=models.Org}
// @Router /api/org [get]
func (h *OrgHandler) GetOrg(c *gin.Context) {
	orgID := c.GetString("org_id")
	org, err := h.orgService.GetOrg(c.Request.Context(), orgID)
	if err != nil || org == nil {
		utils.NotFound(c, "org not found")
		return
	}
	utils.OK(c, org)
}

// UpdateOrg godoc
// @Summary Update organization settings
// @Tags org
// @Security BearerAuth
// @Accept json
// @Produce json
// @Param body body models.OrgUpdateRequest true "Org update"
// @Success 200 {object} utils.APIResponse{data=models.Org}
// @Router /api/org [put]
func (h *OrgHandler) UpdateOrg(c *gin.Context) {
	var req models.OrgUpdateRequest
	if err := utils.BindAndValidate(c, &req); err != nil {
		utils.BadRequest(c, err.Error())
		return
	}
	orgID := c.GetString("org_id")
	org, err := h.orgService.UpdateOrg(c.Request.Context(), orgID, &req)
	if err != nil {
		utils.BadRequest(c, err.Error())
		return
	}
	utils.OK(c, org)
}

// GetMembers godoc
// @Summary List organization members
// @Tags org
// @Security BearerAuth
// @Success 200 {object} utils.APIResponse{data=[]models.User}
// @Router /api/org/members [get]
func (h *OrgHandler) GetMembers(c *gin.Context) {
	orgID := c.GetString("org_id")
	members, err := h.orgService.GetMembers(c.Request.Context(), orgID)
	if err != nil {
		utils.InternalError(c, err.Error())
		return
	}
	utils.OK(c, members)
}

// RemoveMember godoc
// @Summary Remove a team member
// @Tags org
// @Security BearerAuth
// @Param id path string true "Member ID"
// @Success 200 {object} utils.APIResponse
// @Router /api/org/members/{id} [delete]
func (h *OrgHandler) RemoveMember(c *gin.Context) {
	orgID := c.GetString("org_id")
	memberID := c.Param("id")
	if err := h.orgService.RemoveMember(c.Request.Context(), orgID, memberID); err != nil {
		utils.BadRequest(c, err.Error())
		return
	}
	utils.OK(c, gin.H{"message": "member removed"})
}

// Invite godoc
// @Summary Generate team invite
// @Tags org
// @Security BearerAuth
// @Accept json
// @Produce json
// @Param body body models.InviteRequest true "Invite details"
// @Success 201 {object} utils.APIResponse{data=models.Invite}
// @Router /api/org/invite [post]
func (h *OrgHandler) Invite(c *gin.Context) {
	orgID := c.GetString("org_id")
	var req models.InviteRequest
	if err := utils.BindAndValidate(c, &req); err != nil {
		utils.BadRequest(c, err.Error())
		return
	}
	invite, err := h.orgService.CreateInvite(c.Request.Context(), orgID, &req)
	if err != nil {
		utils.BadRequest(c, err.Error())
		return
	}
	utils.Created(c, invite)
}
