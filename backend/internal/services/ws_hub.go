package services

import (
	"encoding/json"
	"sync"

	"github.com/gorilla/websocket"
	"github.com/rs/zerolog/log"
)

type WSClient struct {
	Conn  *websocket.Conn
	OrgID string
	Send  chan []byte
}

type WSHub struct {
	clients    map[string]map[*WSClient]bool // orgID -> clients
	register   chan *WSClient
	unregister chan *WSClient
	mu         sync.RWMutex
}

func NewWSHub() *WSHub {
	return &WSHub{
		clients:    make(map[string]map[*WSClient]bool),
		register:   make(chan *WSClient),
		unregister: make(chan *WSClient),
	}
}

func (h *WSHub) Run() {
	for {
		select {
		case client := <-h.register:
			h.mu.Lock()
			if _, ok := h.clients[client.OrgID]; !ok {
				h.clients[client.OrgID] = make(map[*WSClient]bool)
			}
			h.clients[client.OrgID][client] = true
			h.mu.Unlock()
			log.Info().Str("org", client.OrgID).Msg("WebSocket client connected")

		case client := <-h.unregister:
			h.mu.Lock()
			if orgClients, ok := h.clients[client.OrgID]; ok {
				if _, exists := orgClients[client]; exists {
					delete(orgClients, client)
					close(client.Send)
					if len(orgClients) == 0 {
						delete(h.clients, client.OrgID)
					}
				}
			}
			h.mu.Unlock()
			log.Info().Str("org", client.OrgID).Msg("WebSocket client disconnected")
		}
	}
}

func (h *WSHub) Register(client *WSClient) {
	h.register <- client
}

func (h *WSHub) Unregister(client *WSClient) {
	h.unregister <- client
}

func (h *WSHub) BroadcastToOrg(orgID string, data interface{}) {
	msg, err := json.Marshal(data)
	if err != nil {
		return
	}

	h.mu.RLock()
	defer h.mu.RUnlock()

	if orgClients, ok := h.clients[orgID]; ok {
		for client := range orgClients {
			select {
			case client.Send <- msg:
			default:
				close(client.Send)
				delete(orgClients, client)
			}
		}
	}
}

func WritePump(client *WSClient) {
	defer func() {
		client.Conn.Close()
	}()

	for msg := range client.Send {
		if err := client.Conn.WriteMessage(websocket.TextMessage, msg); err != nil {
			return
		}
	}
}

func ReadPump(hub *WSHub, client *WSClient) {
	defer func() {
		hub.Unregister(client)
		client.Conn.Close()
	}()

	for {
		_, _, err := client.Conn.ReadMessage()
		if err != nil {
			break
		}
	}
}
