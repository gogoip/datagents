import asyncio
import json
import uuid
from pathlib import Path
from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from app.models.schemas import ChatRequest, ApprovalRequest
from app.services.session_store import session_store
from app.services.event_bus import event_bus
from app.services.artifact_store import artifact_store
from app.tools.file_tools import list_uploaded_files
from app.graph.graph import run_graph

app = FastAPI(title="Data Agent Council")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])
UPLOAD_ROOT = Path("backend/data/uploads")

AGENTS = [
    {"id": "requirement_agent", "name": "Requirement Agent", "description": "Extracts intent and objective"},
    {"id": "metadata_agent", "name": "Metadata Agent", "description": "Profiles datasets and schema"},
    {"id": "data_quality_agent", "name": "Data Quality Agent", "description": "Finds nulls, duplicates, DQ rules"},
    {"id": "data_modeling_agent", "name": "Data Modeling Agent", "description": "Suggests bronze/silver/gold models"},
    {"id": "governance_agent", "name": "Governance Agent", "description": "Detects PII and governance tags"},
    {"id": "pipeline_builder_agent", "name": "Pipeline Builder Agent", "description": "Generates pipeline code"},
    {"id": "debug_agent", "name": "Debug Agent", "description": "Explains errors and fixes"},
    {"id": "deployment_agent", "name": "Deployment Agent", "description": "Builds deployment summary"},
]


async def execute_session(session_id: str):
    state = session_store.get(session_id)
    try:
        state = await run_graph(state)
        session_store.set(session_id, state)
        for a in state.get("generated_artifacts", []):
            artifact_store.add(session_id, a)
        if state.get("pending_action"):
            state["status"] = "waiting_approval"
        else:
            state["status"] = "done"
            await event_bus.publish(session_id, {"type": "final_response", "message": state.get("final_response", "Done")})
    except Exception as e:
        await event_bus.publish(session_id, {"type": "error", "message": str(e)})


@app.post("/upload")
async def upload_files(files: list[UploadFile] = File(...), session_id: str | None = None):
    sid = session_id or str(uuid.uuid4())
    folder = UPLOAD_ROOT / sid
    folder.mkdir(parents=True, exist_ok=True)
    for f in files:
        content = await f.read()
        (folder / f.filename).write_bytes(content)
    file_meta = list_uploaded_files(sid)
    state = session_store.get(sid)
    state.update({"session_id": sid, "uploaded_files": file_meta})
    session_store.set(sid, state)
    return {"session_id": sid, "files": file_meta}


@app.post("/chat")
async def chat(req: ChatRequest):
    state = session_store.get(req.session_id)
    state.update({"session_id": req.session_id, "user_query": req.message, "selected_agents": req.selected_agents, "pending_action": None, "approved_actions": state.get("approved_actions", []), "generated_artifacts": [], "errors": []})
    session_store.set(req.session_id, state)
    asyncio.create_task(execute_session(req.session_id))
    return {"status": "started", "session_id": req.session_id}


@app.get("/chat/stream/{session_id}")
async def chat_stream(session_id: str):
    async def event_generator():
        queue = event_bus.queue(session_id)
        while True:
            evt = await queue.get()
            yield f"data: {json.dumps(evt)}\n\n"
    return StreamingResponse(event_generator(), media_type="text/event-stream")


@app.post("/approval")
async def approval(req: ApprovalRequest):
    state = session_store.get(req.session_id)
    if req.approved and req.pending_action == "generate_pipeline":
        approved = state.get("approved_actions", [])
        if "generate_pipeline" not in approved:
            approved.append("generate_pipeline")
        state["approved_actions"] = approved
        state["pending_action"] = None
        session_store.set(req.session_id, state)
        asyncio.create_task(execute_session(req.session_id))
        return {"status": "resumed"}
    return {"status": "rejected"}


@app.get("/sessions/{session_id}")
def get_session(session_id: str):
    return session_store.get(session_id)


@app.get("/artifacts/{session_id}")
def get_artifacts(session_id: str):
    return artifact_store.get(session_id)


@app.get("/agents")
def get_agents():
    return AGENTS
