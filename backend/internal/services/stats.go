package services

import (
	"context"
	"fmt"
	"time"

	"praana/internal/models"
	"praana/internal/repository"
)

type StatsService struct {
	repo *repository.RedisRepo
}

func NewStatsService(repo *repository.RedisRepo) *StatsService {
	return &StatsService{repo: repo}
}

func (s *StatsService) OnVitalsRecorded(ctx context.Context, orgID string) {
	date := time.Now().Format("2006-01-02")
	month := time.Now().Format("2006-01")
	s.repo.IncrStat(ctx, orgID, date, "vitals_recorded", 1)
	s.repo.IncrUsage(ctx, orgID, month, "vitals_recorded", 1)
}

func (s *StatsService) GetDashboardOverview(ctx context.Context, orgID string) (*models.DashboardOverview, error) {
	patients, err := s.repo.GetPatients(ctx, orgID)
	if err != nil {
		return nil, err
	}

	overview := &models.DashboardOverview{}
	for _, p := range patients {
		if p.Status == models.StatusDischarged {
			continue
		}
		overview.TotalPatients++
		if p.Status == models.StatusCritical {
			overview.CriticalCount++
		} else {
			overview.StableCount++
		}

		summary := models.PatientSummary{Patient: p}
		vitals, _ := s.repo.GetLatestVitals(ctx, orgID, p.ID)
		if vitals != nil {
			summary.LatestVitals = vitals
		}
		overview.Patients = append(overview.Patients, summary)
	}

	alertCount, _ := s.repo.GetActiveAlertCount(ctx, orgID)
	overview.ActiveAlerts = alertCount

	return overview, nil
}

func (s *StatsService) GetPatientTrends(ctx context.Context, orgID, patientID string) ([]models.Vitals, error) {
	since := time.Now().Add(-24 * time.Hour)
	return s.repo.GetVitalsHistory(ctx, orgID, patientID, since)
}

func (s *StatsService) GetShiftSummary(ctx context.Context, orgID string) (*models.ShiftSummary, error) {
	now := time.Now()
	var shiftStart time.Time

	hour := now.Hour()
	switch {
	case hour >= 7 && hour < 15:
		shiftStart = time.Date(now.Year(), now.Month(), now.Day(), 7, 0, 0, 0, now.Location())
	case hour >= 15 && hour < 23:
		shiftStart = time.Date(now.Year(), now.Month(), now.Day(), 15, 0, 0, 0, now.Location())
	default:
		if hour < 7 {
			shiftStart = time.Date(now.Year(), now.Month(), now.Day()-1, 23, 0, 0, 0, now.Location())
		} else {
			shiftStart = time.Date(now.Year(), now.Month(), now.Day(), 23, 0, 0, 0, now.Location())
		}
	}

	date := now.Format("2006-01-02")
	stats, _ := s.repo.GetStats(ctx, orgID, date)

	return &models.ShiftSummary{
		ShiftStart:      shiftStart.Unix(),
		ShiftEnd:        shiftStart.Add(8 * time.Hour).Unix(),
		VitalsRecorded:  repository.MapToInt(stats, "vitals_recorded"),
		AlertsTriggered: repository.MapToInt(stats, "alerts_triggered"),
		AlertsAcked:     repository.MapToInt(stats, "alerts_acked"),
	}, nil
}

func (s *StatsService) GetOrgStats(ctx context.Context, orgID string) (*models.OrgStats, error) {
	patients, err := s.repo.GetPatients(ctx, orgID)
	if err != nil {
		return nil, err
	}

	active := 0
	for _, p := range patients {
		if p.Status != models.StatusDischarged {
			active++
		}
	}

	members, _ := s.repo.GetOrgMembers(ctx, orgID)
	month := time.Now().Format("2006-01")
	usage, _ := s.repo.GetUsage(ctx, orgID, month)

	return &models.OrgStats{
		TotalPatients:  len(patients),
		ActivePatients: active,
		TotalMembers:   len(members),
		TotalVitals:    repository.MapToInt(usage, "vitals_recorded"),
		TotalAlerts:    repository.MapToInt(usage, "alerts_generated"),
	}, nil
}

func (s *StatsService) GetUsage(ctx context.Context, orgID string) (*models.UsageStats, error) {
	month := time.Now().Format("2006-01")
	usage, err := s.repo.GetUsage(ctx, orgID, month)
	if err != nil {
		return nil, err
	}

	patients, _ := s.repo.GetPatients(ctx, orgID)
	active := 0
	for _, p := range patients {
		if p.Status != models.StatusDischarged {
			active++
		}
	}

	return &models.UsageStats{
		Month:           fmt.Sprintf("%s", month),
		VitalsRecorded:  repository.MapToInt(usage, "vitals_recorded"),
		AlertsGenerated: repository.MapToInt(usage, "alerts_generated"),
		ActivePatients:  active,
	}, nil
}
