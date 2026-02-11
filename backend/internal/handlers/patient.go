package handlers

import (
	"github.com/gin-gonic/gin"
	"praana/internal/models"
	"praana/internal/services"
	"praana/internal/utils"
)

type PatientHandler struct {
	patientService *services.PatientService
	orgService     *services.OrgService
	vitalsService  *services.VitalsService
}

func NewPatientHandler(ps *services.PatientService, os *services.OrgService, vs *services.VitalsService) *PatientHandler {
	return &PatientHandler{patientService: ps, orgService: os, vitalsService: vs}
}

// CreatePatient godoc
// @Summary Add a new patient
// @Tags patients
// @Security BearerAuth
// @Accept json
// @Produce json
// @Param body body models.CreatePatientRequest true "Patient details"
// @Success 201 {object} utils.APIResponse{data=models.Patient}
// @Router /api/patients [post]
func (h *PatientHandler) Create(c *gin.Context) {
	orgID := c.GetString("org_id")

	if err := h.orgService.CheckPlanLimit(c.Request.Context(), orgID, "patients"); err != nil {
		utils.Forbidden(c, err.Error())
		return
	}

	var req models.CreatePatientRequest
	if err := utils.BindAndValidate(c, &req); err != nil {
		utils.BadRequest(c, err.Error())
		return
	}

	patient, err := h.patientService.Create(c.Request.Context(), orgID, &req)
	if err != nil {
		utils.InternalError(c, err.Error())
		return
	}
	utils.Created(c, patient)
}

// ListPatients godoc
// @Summary List all patients
// @Tags patients
// @Security BearerAuth
// @Success 200 {object} utils.APIResponse{data=[]models.Patient}
// @Router /api/patients [get]
func (h *PatientHandler) List(c *gin.Context) {
	orgID := c.GetString("org_id")
	patients, err := h.patientService.List(c.Request.Context(), orgID)
	if err != nil {
		utils.InternalError(c, err.Error())
		return
	}
	utils.OK(c, patients)
}

// GetPatient godoc
// @Summary Get patient detail with latest vitals
// @Tags patients
// @Security BearerAuth
// @Param id path string true "Patient ID"
// @Success 200 {object} utils.APIResponse
// @Router /api/patients/{id} [get]
func (h *PatientHandler) Get(c *gin.Context) {
	orgID := c.GetString("org_id")
	patientID := c.Param("id")

	patient, err := h.patientService.Get(c.Request.Context(), orgID, patientID)
	if err != nil {
		utils.NotFound(c, err.Error())
		return
	}

	latestVitals, _ := h.vitalsService.GetLatest(c.Request.Context(), orgID, patientID)
	utils.OK(c, gin.H{
		"patient":       patient,
		"latest_vitals": latestVitals,
	})
}

// UpdatePatient godoc
// @Summary Update patient details
// @Tags patients
// @Security BearerAuth
// @Param id path string true "Patient ID"
// @Accept json
// @Produce json
// @Param body body models.UpdatePatientRequest true "Update details"
// @Success 200 {object} utils.APIResponse{data=models.Patient}
// @Router /api/patients/{id} [put]
func (h *PatientHandler) Update(c *gin.Context) {
	orgID := c.GetString("org_id")
	patientID := c.Param("id")

	var req models.UpdatePatientRequest
	if err := utils.BindAndValidate(c, &req); err != nil {
		utils.BadRequest(c, err.Error())
		return
	}

	patient, err := h.patientService.Update(c.Request.Context(), orgID, patientID, &req)
	if err != nil {
		utils.NotFound(c, err.Error())
		return
	}
	utils.OK(c, patient)
}

// DeletePatient godoc
// @Summary Discharge/remove patient
// @Tags patients
// @Security BearerAuth
// @Param id path string true "Patient ID"
// @Success 200 {object} utils.APIResponse
// @Router /api/patients/{id} [delete]
func (h *PatientHandler) Delete(c *gin.Context) {
	orgID := c.GetString("org_id")
	patientID := c.Param("id")

	if err := h.patientService.Delete(c.Request.Context(), orgID, patientID); err != nil {
		utils.NotFound(c, err.Error())
		return
	}
	utils.OK(c, gin.H{"message": "patient removed"})
}
