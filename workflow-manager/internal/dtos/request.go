package dtos

type LoginRequest struct {
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required"`
}

type SignupRequest struct {
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required"`
	Name     string `json:"name"`
	Email    string `json:"email"`
}

type UpdateProfileRequest struct {
	Name  string `json:"name"`
	Email string `json:"email"`
}

type WorkflowRequest struct {
	Nodes []Node `json:"nodes"`
	Edges []Edge `json:"edges"`
}
