package utils

import (
	"fmt"
	"sync"

	"github.com/google/uuid"
	"github.com/sony/sonyflake"
)

var (
	sf   *sonyflake.Sonyflake
	once sync.Once
)

func initSonyflake() {
	once.Do(func() {
		sf = sonyflake.NewSonyflake(sonyflake.Settings{})
	})
}

func GenerateID() string {
	initSonyflake()
	id, err := sf.NextID()
	if err != nil {
		return uuid.New().String()
	}
	return fmt.Sprintf("%d", id)
}

func GenerateUUID() string {
	return uuid.New().String()
}

func GenerateInviteCode() string {
	return uuid.New().String()[:8]
}
