package services

import (
	"context"
	"fmt"
	"time"

	"github.com/rs/zerolog/log"
	"praana/internal/models"
	"praana/internal/repository"
	"praana/internal/utils"
)

type AlertService struct {
	repo *repository.RedisRepo
	hub  *WSHub
}

func NewAlertService(repo *repository.RedisRepo, hub *WSHub) *AlertService {
	return &AlertService{repo: repo, hub: hub}
}

func (s *AlertService) CheckVitals(ctx context.Context, patient *models.Patient, vitals *models.Vitals) {
	// Get per-patient thresholds first, fallback to org-wide
	thresholds, err := s.repo.GetThresholds(ctx, fmt.Sprintf("thresholds:%s:%s", vitals.OrgID, vitals.PatientID))
	if err != nil || thresholds == nil {
		thresholds, err = s.repo.GetThresholds(ctx, fmt.Sprintf("thresholds:%s", vitals.OrgID))
		if err != nil || thresholds == nil {
			thresholds = &models.DefaultThresholds
		}
	}

	checks := []struct {
		name    string
		value   float64
		high    float64
		low     float64
		hasLow  bool
	}{
		{"heart_rate", vitals.HeartRate, thresholds.HeartRateHigh, thresholds.HeartRateLow, true},
		{"systolic_bp", vitals.SystolicBP, thresholds.SystolicBPHigh, thresholds.SystolicBPLow, true},
		{"diastolic_bp", vitals.DiastolicBP, thresholds.DiastolicBPHigh, thresholds.DiastolicBPLow, true},
		{"temperature", vitals.Temperature, thresholds.TemperatureHigh, thresholds.TemperatureLow, true},
		{"spo2", vitals.SpO2, 0, thresholds.SpO2Low, false},
		{"respiratory_rate", vitals.RespiratoryRate, thresholds.RespiratoryRateHigh, thresholds.RespiratoryRateLow, true},
	}

	for _, check := range checks {
		if check.value == 0 {
			continue
		}

		var alert *models.Alert

		if check.high > 0 && check.value > check.high {
			alert = &models.Alert{
				ID:          utils.GenerateID(),
				OrgID:       vitals.OrgID,
				PatientID:   vitals.PatientID,
				PatientName: patient.Name,
				VitalType:   check.name,
				Value:       check.value,
				Threshold:   check.high,
				Severity:    models.SeverityCritical,
				Message:     fmt.Sprintf("%s: %s %.1f exceeds %.1f", patient.Name, check.name, check.value, check.high),
				CreatedAt:   time.Now().Unix(),
			}
		} else if check.hasLow && check.low > 0 && check.value < check.low {
			severity := models.SeverityWarning
			if check.name == "spo2" && check.value < 90 {
				severity = models.SeverityCritical
			}
			alert = &models.Alert{
				ID:          utils.GenerateID(),
				OrgID:       vitals.OrgID,
				PatientID:   vitals.PatientID,
				PatientName: patient.Name,
				VitalType:   check.name,
				Value:       check.value,
				Threshold:   check.low,
				Severity:    severity,
				Message:     fmt.Sprintf("%s: %s %.1f below %.1f", patient.Name, check.name, check.value, check.low),
				CreatedAt:   time.Now().Unix(),
			}
		} else if !check.hasLow && check.value < check.low {
			alert = &models.Alert{
				ID:          utils.GenerateID(),
				OrgID:       vitals.OrgID,
				PatientID:   vitals.PatientID,
				PatientName: patient.Name,
				VitalType:   check.name,
				Value:       check.value,
				Threshold:   check.low,
				Severity:    models.SeverityCritical,
				Message:     fmt.Sprintf("%s: %s %.1f below %.1f", patient.Name, check.name, check.value, check.low),
				CreatedAt:   time.Now().Unix(),
			}
		}

		if alert != nil {
			if err := s.repo.CreateAlert(ctx, alert); err != nil {
				log.Error().Err(err).Msg("Failed to create alert")
				continue
			}
			_ = s.repo.PublishAlert(ctx, vitals.OrgID, alert)
			if s.hub != nil {
				s.hub.BroadcastToOrg(vitals.OrgID, alert)
			}
			// Update stats
			s.repo.IncrStat(ctx, vitals.OrgID, time.Now().Format("2006-01-02"), "alerts_triggered", 1)
			log.Warn().Str("alert", alert.Message).Msg("Alert triggered")
		}
	}
}

