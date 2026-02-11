package middleware

import (
	"github.com/gin-gonic/gin"
	"praana/internal/models"
	"praana/internal/utils"
)

func AdminOnly() gin.HandlerFunc {
	return func(c *gin.Context) {
		role := c.GetString("role")
		if role != string(models.RoleAdmin) {
			utils.Forbidden(c, "admin access required")
			c.Abort()
			return
		}
		c.Next()
	}
}

func RoleRequired(roles ...models.Role) gin.HandlerFunc {
	return func(c *gin.Context) {
		userRole := models.Role(c.GetString("role"))
		for _, r := range roles {
			if userRole == r {
				c.Next()
				return
			}
		}
		utils.Forbidden(c, "insufficient permissions")
		c.Abort()
	}
}
