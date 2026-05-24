package handlers

import (
	"context"
	"encoding/json"
	"fmt"
	"math"
	"math/rand"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/redis/go-redis/v9"
	"praana/internal/models"
	"praana/internal/repository"
	"praana/internal/utils"
)

type SeedHandler struct {
	repo *repository.RedisRepo
}

func NewSeedHandler(repo *repository.RedisRepo) *SeedHandler {
	return &SeedHandler{repo: repo}
}

type seedSpec struct {
	name, gender, bed, ward, diagnosis string
	age                                int
	status                             models.PatientStatus
	hrBase, bpSysBase, bpDiaBase      float64
	tempBase, spo2Base, rrBase        float64
	hrVar, bpVar, tempVar, spo2Var, rrVar float64
	critical                           bool
}

var demoPatients = []seedSpec{
	{
		name: "Sarah Mitchell", age: 67, gender: "female",
		bed: "1A", ward: "Cardiac ICU", diagnosis: "Post-operative cardiac care",
		status:   models.StatusCritical,
		hrBase:   115, bpSysBase: 158, bpDiaBase: 96, tempBase: 37.9, spo2Base: 91, rrBase: 23,
		hrVar:    10, bpVar: 14, tempVar: 0.3, spo2Var: 2, rrVar: 3, critical: true,
	},
	{
		name: "James Rodriguez", age: 45, gender: "male",
		bed: "2A", ward: "Cardiology", diagnosis: "Hypertensive crisis — stabilised",
		status:  models.StatusStable,
		hrBase:  76, bpSysBase: 126, bpDiaBase: 80, tempBase: 36.8, spo2Base: 97, rrBase: 15,
		hrVar:   5, bpVar: 8, tempVar: 0.15, spo2Var: 1, rrVar: 2,
	},
	{
		name: "Emily Chen", age: 32, gender: "female",
		bed: "5B", ward: "Respiratory", diagnosis: "Acute asthma exacerbation",
		status:  models.StatusActive,
		hrBase:  94, bpSysBase: 118, bpDiaBase: 75, tempBase: 37.3, spo2Base: 93, rrBase: 22,
		hrVar:   8, bpVar: 10, tempVar: 0.3, spo2Var: 2, rrVar: 4,
	},
	{
		name: "Robert Thompson", age: 78, gender: "male",
		bed: "6B", ward: "Respiratory", diagnosis: "COPD exacerbation",
		status:   models.StatusCritical,
		hrBase:   108, bpSysBase: 150, bpDiaBase: 90, tempBase: 38.3, spo2Base: 87, rrBase: 25,
		hrVar:    12, bpVar: 12, tempVar: 0.4, spo2Var: 3, rrVar: 5, critical: true,
	},
	{
		name: "Priya Sharma", age: 55, gender: "female",
		bed: "3C", ward: "General Medicine", diagnosis: "Diabetic ketoacidosis",
		status:  models.StatusStable,
		hrBase:  82, bpSysBase: 130, bpDiaBase: 82, tempBase: 37.0, spo2Base: 96, rrBase: 16,
		hrVar:   6, bpVar: 10, tempVar: 0.2, spo2Var: 1, rrVar: 2,
	},
	{
		name: "Michael Foster", age: 62, gender: "male",
		bed: "4C", ward: "Cardiology", diagnosis: "Atrial fibrillation with RVR",
		status:  models.StatusActive,
		hrBase:  90, bpSysBase: 136, bpDiaBase: 86, tempBase: 36.9, spo2Base: 95, rrBase: 18,
		hrVar:   14, bpVar: 12, tempVar: 0.2, spo2Var: 2, rrVar: 3,
	},
	{
		name: "Linda Patel", age: 70, gender: "female",
		bed: "7D", ward: "Neurology", diagnosis: "Ischemic stroke — monitoring",
		status:  models.StatusStable,
		hrBase:  72, bpSysBase: 120, bpDiaBase: 76, tempBase: 36.7, spo2Base: 97, rrBase: 14,
		hrVar:   4, bpVar: 7, tempVar: 0.15, spo2Var: 1, rrVar: 2,
	},
	{
		name: "David Kim", age: 41, gender: "male",
		bed: "8D", ward: "General Medicine", diagnosis: "Community-acquired pneumonia",
		status:  models.StatusActive,
		hrBase:  96, bpSysBase: 122, bpDiaBase: 78, tempBase: 38.5, spo2Base: 93, rrBase: 20,
		hrVar:   8, bpVar: 8, tempVar: 0.5, spo2Var: 2, rrVar: 3,
	},
}

