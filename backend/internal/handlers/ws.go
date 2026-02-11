package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
	"github.com/rs/zerolog/log"
	"praana/internal/services"
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

type WSHandler struct {
	hub         *services.WSHub
	authService *services.AuthService
}

func NewWSHandler(hub *services.WSHub, authService *services.AuthService) *WSHandler {
	return &WSHandler{hub: hub, authService: authService}
}

// WSConnect godoc
// @Summary WebSocket connection for real-time alerts
// @Tags websocket
// @Param token query string true "JWT token"
// @Router /ws [get]
func (h *WSHandler) Handle(c *gin.Context) {
	token := c.Query("token")
	if token == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "token required"})
		return
	}

	claims, err := h.authService.ValidateToken(token)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid token"})
		return
	}

	conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		log.Error().Err(err).Msg("WebSocket upgrade failed")
		return
	}

	client := &services.WSClient{
		Conn:  conn,
		OrgID: claims.OrgID,
		Send:  make(chan []byte, 256),
	}

	h.hub.Register(client)

	go services.WritePump(client)
	go services.ReadPump(h.hub, client)
}
