package config

import (
	"time"

	"github.com/spf13/viper"
)

type Config struct {
	ServerPort  string        `mapstructure:"SERVER_PORT"`
	RedisAddr   string        `mapstructure:"REDIS_ADDR"`
	RedisPass   string        `mapstructure:"REDIS_PASSWORD"`
	RedisDB     int           `mapstructure:"REDIS_DB"`
	JWTSecret   string        `mapstructure:"JWT_SECRET"`
	JWTExpiry   time.Duration `mapstructure:"JWT_EXPIRY"`
	CORSOrigins string        `mapstructure:"CORS_ORIGINS"`
	LogLevel    string        `mapstructure:"LOG_LEVEL"`
}

func Load() (*Config, error) {
	viper.SetConfigFile(".env")
	viper.AutomaticEnv()

	viper.SetDefault("SERVER_PORT", "8080")
	viper.SetDefault("REDIS_ADDR", "localhost:6379")
	viper.SetDefault("REDIS_PASSWORD", "")
	viper.SetDefault("REDIS_DB", 0)
	viper.SetDefault("JWT_SECRET", "dev-secret-change-me")
	viper.SetDefault("JWT_EXPIRY", "24h")
	viper.SetDefault("CORS_ORIGINS", "http://localhost:4200")
	viper.SetDefault("LOG_LEVEL", "debug")

	_ = viper.ReadInConfig() // OK if .env doesn't exist

	cfg := &Config{}
	if err := viper.Unmarshal(cfg); err != nil {
		return nil, err
	}
	return cfg, nil
}
