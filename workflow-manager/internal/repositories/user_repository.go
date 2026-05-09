package repositories

import (
	"database/sql"

	"GoFlowWeb/internal/models"
)

type UserRepository struct {
	db *sql.DB
}

func NewUserRepository(db *sql.DB) *UserRepository {
	return &UserRepository{db: db}
}

func (r *UserRepository) Create(username, password, name, email string) (*models.User, error) {
	res, err := r.db.Exec(
		"INSERT INTO users (username, password, name, email) VALUES (?, ?, ?, ?)",
		username, password, name, email,
	)
	if err != nil {
		return nil, err
	}

	id, err := res.LastInsertId()
	if err != nil {
		return nil, err
	}

	return r.GetByID(id)
}

func (r *UserRepository) GetByUsername(username string) (*models.User, error) {
	var u models.User
	err := r.db.QueryRow(
		"SELECT id, username, password, name, email, created_at FROM users WHERE username = ?",
		username,
	).Scan(&u.ID, &u.Username, &u.Password, &u.Name, &u.Email, &u.CreatedAt)
	if err != nil {
		return nil, err
	}
	return &u, nil
}

func (r *UserRepository) GetByID(id int64) (*models.User, error) {
	var u models.User
	err := r.db.QueryRow(
		"SELECT id, username, password, name, email, created_at FROM users WHERE id = ?",
		id,
	).Scan(&u.ID, &u.Username, &u.Password, &u.Name, &u.Email, &u.CreatedAt)
	if err != nil {
		return nil, err
	}
	return &u, nil
}

func (r *UserRepository) UpdateProfile(id int64, name, email string) (*models.User, error) {
	_, err := r.db.Exec(
		"UPDATE users SET name = ?, email = ? WHERE id = ?",
		name, email, id,
	)
	if err != nil {
		return nil, err
	}
	return r.GetByID(id)
}