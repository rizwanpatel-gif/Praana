package services

import (
	"context"
	"fmt"
	"time"

	"praana/internal/models"
	"praana/internal/repository"
	"praana/internal/utils"
)

type VitalsService struct {
	repo         *repository.RedisRepo
	alertService *AlertService
	statsService *StatsService
}

func NewVitalsService(repo *repository.RedisRepo, alertService *AlertService, statsService *StatsService) *VitalsService {
	return &VitalsService{repo: repo, alertService: alertService, statsService: statsService}
}

func (s *VitalsService) Record(ctx context.Context, orgID, patientID, recordedBy string, req *models.RecordVitalsRequest) (*models.Vitals, error) {
	patient, err := s.repo.GetPatient(ctx, orgID, patientID)
	if err != nil || patient == nil {
		return nil, fmt.Errorf("patient not found")
	}

	vitals := &models.Vitals{
		ID:              utils.GenerateID(),
		PatientID:       patientID,
		OrgID:           orgID,
		HeartRate:       req.HeartRate,
		SystolicBP:      req.SystolicBP,
		DiastolicBP:     req.DiastolicBP,
		Temperature:     req.Temperature,
		SpO2:            req.SpO2,
		RespiratoryRate: req.RespiratoryRate,
		RecordedBy:      recordedBy,
		RecordedAt:      time.Now().Unix(),
		Notes:           req.Notes,
	}

	if err := s.repo.RecordVitals(ctx, vitals); err != nil {
		return nil, err
	}

	// Check thresholds and generate alerts
	if s.alertService != nil {
		s.alertService.CheckVitals(ctx, patient, vitals)
	}

	// Update stats
	if s.statsService != nil {
		s.statsService.OnVitalsRecorded(ctx, orgID)
	}

	return vitals, nil
}

func (s *VitalsService) BulkRecord(ctx context.Context, orgID, recordedBy string, req *models.BulkVitalsRequest) ([]models.Vitals, error) {
	var results []models.Vitals
	for _, entry := range req.Entries {
		vitalsReq := &models.RecordVitalsRequest{
			HeartRate:       entry.HeartRate,
			SystolicBP:      entry.SystolicBP,
			DiastolicBP:     entry.DiastolicBP,
			Temperature:     entry.Temperature,
			SpO2:            entry.SpO2,
			RespiratoryRate: entry.RespiratoryRate,
			Notes:           entry.Notes,
		}
		v, err := s.Record(ctx, orgID, entry.PatientID, recordedBy, vitalsReq)
		if err != nil {
			continue
		}
		results = append(results, *v)
	}
	return results, nil
}

func (s *VitalsService) GetHistory(ctx context.Context, orgID, patientID, rangeStr string) ([]models.Vitals, error) {
	var since time.Time
	switch rangeStr {
	case "6h":
		since = time.Now().Add(-6 * time.Hour)
	case "12h":
		since = time.Now().Add(-12 * time.Hour)
	case "24h":
		since = time.Now().Add(-24 * time.Hour)
	case "7d":
		since = time.Now().Add(-7 * 24 * time.Hour)
	default:
		since = time.Now().Add(-24 * time.Hour)
	}
	return s.repo.GetVitalsHistory(ctx, orgID, patientID, since)
}

func (s *VitalsService) GetLatest(ctx context.Context, orgID, patientID string) (*models.Vitals, error) {
	return s.repo.GetLatestVitals(ctx, orgID, patientID)
}
