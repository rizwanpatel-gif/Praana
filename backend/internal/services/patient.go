package services

import (
	"context"
	"fmt"
	"time"

	"praana/internal/models"
	"praana/internal/repository"
	"praana/internal/utils"
)

type PatientService struct {
	repo *repository.RedisRepo
}

func NewPatientService(repo *repository.RedisRepo) *PatientService {
	return &PatientService{repo: repo}
}

func (s *PatientService) Create(ctx context.Context, orgID string, req *models.CreatePatientRequest) (*models.Patient, error) {
	patient := &models.Patient{
		ID:         utils.GenerateID(),
		OrgID:      orgID,
		Name:       req.Name,
		Age:        req.Age,
		Gender:     req.Gender,
		BedNumber:  req.BedNumber,
		Ward:       req.Ward,
		Diagnosis:  req.Diagnosis,
		Status:     models.StatusActive,
		AdmittedAt: time.Now().Unix(),
		CreatedAt:  time.Now().Unix(),
		UpdatedAt:  time.Now().Unix(),
	}
	if err := s.repo.CreatePatient(ctx, patient); err != nil {
		return nil, err
	}
	return patient, nil
}

func (s *PatientService) List(ctx context.Context, orgID string) ([]models.Patient, error) {
	return s.repo.GetPatients(ctx, orgID)
}

func (s *PatientService) Get(ctx context.Context, orgID, patientID string) (*models.Patient, error) {
	p, err := s.repo.GetPatient(ctx, orgID, patientID)
	if err != nil {
		return nil, err
	}
	if p == nil {
		return nil, fmt.Errorf("patient not found")
	}
	return p, nil
}

func (s *PatientService) Update(ctx context.Context, orgID, patientID string, req *models.UpdatePatientRequest) (*models.Patient, error) {
	p, err := s.repo.GetPatient(ctx, orgID, patientID)
	if err != nil || p == nil {
		return nil, fmt.Errorf("patient not found")
	}

	if req.Name != "" {
		p.Name = req.Name
	}
	if req.Age > 0 {
		p.Age = req.Age
	}
	if req.BedNumber != "" {
		p.BedNumber = req.BedNumber
	}
	if req.Ward != "" {
		p.Ward = req.Ward
	}
	if req.Diagnosis != "" {
		p.Diagnosis = req.Diagnosis
	}
	if req.Status != "" {
		p.Status = models.PatientStatus(req.Status)
		if p.Status == models.StatusDischarged {
			p.DischargedAt = time.Now().Unix()
		}
	}
	p.UpdatedAt = time.Now().Unix()

	if err := s.repo.UpdatePatient(ctx, p); err != nil {
		return nil, err
	}
	return p, nil
}

func (s *PatientService) Delete(ctx context.Context, orgID, patientID string) error {
	p, err := s.repo.GetPatient(ctx, orgID, patientID)
	if err != nil || p == nil {
		return fmt.Errorf("patient not found")
	}
	return s.repo.DeletePatient(ctx, orgID, patientID)
}