func (s *AlertService) GetActive(ctx context.Context, orgID string) ([]models.Alert, error) {
	return s.repo.GetActiveAlerts(ctx, orgID)
}

func (s *AlertService) Acknowledge(ctx context.Context, orgID, alertID, userID string) error {
	alert, err := s.repo.GetAlert(ctx, orgID, alertID)
	if err != nil || alert == nil {
		return fmt.Errorf("alert not found")
	}
	alert.Acknowledged = true
	alert.AcknowledgedBy = userID
	alert.AcknowledgedAt = time.Now().Unix()
	if err := s.repo.UpdateAlert(ctx, alert); err != nil {
		return err
	}
	s.repo.IncrStat(ctx, orgID, time.Now().Format("2006-01-02"), "alerts_acked", 1)
	return nil
}

func (s *AlertService) GetHistory(ctx context.Context, orgID string) ([]models.Alert, error) {
	return s.repo.GetAlertHistory(ctx, orgID, 100)
}

func (s *AlertService) SetOrgThresholds(ctx context.Context, orgID string, req *models.SetThresholdRequest) (*models.Threshold, error) {
	key := fmt.Sprintf("thresholds:%s", orgID)
	existing, _ := s.repo.GetThresholds(ctx, key)
	if existing == nil {
		existing = &models.DefaultThresholds
	}
	applyThresholdUpdates(existing, req)
	if err := s.repo.SetThresholds(ctx, key, existing); err != nil {
		return nil, err
	}
	return existing, nil
}

func (s *AlertService) SetPatientThresholds(ctx context.Context, orgID, patientID string, req *models.SetThresholdRequest) (*models.Threshold, error) {
	key := fmt.Sprintf("thresholds:%s:%s", orgID, patientID)
	existing, _ := s.repo.GetThresholds(ctx, key)
	if existing == nil {
		existing = &models.DefaultThresholds
	}
	applyThresholdUpdates(existing, req)
	if err := s.repo.SetThresholds(ctx, key, existing); err != nil {
		return nil, err
	}
	return existing, nil
}

func (s *AlertService) GetOrgThresholds(ctx context.Context, orgID string) (*models.Threshold, error) {
	t, err := s.repo.GetThresholds(ctx, fmt.Sprintf("thresholds:%s", orgID))
	if err != nil || t == nil {
		t = &models.DefaultThresholds
	}
	return t, nil
}

func applyThresholdUpdates(t *models.Threshold, req *models.SetThresholdRequest) {
	if req.HeartRateHigh != nil {
		t.HeartRateHigh = *req.HeartRateHigh
	}
	if req.HeartRateLow != nil {
		t.HeartRateLow = *req.HeartRateLow
	}
	if req.SystolicBPHigh != nil {
		t.SystolicBPHigh = *req.SystolicBPHigh
	}
	if req.SystolicBPLow != nil {
		t.SystolicBPLow = *req.SystolicBPLow
	}
	if req.DiastolicBPHigh != nil {
		t.DiastolicBPHigh = *req.DiastolicBPHigh
	}
	if req.DiastolicBPLow != nil {
		t.DiastolicBPLow = *req.DiastolicBPLow
	}
	if req.TemperatureHigh != nil {
		t.TemperatureHigh = *req.TemperatureHigh
	}
	if req.TemperatureLow != nil {
		t.TemperatureLow = *req.TemperatureLow
	}
	if req.SpO2Low != nil {
		t.SpO2Low = *req.SpO2Low
	}
	if req.RespiratoryRateHigh != nil {
		t.RespiratoryRateHigh = *req.RespiratoryRateHigh
	}
	if req.RespiratoryRateLow != nil {
		t.RespiratoryRateLow = *req.RespiratoryRateLow
	}
}
