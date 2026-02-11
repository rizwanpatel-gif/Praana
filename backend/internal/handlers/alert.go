package handlers

import (
	"github.com/gin-gonic/gin"
	"praana/internal/models"
	"praana/internal/services"
	"praana/internal/utils"
)

type AlertHandler struct {
	alertService *services.AlertService
}

func NewAlertHandler(as *services.AlertService) *AlertHandler {
	return &AlertHandler{alertService: as}
}

// GetActiveAlerts godoc
// @Summary Get active alerts
// @Tags alerts
// @Security BearerAuth
// @Success 200 {object} utils.APIResponse{data=[]models.Alert}
// @Router /api/alerts [get]
func (h *AlertHandler) GetActive(c *gin.Context) {
	orgID := c.GetString("org_id")
	alerts, err := h.alertService.GetActive(c.Request.Context(), orgID)
	if err != nil {
		utils.InternalError(c, err.Error())
		return
	}
	utils.OK(c, alerts)
}

// AcknowledgeAlert godoc
// @Summary Acknowledge an alert
// @Tags alerts
// @Security BearerAuth
// @Param id path string true "Alert ID"
// @Success 200 {object} utils.APIResponse
// @Router /api/alerts/{id}/acknowledge [post]
func (h *AlertHandler) Acknowledge(c *gin.Context) {
	orgID := c.GetString("org_id")
	alertID := c.Param("id")
	userID := c.GetString("user_id")

	if err := h.alertService.Acknowledge(c.Request.Context(), orgID, alertID, userID); err != nil {
		utils.NotFound(c, err.Error())
		return
	}
	utils.OK(c, gin.H{"message": "alert acknowledged"})
}

// GetAlertHistory godoc
// @Summary Get alert history
// @Tags alerts
// @Security BearerAuth
// @Success 200 {object} utils.APIResponse{data=[]models.Alert}
// @Router /api/alerts/history [get]
func (h *AlertHandler) GetHistory(c *gin.Context) {
	orgID := c.GetString("org_id")
	alerts, err := h.alertService.GetHistory(c.Request.Context(), orgID)
	if err != nil {
		utils.InternalError(c, err.Error())
		return
	}
	utils.OK(c, alerts)
}

// GetThresholds godoc
// @Summary Get alert thresholds
// @Tags alerts
// @Security BearerAuth
// @Success 200 {object} utils.APIResponse{data=models.Threshold}
// @Router /api/thresholds [get]
func (h *AlertHandler) GetThresholds(c *gin.Context) {
	orgID := c.GetString("org_id")
	t, err := h.alertService.GetOrgThresholds(c.Request.Context(), orgID)
	if err != nil {
		utils.InternalError(c, err.Error())
		return
	}
	utils.OK(c, t)
}

// SetOrgThresholds godoc
// @Summary Set org-wide thresholds
// @Tags alerts
// @Security BearerAuth
// @Accept json
// @Produce json
// @Param body body models.SetThresholdRequest true "Thresholds"
// @Success 200 {object} utils.APIResponse{data=models.Threshold}
// @Router /api/thresholds [put]
func (h *AlertHandler) SetOrgThresholds(c *gin.Context) {
	orgID := c.GetString("org_id")
	var req models.SetThresholdRequest
	if err := utils.BindAndValidate(c, &req); err != nil {
		utils.BadRequest(c, err.Error())
		return
	}
	t, err := h.alertService.SetOrgThresholds(c.Request.Context(), orgID, &req)
	if err != nil {
		utils.InternalError(c, err.Error())
		return
	}
	utils.OK(c, t)
}

// SetPatientThresholds godoc
// @Summary Set per-patient thresholds
// @Tags alerts
// @Security BearerAuth
// @Param id path string true "Patient ID"
// @Accept json
// @Produce json
// @Param body body models.SetThresholdRequest true "Thresholds"
// @Success 200 {object} utils.APIResponse{data=models.Threshold}
// @Router /api/thresholds/patient/{id} [put]
func (h *AlertHandler) SetPatientThresholds(c *gin.Context) {
	orgID := c.GetString("org_id")
	patientID := c.Param("id")
	var req models.SetThresholdRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequest(c, err.Error())
		return
	}
	t, err := h.alertService.SetPatientThresholds(c.Request.Context(), orgID, patientID, &req)
	if err != nil {
		utils.InternalError(c, err.Error())
		return
	}
	utils.OK(c, t)
}
