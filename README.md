# Praana

Multi-tenant SaaS platform for hospitals/clinics to manage patient vitals in real-time.

## Tech Stack

- **Backend**: Go (Gin) + Redis 7 (Streams, Pub/Sub)
- **Frontend**: Angular 19 + Angular Material + Tailwind CSS + ECharts
- **Real-time**: WebSocket alerts via Gorilla WebSocket + Redis Pub/Sub
- **Auth**: JWT with bcrypt passwords, session management in Redis

## Getting Started

### Prerequisites

- Docker & Docker Compose
- Go 1.22+
- Node.js 22+ & npm

### Start Redis

```bash
docker compose up -d
```

### Run Backend

```bash
cd backend
cp .env.example .env
go mod tidy
go run ./cmd/server
```

Backend starts at `http://localhost:8080`
Swagger docs at `http://localhost:8080/swagger/index.html`

### Run Frontend

```bash
cd frontend/praana
npm install
npx ng serve
```

Frontend starts at `http://localhost:4200`

## API Endpoints

### Auth
- `POST /api/auth/signup` - Create account + org
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `POST /api/auth/accept-invite` - Accept invite

### Org
- `GET /api/org` - Get org details
- `PUT /api/org` - Update org (Admin)
- `GET /api/org/members` - List members
- `DELETE /api/org/members/:id` - Remove member (Admin)
- `POST /api/org/invite` - Send invite (Admin)

### Patients
- `POST /api/patients` - Add patient
- `GET /api/patients` - List patients
- `GET /api/patients/:id` - Get patient + latest vitals
- `PUT /api/patients/:id` - Update patient
- `DELETE /api/patients/:id` - Discharge

### Vitals
- `POST /api/patients/:id/vitals` - Record vitals
- `POST /api/vitals/bulk` - Quick entry (multiple patients)
- `GET /api/patients/:id/vitals?range=24h` - Vitals history

### Alerts
- `GET /api/alerts` - Active alerts
- `POST /api/alerts/:id/acknowledge` - Acknowledge
- `GET /api/alerts/history` - History
- `GET /api/thresholds` - Get thresholds
- `PUT /api/thresholds` - Set org thresholds (Admin)
- `PUT /api/thresholds/patient/:id` - Per-patient thresholds

### Dashboard
- `GET /api/dashboard/overview` - Patient cards + vitals
- `GET /api/dashboard/patient/:id/trends` - Chart data
- `GET /api/dashboard/shift-summary` - Shift stats
- `GET /api/dashboard/org-stats` - Org statistics
- `GET /api/dashboard/usage` - Usage metering

### WebSocket
- `GET /ws?token=JWT` - Real-time alert stream

## Plan Limits

| Feature | Free | Pro | Enterprise |
|---------|------|-----|------------|
| Patients | 20 | 200 | Unlimited |
| Members | 3 | 20 | Unlimited |
