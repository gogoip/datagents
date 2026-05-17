from app.tools.file_tools import load_dataframe
from app.tools.pii_tools import detect_pii_columns
from .common import emit


async def run(state):
    await emit(state["session_id"], "agent_started", {"agent": "governance_agent"})
    pii = {}
    for f in state.get("uploaded_files", []):
        pii[f["name"]] = detect_pii_columns(load_dataframe(f["path"]))
    state["generated_artifacts"] = state.get("generated_artifacts", []) + [{"name": "governance_tags", "kind": "governance", "content": pii}]
    await emit(state["session_id"], "agent_message", {"agent": "governance_agent", "message": "Governance scan complete"})
    return state
