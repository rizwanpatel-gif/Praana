package repository

import (
	"context"
	"encoding/json"
	"fmt"
	"strconv"
	"time"

	"github.com/redis/go-redis/v9"
	"github.com/rs/zerolog/log"
	"praana/internal/models"
)

type RedisRepo struct {
	client *redis.Client
}

func NewRedisRepo(addr, password string, db int) (*RedisRepo, error) {
	client := redis.NewClient(&redis.Options{
		Addr:     addr,
		Password: password,
		DB:       db,
	})
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	if err := client.Ping(ctx).Err(); err != nil {
		return nil, fmt.Errorf("redis connection failed: %w", err)
	}
	log.Info().Str("addr", addr).Msg("Connected to Redis")
	return &RedisRepo{client: client}, nil
}

func (r *RedisRepo) Client() *redis.Client {
	return r.client
}

// ============ ORG ============

func (r *RedisRepo) CreateOrg(ctx context.Context, org *models.Org) error {
	data, _ := json.Marshal(org)
	pipe := r.client.Pipeline()
	pipe.Set(ctx, fmt.Sprintf("org:%s", org.ID), data, 0)
	pipe.SAdd(ctx, "orgs:all", org.ID)
	_, err := pipe.Exec(ctx)
	return err
}

func (r *RedisRepo) GetOrg(ctx context.Context, orgID string) (*models.Org, error) {
	data, err := r.client.Get(ctx, fmt.Sprintf("org:%s", orgID)).Bytes()
	if err == redis.Nil {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	var org models.Org
	return &org, json.Unmarshal(data, &org)
}

func (r *RedisRepo) UpdateOrg(ctx context.Context, org *models.Org) error {
	data, _ := json.Marshal(org)
	return r.client.Set(ctx, fmt.Sprintf("org:%s", org.ID), data, 0).Err()
}

// ============ USER ============

func (r *RedisRepo) CreateUser(ctx context.Context, user *models.User) error {
	data, _ := json.Marshal(user)
	pipe := r.client.Pipeline()
	pipe.Set(ctx, fmt.Sprintf("user:%s", user.ID), data, 0)
	pipe.Set(ctx, fmt.Sprintf("user_email:%s", user.Email), user.ID, 0)
	pipe.SAdd(ctx, fmt.Sprintf("org:%s:members", user.OrgID), user.ID)
	_, err := pipe.Exec(ctx)
	return err
}

func (r *RedisRepo) GetUser(ctx context.Context, userID string) (*models.User, error) {
	data, err := r.client.Get(ctx, fmt.Sprintf("user:%s", userID)).Bytes()
	if err == redis.Nil {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	var user models.User
	return &user, json.Unmarshal(data, &user)
}

func (r *RedisRepo) GetUserByEmail(ctx context.Context, email string) (*models.User, error) {
	userID, err := r.client.Get(ctx, fmt.Sprintf("user_email:%s", email)).Result()
	if err == redis.Nil {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return r.GetUser(ctx, userID)
}

func (r *RedisRepo) GetOrgMembers(ctx context.Context, orgID string) ([]models.User, error) {
	memberIDs, err := r.client.SMembers(ctx, fmt.Sprintf("org:%s:members", orgID)).Result()
	if err != nil {
		return nil, err
	}
	var members []models.User
	for _, id := range memberIDs {
		user, err := r.GetUser(ctx, id)
		if err != nil || user == nil {
			continue
		}
		members = append(members, *user)
	}
	return members, nil
}

func (r *RedisRepo) RemoveOrgMember(ctx context.Context, orgID, userID string) error {
	user, err := r.GetUser(ctx, userID)
	if err != nil || user == nil {
		return fmt.Errorf("user not found")
	}
	pipe := r.client.Pipeline()
	pipe.Del(ctx, fmt.Sprintf("user:%s", userID))
	pipe.Del(ctx, fmt.Sprintf("user_email:%s", user.Email))
	pipe.SRem(ctx, fmt.Sprintf("org:%s:members", orgID), userID)
	_, err = pipe.Exec(ctx)
	return err
}

func (r *RedisRepo) GetOrgMemberCount(ctx context.Context, orgID string) (int64, error) {
	return r.client.SCard(ctx, fmt.Sprintf("org:%s:members", orgID)).Result()
}

// ============ SESSION ============

func (r *RedisRepo) CreateSession(ctx context.Context, jwtID, userID string, expiry time.Duration) error {
	return r.client.Set(ctx, fmt.Sprintf("session:%s", jwtID), userID, expiry).Err()
}

func (r *RedisRepo) GetSession(ctx context.Context, jwtID string) (string, error) {
	return r.client.Get(ctx, fmt.Sprintf("session:%s", jwtID)).Result()
}

func (r *RedisRepo) DeleteSession(ctx context.Context, jwtID string) error {
	return r.client.Del(ctx, fmt.Sprintf("session:%s", jwtID)).Err()
}

// ============ INVITE ============

func (r *RedisRepo) CreateInvite(ctx context.Context, invite *models.Invite) error {
	data, _ := json.Marshal(invite)
	return r.client.Set(ctx, fmt.Sprintf("invite:%s", invite.Code), data, 72*time.Hour).Err()
}

func (r *RedisRepo) GetInvite(ctx context.Context, code string) (*models.Invite, error) {
	data, err := r.client.Get(ctx, fmt.Sprintf("invite:%s", code)).Bytes()
	if err == redis.Nil {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	var invite models.Invite
	return &invite, json.Unmarshal(data, &invite)
}

func (r *RedisRepo) DeleteInvite(ctx context.Context, code string) error {
	return r.client.Del(ctx, fmt.Sprintf("invite:%s", code)).Err()
}

// ============ PATIENT ============

func (r *RedisRepo) CreatePatient(ctx context.Context, patient *models.Patient) error {
	data, _ := json.Marshal(patient)
	pipe := r.client.Pipeline()
	pipe.Set(ctx, fmt.Sprintf("patient:%s:%s", patient.OrgID, patient.ID), data, 0)
	pipe.SAdd(ctx, fmt.Sprintf("patients:%s", patient.OrgID), patient.ID)
	_, err := pipe.Exec(ctx)
	return err
}

func (r *RedisRepo) GetPatient(ctx context.Context, orgID, patientID string) (*models.Patient, error) {
	data, err := r.client.Get(ctx, fmt.Sprintf("patient:%s:%s", orgID, patientID)).Bytes()
	if err == redis.Nil {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	var patient models.Patient
	return &patient, json.Unmarshal(data, &patient)
}

func (r *RedisRepo) UpdatePatient(ctx context.Context, patient *models.Patient) error {
	data, _ := json.Marshal(patient)
	return r.client.Set(ctx, fmt.Sprintf("patient:%s:%s", patient.OrgID, patient.ID), data, 0).Err()
}

func (r *RedisRepo) DeletePatient(ctx context.Context, orgID, patientID string) error {
	pipe := r.client.Pipeline()
	pipe.Del(ctx, fmt.Sprintf("patient:%s:%s", orgID, patientID))
	pipe.SRem(ctx, fmt.Sprintf("patients:%s", orgID), patientID)
	_, err := pipe.Exec(ctx)
	return err
}

func (r *RedisRepo) GetPatients(ctx context.Context, orgID string) ([]models.Patient, error) {
	patientIDs, err := r.client.SMembers(ctx, fmt.Sprintf("patients:%s", orgID)).Result()
	if err != nil {
		return nil, err
	}
	var patients []models.Patient
	for _, id := range patientIDs {
		p, err := r.GetPatient(ctx, orgID, id)
		if err != nil || p == nil {
			continue
		}
		patients = append(patients, *p)
	}
	return patients, nil
}

func (r *RedisRepo) GetPatientCount(ctx context.Context, orgID string) (int64, error) {
	return r.client.SCard(ctx, fmt.Sprintf("patients:%s", orgID)).Result()
}

// ============ VITALS ============

func (r *RedisRepo) RecordVitals(ctx context.Context, vitals *models.Vitals) error {
	data, _ := json.Marshal(vitals)
	streamKey := fmt.Sprintf("vitals:%s:%s", vitals.OrgID, vitals.PatientID)
	latestKey := fmt.Sprintf("latest_vitals:%s:%s", vitals.OrgID, vitals.PatientID)

	pipe := r.client.Pipeline()
	pipe.XAdd(ctx, &redis.XAddArgs{
		Stream: streamKey,
		Values: map[string]interface{}{"data": string(data)},
	})
	pipe.Set(ctx, latestKey, data, 0)
	_, err := pipe.Exec(ctx)
	return err
}

func (r *RedisRepo) GetLatestVitals(ctx context.Context, orgID, patientID string) (*models.Vitals, error) {
	data, err := r.client.Get(ctx, fmt.Sprintf("latest_vitals:%s:%s", orgID, patientID)).Bytes()
	if err == redis.Nil {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	var vitals models.Vitals
	return &vitals, json.Unmarshal(data, &vitals)
}

func (r *RedisRepo) GetVitalsHistory(ctx context.Context, orgID, patientID string, since time.Time) ([]models.Vitals, error) {
	streamKey := fmt.Sprintf("vitals:%s:%s", orgID, patientID)
	sinceMs := fmt.Sprintf("%d-0", since.UnixMilli())

	msgs, err := r.client.XRange(ctx, streamKey, sinceMs, "+").Result()
	if err != nil {
		return nil, err
	}
	var vitals []models.Vitals
	for _, msg := range msgs {
		dataStr, ok := msg.Values["data"].(string)
		if !ok {
			continue
		}
		var v models.Vitals
		if err := json.Unmarshal([]byte(dataStr), &v); err == nil {
			vitals = append(vitals, v)
		}
	}
	return vitals, nil
}

// ============ THRESHOLDS ============

func (r *RedisRepo) SetThresholds(ctx context.Context, key string, t *models.Threshold) error {
	data, _ := json.Marshal(t)
	return r.client.Set(ctx, key, data, 0).Err()
}

func (r *RedisRepo) GetThresholds(ctx context.Context, key string) (*models.Threshold, error) {
	data, err := r.client.Get(ctx, key).Bytes()
	if err == redis.Nil {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	var t models.Threshold
	return &t, json.Unmarshal(data, &t)
}

// ============ ALERTS ============

func (r *RedisRepo) CreateAlert(ctx context.Context, alert *models.Alert) error {
	data, _ := json.Marshal(alert)
	pipe := r.client.Pipeline()
	pipe.Set(ctx, fmt.Sprintf("alert:%s:%s", alert.OrgID, alert.ID), data, 0)
	pipe.LPush(ctx, fmt.Sprintf("alert_history:%s", alert.OrgID), data)
	pipe.LTrim(ctx, fmt.Sprintf("alert_history:%s", alert.OrgID), 0, 499)
	_, err := pipe.Exec(ctx)
	return err
}

func (r *RedisRepo) GetAlert(ctx context.Context, orgID, alertID string) (*models.Alert, error) {
	data, err := r.client.Get(ctx, fmt.Sprintf("alert:%s:%s", orgID, alertID)).Bytes()
	if err == redis.Nil {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	var alert models.Alert
	return &alert, json.Unmarshal(data, &alert)
}

func (r *RedisRepo) UpdateAlert(ctx context.Context, alert *models.Alert) error {
	data, _ := json.Marshal(alert)
	return r.client.Set(ctx, fmt.Sprintf("alert:%s:%s", alert.OrgID, alert.ID), data, 0).Err()
}

func (r *RedisRepo) GetAlertHistory(ctx context.Context, orgID string, limit int64) ([]models.Alert, error) {
	results, err := r.client.LRange(ctx, fmt.Sprintf("alert_history:%s", orgID), 0, limit-1).Result()
	if err != nil {
		return nil, err
	}
	var alerts []models.Alert
	for _, raw := range results {
		var a models.Alert
		if err := json.Unmarshal([]byte(raw), &a); err == nil {
			alerts = append(alerts, a)
		}
	}
	return alerts, nil
}

func (r *RedisRepo) PublishAlert(ctx context.Context, orgID string, alert *models.Alert) error {
	data, _ := json.Marshal(alert)
	return r.client.Publish(ctx, fmt.Sprintf("alerts:%s", orgID), data).Err()
}

func (r *RedisRepo) SubscribeAlerts(ctx context.Context, orgID string) *redis.PubSub {
	return r.client.Subscribe(ctx, fmt.Sprintf("alerts:%s", orgID))
}

// ============ STATS ============

func (r *RedisRepo) IncrStat(ctx context.Context, orgID, date, field string, by int64) error {
	return r.client.HIncrBy(ctx, fmt.Sprintf("stats:%s:%s", orgID, date), field, by).Err()
}

func (r *RedisRepo) GetStats(ctx context.Context, orgID, date string) (map[string]string, error) {
	return r.client.HGetAll(ctx, fmt.Sprintf("stats:%s:%s", orgID, date)).Result()
}

func (r *RedisRepo) IncrUsage(ctx context.Context, orgID, month, field string, by int64) error {
	return r.client.HIncrBy(ctx, fmt.Sprintf("usage:%s:%s", orgID, month), field, by).Err()
}

func (r *RedisRepo) GetUsage(ctx context.Context, orgID, month string) (map[string]string, error) {
	return r.client.HGetAll(ctx, fmt.Sprintf("usage:%s:%s", orgID, month)).Result()
}

// ============ HELPERS ============

func (r *RedisRepo) GetActiveAlertCount(ctx context.Context, orgID string) (int, error) {
	alerts, err := r.GetAlertHistory(ctx, orgID, 100)
	if err != nil {
		return 0, err
	}
	count := 0
	for _, a := range alerts {
		if !a.Acknowledged {
			count++
		}
	}
	return count, nil
}

func (r *RedisRepo) GetActiveAlerts(ctx context.Context, orgID string) ([]models.Alert, error) {
	alerts, err := r.GetAlertHistory(ctx, orgID, 500)
	if err != nil {
		return nil, err
	}
	var active []models.Alert
	for _, a := range alerts {
		if !a.Acknowledged {
			active = append(active, a)
		}
	}
	return active, nil
}

func MapToInt(m map[string]string, key string) int {
	v, ok := m[key]
	if !ok {
		return 0
	}
	i, _ := strconv.Atoi(v)
	return i
}
