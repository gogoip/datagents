# Data Agent Council

End-to-end multi-agent analytics workspace with FastAPI + LangGraph backend and React frontend.

## Features
- Upload CSV/JSON/Excel files
- Route requests across agents (requirements, metadata, data quality, modeling, governance, pipeline, deployment)
- Stream agent events via Server-Sent Events
- Human approval gate before pipeline generation
- Drag/select agents in a dark-themed workspace

## Backend setup
```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload --port 8000
```

## Frontend setup
```bash
cd frontend
npm install
npm run dev
```

Frontend expects backend at `http://localhost:8000`.

## First walkthrough
1. Upload a CSV in left panel.
2. Select `metadata_agent` and `data_quality_agent`.
3. Ask: `Describe this data and find quality issues`.
4. Watch SSE events update nodes and conversation.
5. Review DQ artifacts in right panel.
