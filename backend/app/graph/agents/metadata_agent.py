from app.tools.file_tools import load_dataframe
from app.tools.profiling_tools import infer_schema, profile_dataframe
from .common import emit


async def run(state):
    await emit(state["session_id"], "agent_started", {"agent": "metadata_agent"})
    profiles = {}
    summary = []
    for f in state.get("uploaded_files", []):
        df = load_dataframe(f["path"])
        prof = profile_dataframe(df)
        prof["schema"] = infer_schema(df)
        profiles[f["name"]] = prof
        summary.append(f"{f['name']}: {prof['row_count']} rows, {prof['column_count']} cols")
    state["dataset_profiles"] = profiles
    state["metadata_summary"] = {"datasets": summary}
    await emit(state["session_id"], "agent_message", {"agent": "metadata_agent", "message": "Metadata profiling complete"})
    return state
