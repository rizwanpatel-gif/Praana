package handlers

import (
	"github.com/gin-gonic/gin"
	"praana/internal/services"
	"praana/internal/utils"
)

type DashboardHandler struct {
	statsService *services.StatsService
}

func NewDashboardHandler(ss *services.StatsService) *DashboardHandler {
	return &DashboardHandler{statsService: ss}
}

// Overview godoc
// @Summary Dashboard overview - all patients with latest vitals
// @Tags dashboard
// @Security BearerAuth
// @Success 200 {object} utils.APIResponse{data=models.DashboardOverview}
// @Router /api/dashboard/overview [get]
func (h *DashboardHandler) Overview(c *gin.Context) {
	orgID := c.GetString("org_id")
	overview, err := h.statsService.GetDashboardOverview(c.Request.Context(), orgID)
	if err != nil {
		utils.InternalError(c, err.Error())
		return
	}
	utils.OK(c, overview)
}

// PatientTrends godoc
// @Summary Get patient vitals trends for charts
// @Tags dashboard
// @Security BearerAuth
// @Param id path string true "Patient ID"
// @Success 200 {object} utils.APIResponse{data=[]models.Vitals}
// @Router /api/dashboard/patient/{id}/trends [get]
func (h *DashboardHandler) PatientTrends(c *gin.Context) {
	orgID := c.GetString("org_id")
	patientID := c.Param("id")
	trends, err := h.statsService.GetPatientTrends(c.Request.Context(), orgID, patientID)
	if err != nil {
		utils.InternalError(c, err.Error())
		return
	}
	utils.OK(c, trends)
}

// ShiftSummary godoc
// @Summary Current shift statistics
// @Tags dashboard
// @Security BearerAuth
// @Success 200 {object} utils.APIResponse{data=models.ShiftSummary}
// @Router /api/dashboard/shift-summary [get]
func (h *DashboardHandler) ShiftSummary(c *gin.Context) {
	orgID := c.GetString("org_id")
	summary, err := h.statsService.GetShiftSummary(c.Request.Context(), orgID)
	if err != nil {
		utils.InternalError(c, err.Error())
		return
	}
	utils.OK(c, summary)
}

// OrgStats godoc
// @Summary Organization level statistics
// @Tags dashboard
// @Security BearerAuth
// @Success 200 {object} utils.APIResponse{data=models.OrgStats}
// @Router /api/dashboard/org-stats [get]
func (h *DashboardHandler) OrgStats(c *gin.Context) {
	orgID := c.GetString("org_id")
	stats, err := h.statsService.GetOrgStats(c.Request.Context(), orgID)
	if err != nil {
		utils.InternalError(c, err.Error())
		return
	}
	utils.OK(c, stats)
}

// Usage godoc
// @Summary Usage metering for billing
// @Tags dashboard
// @Security BearerAuth
// @Success 200 {object} utils.APIResponse{data=models.UsageStats}
// @Router /api/dashboard/usage [get]
func (h *DashboardHandler) Usage(c *gin.Context) {
	orgID := c.GetString("org_id")
	usage, err := h.statsService.GetUsage(c.Request.Context(), orgID)
	if err != nil {
		utils.InternalError(c, err.Error())
		return
	}
	utils.OK(c, usage)
}
