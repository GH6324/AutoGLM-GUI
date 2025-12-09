# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AutoGLM-GUI is a web-based GUI for the AutoGLM Phone Agent - an AI-powered Android automation framework. It provides a FastAPI backend that interfaces with Android devices via ADB and a React frontend for task management.

## Development Commands

```bash
# Install backend dependencies
uv sync

# Start backend (--base-url is required)
uv run autoglm-gui --base-url http://localhost:8080/v1 --port 8000

# Start backend with auto-reload
uv run autoglm-gui --base-url http://localhost:8080/v1 --reload

# Start frontend dev server (port 3000, proxies /api to backend)
cd frontend && pnpm dev

# Build frontend and copy to package
uv run python scripts/build.py

# Build frontend + create Python wheel
uv run python scripts/build.py --pack

# Test built wheel
uvx --from dist/autoglm_gui-*.whl autoglm-gui --base-url http://localhost:8080/v1
```

## Architecture

```
AutoGLM-GUI/
├── AutoGLM_GUI/                 # Python package
│   ├── __main__.py             # CLI entry (argparse → uvicorn)
│   ├── server.py               # FastAPI app + API endpoints
│   ├── static/                 # Built frontend (copied by build.py)
│   └── phone_agent/            # Phone automation module
│       ├── agent.py            # PhoneAgent orchestrator
│       ├── actions/handler.py  # Action parsing & execution
│       ├── adb/                # ADB interface (screenshot, tap, swipe, etc.)
│       ├── config/             # System prompts & app configs
│       └── model/client.py     # OpenAI-compatible LLM client
├── frontend/                   # React + Vite + TanStack Router
│   ├── src/api.ts              # API client (redaxios)
│   └── src/routes/chat.tsx     # Main chat UI
├── scripts/build.py            # Build automation
└── main.py                     # Backward compat entry
```

## Key Integration Points

### API Endpoints (server.py)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/init` | POST | Initialize PhoneAgent with LLM config |
| `/api/chat` | POST | Send task, execute steps, return result |
| `/api/status` | GET | Check if agent initialized |
| `/api/reset` | POST | Reset agent state |
| `/api/screenshot` | POST | Capture device screen (no side effects) |

### PhoneAgent Flow

```
PhoneAgent.run(task)
  → get_screenshot() + get_current_app()  [ADB]
  → ModelClient.request(context)           [LLM API]
  → ActionHandler.execute(action)          [ADB: tap/swipe/type/etc]
  → Loop until finished or max_steps
```

### ADB Module (phone_agent/adb/)

All functions accept optional `device_id` parameter:
- `get_screenshot()` - Returns base64 PNG + dimensions
- `tap(x, y)`, `swipe(...)`, `back()`, `home()`
- `type_text(text)`, `clear_text()`
- `launch_app(app_name)`, `get_current_app()`
- `list_devices()`, `ADBConnection.connect()`

## Build System

- **Backend**: hatchling builds wheel, `artifacts = ["AutoGLM_GUI/static/**/*"]` includes frontend
- **Frontend**: Vite builds to `frontend/dist/`, copied to `AutoGLM_GUI/static/` by build.py
- **Static hosting**: FastAPI serves SPA with fallback to index.html

## Frontend Stack

- React 19 + TanStack Router (file-based routing)
- Tailwind CSS v4
- TypeScript + Vite
- redaxios for HTTP (lightweight axios)
- Dev proxy: `/api` → `http://localhost:8000`
