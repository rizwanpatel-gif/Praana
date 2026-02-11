package main

import (
	"fmt"
	"os"

	"github.com/gin-gonic/gin"
	"github.com/rs/zerolog"
	"github.com/rs/zerolog/log"
	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"

	_ "praana/docs"
	"praana/internal/config"
	"praana/internal/handlers"
	"praana/internal/middleware"
	"praana/internal/repository"
	"praana/internal/services"
)

// @title Praana API
// @version 1.0
// @description Multi-tenant SaaS platform for hospital/clinic patient vitals management
// @host localhost:8080
// @BasePath /
// @securityDefinitions.apikey BearerAuth
// @in header
// @name Authorization
func main() {
	// Load config
	cfg, err := config.Load()
	if err != nil {
		log.Fatal().Err(err).Msg("Failed to load config")
	}

	// Setup logging
	zerolog.TimeFieldFormat = zerolog.TimeFormatUnix
	level, _ := zerolog.ParseLevel(cfg.LogLevel)
	zerolog.SetGlobalLevel(level)
	log.Logger = log.Output(zerolog.ConsoleWriter{Out: os.Stderr})

	// Connect Redis
	repo, err := repository.NewRedisRepo(cfg.RedisAddr, cfg.RedisPass, cfg.RedisDB)
	if err != nil {
		log.Fatal().Err(err).Msg("Failed to connect to Redis")
	}

	// Init WebSocket hub
	wsHub := services.NewWSHub()
	go wsHub.Run()

	// Init services
	authService := services.NewAuthService(repo, cfg.JWTSecret, cfg.JWTExpiry)
	orgService := services.NewOrgService(repo)
	patientService := services.NewPatientService(repo)
	statsService := services.NewStatsService(repo)
	alertService := services.NewAlertService(repo, wsHub)
	vitalsService := services.NewVitalsService(repo, alertService, statsService)

	// Init handlers
	authHandler := handlers.NewAuthHandler(authService, orgService)
	orgHandler := handlers.NewOrgHandler(orgService)
	patientHandler := handlers.NewPatientHandler(patientService, orgService, vitalsService)
	vitalsHandler := handlers.NewVitalsHandler(vitalsService)
	alertHandler := handlers.NewAlertHandler(alertService)
	dashboardHandler := handlers.NewDashboardHandler(statsService)
	wsHandler := handlers.NewWSHandler(wsHub, authService)

	// Setup Gin
	r := gin.Default()
	r.Use(middleware.CORSMiddleware(cfg.CORSOrigins))
	r.Use(middleware.RateLimitMiddleware(120))

	// Health check
	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok", "service": "praana"})
	})

	// Swagger
	r.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))

	// WebSocket
	r.GET("/ws", wsHandler.Handle)

	// Public routes
	api := r.Group("/api")
	{
		auth := api.Group("/auth")
		{
			auth.POST("/signup", authHandler.Signup)
			auth.POST("/login", authHandler.Login)
			auth.POST("/accept-invite", authHandler.AcceptInvite)
		}
	}

	// Protected routes
	protected := api.Group("")
	protected.Use(middleware.AuthMiddleware(authService))
	{
		protected.POST("/auth/logout", authHandler.Logout)

		// Org
		org := protected.Group("/org")
		{
			org.GET("", orgHandler.GetOrg)
			org.PUT("", middleware.AdminOnly(), orgHandler.UpdateOrg)
			org.GET("/members", orgHandler.GetMembers)
			org.DELETE("/members/:id", middleware.AdminOnly(), orgHandler.RemoveMember)
			org.POST("/invite", middleware.AdminOnly(), orgHandler.Invite)
		}

		// Patients
		patients := protected.Group("/patients")
		{
			patients.POST("", patientHandler.Create)
			patients.GET("", patientHandler.List)
			patients.GET("/:id", patientHandler.Get)
			patients.PUT("/:id", patientHandler.Update)
			patients.DELETE("/:id", patientHandler.Delete)
			patients.POST("/:id/vitals", vitalsHandler.Record)
			patients.GET("/:id/vitals", vitalsHandler.GetHistory)
		}

		// Vitals bulk
		protected.POST("/vitals/bulk", vitalsHandler.BulkRecord)

		// Alerts
		alerts := protected.Group("/alerts")
		{
			alerts.GET("", alertHandler.GetActive)
			alerts.POST("/:id/acknowledge", alertHandler.Acknowledge)
			alerts.GET("/history", alertHandler.GetHistory)
		}

		// Thresholds
		thresholds := protected.Group("/thresholds")
		{
			thresholds.GET("", alertHandler.GetThresholds)
			thresholds.PUT("", middleware.AdminOnly(), alertHandler.SetOrgThresholds)
			thresholds.PUT("/patient/:id", alertHandler.SetPatientThresholds)
		}

		// Dashboard
		dashboard := protected.Group("/dashboard")
		{
			dashboard.GET("/overview", dashboardHandler.Overview)
			dashboard.GET("/patient/:id/trends", dashboardHandler.PatientTrends)
			dashboard.GET("/shift-summary", dashboardHandler.ShiftSummary)
			dashboard.GET("/org-stats", dashboardHandler.OrgStats)
			dashboard.GET("/usage", dashboardHandler.Usage)
		}
	}

	addr := fmt.Sprintf(":%s", cfg.ServerPort)
	log.Info().Str("addr", addr).Msg("Starting Praana server")
	if err := r.Run(addr); err != nil {
		log.Fatal().Err(err).Msg("Server failed")
	}
}
