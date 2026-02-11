package handlers

import (
	"github.com/gin-gonic/gin"
	"praana/internal/models"
	"praana/internal/services"
	"praana/internal/utils"
)

type VitalsHandler struct {
	vitalsService *services.VitalsService
}

func NewVitalsHandler(vs *services.VitalsService) *VitalsHandler {
	return &VitalsHandler{vitalsService: vs}
}

// RecordVitals godoc
// @Summary Record vitals for a patient
// @Tags vitals
// @Security BearerAuth
// @Param id path string true "Patient ID"
// @Accept json
// @Produce json
// @Param body body models.RecordVitalsRequest true "Vitals data"
// @Success 201 {object} utils.APIResponse{data=models.Vitals}
// @Router /api/patients/{id}/vitals [post]
func (h *VitalsHandler) Record(c *gin.Context) {
	orgID := c.GetString("org_id")
	patientID := c.Param("id")
	userID := c.GetString("user_id")

	var req models.RecordVitalsRequest
	if err := utils.BindAndValidate(c, &req); err != nil {
		utils.BadRequest(c, err.Error())
		return
	}

	vitals, err := h.vitalsService.Record(c.Request.Context(), orgID, patientID, userID, &req)
	if err != nil {
		utils.BadRequest(c, err.Error())
		return
	}
	utils.Created(c, vitals)
}

// BulkRecord godoc
// @Summary Record vitals for multiple patients
// @Tags vitals
// @Security BearerAuth
// @Accept json
// @Produce json
// @Param body body models.BulkVitalsRequest true "Bulk vitals data"
// @Success 201 {object} utils.APIResponse{data=[]models.Vitals}
// @Router /api/vitals/bulk [post]
func (h *VitalsHandler) BulkRecord(c *gin.Context) {
	orgID := c.GetString("org_id")
	userID := c.GetString("user_id")

	var req models.BulkVitalsRequest
	if err := utils.BindAndValidate(c, &req); err != nil {
		utils.BadRequest(c, err.Error())
		return
	}

	results, err := h.vitalsService.BulkRecord(c.Request.Context(), orgID, userID, &req)
	if err != nil {
		utils.InternalError(c, err.Error())
		return
	}
	utils.Created(c, results)
}

// GetVitalsHistory godoc
// @Summary Get vitals history for a patient
// @Tags vitals
// @Security BearerAuth
// @Param id path string true "Patient ID"
// @Param range query string false "Time range: 6h, 12h, 24h, 7d"
// @Success 200 {object} utils.APIResponse{data=[]models.Vitals}
// @Router /api/patients/{id}/vitals [get]
func (h *VitalsHandler) GetHistory(c *gin.Context) {
	orgID := c.GetString("org_id")
	patientID := c.Param("id")
	rangeStr := c.DefaultQuery("range", "24h")

	vitals, err := h.vitalsService.GetHistory(c.Request.Context(), orgID, patientID, rangeStr)
	if err != nil {
		utils.InternalError(c, err.Error())
		return
	}
	utils.OK(c, vitals)
}
