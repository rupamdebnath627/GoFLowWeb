# GoFlowWeb

A visual workflow orchestration tool with a React frontend and Go (Gin) backend. Users design DAG-based workflows in a node editor, then execute them as shell commands with real-time status streaming over WebSocket.

## Project Structure

```
GoFlowWeb/
├── workflow-manager/          # Go backend (Gin)
│   ├── cmd/main.go            # Entry point, server startup
│   └── internal/
│       ├── handlers/          # HTTP & WebSocket handlers
│       ├── models/            # Shared types (TaskLog, WSEvent, etc.)
│       ├── services/          # WorkflowEngine (execution), Registry (in-memory tracking)
│       ├── repositories/      # LogRepository (SQLite persistence)
│       ├── db/                # SQLite initialization & migrations
│       ├── routes/            # API route registration
│       └── utils/             # Graph validation, cycle detection
├── frontend/                  # React + Vite + ReactFlow
│   └── src/features/workflow/ # Main feature: canvas, hooks, components
└── .gitignore
```

## Build & Run

### Backend
```bash
cd workflow-manager
go build -o goflowweb ./cmd
./goflowweb
# Runs on http://localhost:8080
```

### Frontend
```bash
cd frontend
npm install
npm run dev
# Runs on http://localhost:5173
```

### Lint (frontend)
```bash
cd frontend
npm run lint
```

## API Endpoints

| Method | Path           | Description                          |
|--------|----------------|--------------------------------------|
| POST   | /execute       | Submit a workflow (returns workflow ID) |
| POST   | /cancel/:id    | Cancel a running workflow             |
| POST   | /pause/:id     | Pause a running workflow              |
| POST   | /resume/:id    | Resume a paused workflow              |
| GET    | /ws/:id        | WebSocket for real-time task updates  |
| GET    | /logs          | List all workflow execution logs      |
| GET    | /logs/:id      | Get a specific log with task details  |

## Key Architecture Decisions

- **Async execution**: Workflows run in goroutines. The HTTP POST `/execute` returns immediately with a workflow ID; the client connects via WebSocket to stream results.
- **Topological execution**: Tasks are dispatched based on indegree (dependency count). A task runs when all parents complete.
- **Optional tasks**: Failed optional tasks don't block children or mark the workflow as failed.
- **Pause/Resume**: Uses Go channels. Pausing blocks dispatch of new tasks; already-running tasks continue.
- **Persistence**: SQLite via `modernc.org/sqlite` (pure Go, no CGO). DB file at `workflow-manager/data/goflowweb.db`. Execution results saved when WebSocket stream completes.
- **No tests currently**: The project does not have Go or JS tests yet.

## Conventions

- Go module name: `GoFlowWeb`
- Backend uses standard Go project layout with `internal/` packages
- Frontend uses feature-based organization under `src/features/workflow/`
- WebSocket events use `type` field: `"task_update"` or `"workflow_done"`
- Task statuses: `pending`, `running`, `paused`, `completed`, `failed`, `failed (optional)`, `skipped`, `cancelled`