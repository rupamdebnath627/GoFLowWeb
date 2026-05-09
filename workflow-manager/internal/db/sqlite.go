package db

import (
	"database/sql"
	"fmt"
	"os"
	"path/filepath"

	_ "modernc.org/sqlite"
)

func Open() (*sql.DB, error) {
	dataDir := "data"
	if err := os.MkdirAll(dataDir, 0755); err != nil {
		return nil, fmt.Errorf("create data directory: %w", err)
	}

	dbPath := filepath.Join(dataDir, "goflowweb.db")
	db, err := sql.Open("sqlite", dbPath)
	if err != nil {
		return nil, fmt.Errorf("open database: %w", err)
	}

	if err := db.Ping(); err != nil {
		db.Close()
		return nil, fmt.Errorf("ping database: %w", err)
	}

	if err := migrate(db); err != nil {
		db.Close()
		return nil, fmt.Errorf("run migrations: %w", err)
	}

	return db, nil
}

func migrate(db *sql.DB) error {
	_, err := db.Exec(`
		CREATE TABLE IF NOT EXISTS users (
			id         INTEGER PRIMARY KEY AUTOINCREMENT,
			username   TEXT    NOT NULL UNIQUE,
			password   TEXT    NOT NULL,
			name       TEXT    NOT NULL DEFAULT '',
			email      TEXT    NOT NULL DEFAULT '',
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP
		);

		CREATE TABLE IF NOT EXISTS workflow_logs (
			id          INTEGER PRIMARY KEY AUTOINCREMENT,
			workflow_id TEXT    NOT NULL,
			status      TEXT    NOT NULL,
			message     TEXT    NOT NULL,
			created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
		);

		CREATE TABLE IF NOT EXISTS task_logs (
			id              INTEGER PRIMARY KEY AUTOINCREMENT,
			workflow_log_id INTEGER NOT NULL,
			node_id         TEXT    NOT NULL,
			label           TEXT    NOT NULL,
			status          TEXT    NOT NULL,
			output          TEXT    NOT NULL DEFAULT '',
			FOREIGN KEY (workflow_log_id) REFERENCES workflow_logs(id)
		);
	`)
	if err != nil {
		return err
	}

	return seedDefaultUser(db)
}

func seedDefaultUser(db *sql.DB) error {
	var count int
	err := db.QueryRow("SELECT COUNT(*) FROM users WHERE username = ?", "admin").Scan(&count)
	if err != nil {
		return err
	}
	if count == 0 {
		_, err = db.Exec(
			"INSERT INTO users (username, password, name, email) VALUES (?, ?, ?, ?)",
			"admin", "admin", "Admin", "admin@goflowweb.local",
		)
		return err
	}
	return nil
}