func (h *SeedHandler) Seed(c *gin.Context) {
	orgID := c.GetString("org_id")
	userID := c.GetString("user_id")
	ctx := context.Background()

	// Guard: don't double-seed
	existing, _ := h.repo.GetPatients(ctx, orgID)
	if len(existing) >= 5 {
		utils.BadRequest(c, "org already has patient data — delete existing patients first")
		return
	}

	rng := rand.New(rand.NewSource(time.Now().UnixNano()))
	now := time.Now()
	rdb := h.repo.Client()

	totalVitals, totalAlerts := 0, 0

	for _, sp := range demoPatients {
		patient := &models.Patient{
			ID:         utils.GenerateID(),
			OrgID:      orgID,
			Name:       sp.name,
			Age:        sp.age,
			Gender:     sp.gender,
			BedNumber:  sp.bed,
			Ward:       sp.ward,
			Diagnosis:  sp.diagnosis,
			Status:     sp.status,
			AdmittedAt: now.Add(-time.Duration(rng.Intn(72)+24) * time.Hour).Unix(),
			CreatedAt:  now.Unix(),
			UpdatedAt:  now.Unix(),
		}
		if err := h.repo.CreatePatient(ctx, patient); err != nil {
			utils.InternalError(c, "seed patient failed: "+err.Error())
			return
		}

		// 48 vitals readings — one every 30 min over the past 24 h
		streamKey := fmt.Sprintf("vitals:%s:%s", orgID, patient.ID)
		var latestData []byte

		for i := 47; i >= 0; i-- {
			ts := now.Add(-time.Duration(i) * 30 * time.Minute)
			phase := float64(47-i) / 47.0 * 2 * math.Pi
			s := math.Sin(phase)
			noise := func(v float64) float64 { return rng.Float64()*v - v/2 }

			v := &models.Vitals{
				ID:              utils.GenerateID(),
				PatientID:       patient.ID,
				OrgID:           orgID,
				RecordedBy:      userID,
				HeartRate:       seedClamp(math.Round(sp.hrBase+s*sp.hrVar/2+noise(sp.hrVar)), 40, 200),
				SystolicBP:      seedClamp(math.Round(sp.bpSysBase+s*sp.bpVar/2+noise(sp.bpVar)), 70, 220),
				DiastolicBP:     seedClamp(math.Round(sp.bpDiaBase+s*sp.bpVar/3+noise(sp.bpVar/2)), 40, 130),
				Temperature:     seedClamp(math.Round((sp.tempBase+s*sp.tempVar/2+noise(sp.tempVar))*10)/10, 35.0, 42.0),
				SpO2:            seedClamp(math.Round(sp.spo2Base+s*sp.spo2Var/2+noise(sp.spo2Var)), 70, 100),
				RespiratoryRate: seedClamp(math.Round(sp.rrBase+s*sp.rrVar/2+noise(sp.rrVar)), 8, 40),
				RecordedAt:      ts.Unix(),
			}

			data, _ := json.Marshal(v)
			streamID := fmt.Sprintf("%d-0", ts.UnixMilli())
			err := rdb.XAdd(ctx, &redis.XAddArgs{
				Stream: streamKey,
				ID:     streamID,
				Values: map[string]interface{}{"data": string(data)},
			}).Err()
			if err == nil {
				latestData = data
				totalVitals++
			}
		}

		// Set latest vitals cache key
		if latestData != nil {
			rdb.Set(ctx, fmt.Sprintf("latest_vitals:%s:%s", orgID, patient.ID), latestData, 0)
		}

		// Active (unacknowledged) alerts for critical patients
		if sp.critical {
			for _, def := range []struct {
				vt, msg string
				val, thr float64
			}{
				{
					vt:  "heart_rate",
					msg: fmt.Sprintf("%s: heart_rate %.0f exceeds 100.0", sp.name, sp.hrBase+sp.hrVar),
					val: sp.hrBase + sp.hrVar, thr: 100,
				},
				{
					vt:  "spo2",
					msg: fmt.Sprintf("%s: spo2 %.0f below 92.0", sp.name, sp.spo2Base),
					val: sp.spo2Base, thr: 92,
				},
			} {
				alert := &models.Alert{
					ID:          utils.GenerateID(),
					OrgID:       orgID,
					PatientID:   patient.ID,
					PatientName: sp.name,
					VitalType:   def.vt,
					Value:       def.val,
					Threshold:   def.thr,
					Severity:    models.SeverityCritical,
					Message:     def.msg,
					CreatedAt:   now.Add(-time.Duration(rng.Intn(55)+5) * time.Minute).Unix(),
				}
				alertData, _ := json.Marshal(alert)
				rdb.Set(ctx, fmt.Sprintf("alert:%s:%s", orgID, alert.ID), alertData, 0)
				rdb.LPush(ctx, fmt.Sprintf("alert_history:%s", orgID), alertData)
				totalAlerts++
			}
		}

		// Historical acknowledged alert for every patient (populates history tab)
		ackBase := now.Add(-time.Duration(rng.Intn(120)+120) * time.Minute)
		ackAlert := &models.Alert{
			ID:             utils.GenerateID(),
			OrgID:          orgID,
			PatientID:      patient.ID,
			PatientName:    sp.name,
			VitalType:      "heart_rate",
			Value:          sp.hrBase + sp.hrVar*0.5,
			Threshold:      100,
			Severity:       models.SeverityWarning,
			Message:        fmt.Sprintf("%s: heart_rate elevated, monitoring in progress", sp.name),
			Acknowledged:   true,
			AcknowledgedAt: ackBase.Add(30 * time.Minute).Unix(),
			CreatedAt:      ackBase.Unix(),
		}
		ackData, _ := json.Marshal(ackAlert)
		rdb.LPush(ctx, fmt.Sprintf("alert_history:%s", orgID), ackData)
		totalAlerts++
	}

	// Bump shift stats so the dashboard shift summary looks populated
	today := now.Format("2006-01-02")
	month := now.Format("2006-01")
	rdb.HIncrBy(ctx, fmt.Sprintf("stats:%s:%s", orgID, today), "vitals_recorded", int64(totalVitals))
	rdb.HIncrBy(ctx, fmt.Sprintf("stats:%s:%s", orgID, today), "alerts_triggered", int64(totalAlerts))
	rdb.HIncrBy(ctx, fmt.Sprintf("stats:%s:%s", orgID, today), "alerts_acked", int64(len(demoPatients)))
	rdb.HIncrBy(ctx, fmt.Sprintf("usage:%s:%s", orgID, month), "vitals_recorded", int64(totalVitals))
	rdb.HIncrBy(ctx, fmt.Sprintf("usage:%s:%s", orgID, month), "alerts_generated", int64(totalAlerts))
	rdb.HIncrBy(ctx, fmt.Sprintf("usage:%s:%s", orgID, month), "active_patients", int64(len(demoPatients)))

	utils.OK(c, gin.H{
		"patients": len(demoPatients),
		"vitals":   totalVitals,
		"alerts":   totalAlerts,
		"message":  "Demo data seeded successfully",
	})
}

func seedClamp(v, min, max float64) float64 {
	if v < min {
		return min
	}
	if v > max {
		return max
	}
	return v
}
