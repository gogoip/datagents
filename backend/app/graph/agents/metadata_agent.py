from app.tools.file_tools import list_uploaded_files, load_dataframe
from app.tools.profiling_tools import infer_schema, profile_dataframe
from app.graph.agents.common import as_json_tool, create_role_agent, emit, parse_json_with_retry

SYSTEM_PROMPT = """You are the Metadata Agent.
Scope: profile datasets and summarize metadata.
Outputs: JSON with keys: dataset_profiles, metadata_summary, requirements, dq_results, generated_artifacts, errors.
Guardrails: rely only on tool output; do not guess row/column counts.
"""


def create_metadata_agent():
    tools = [
        as_json_tool("list_uploaded_files", "List uploaded files for a session id.", list_uploaded_files),
        as_json_tool("load_dataframe", "Load a dataframe from path and return columns/shape only.", lambda file_path: {"shape": load_dataframe(file_path).shape, "columns": list(load_dataframe(file_path).columns)}),
        as_json_tool("profile_dataframe", "Profile dataframe at path.", lambda file_path: profile_dataframe(load_dataframe(file_path))),
        as_json_tool("infer_schema", "Infer schema at path.", lambda file_path: infer_schema(load_dataframe(file_path))),
    ]
    return create_role_agent(SYSTEM_PROMPT, tools)


async def run(state):
    await emit(state["session_id"], "agent_started", {"agent": "metadata_agent"})
    agent = create_metadata_agent()
    fallback_profiles = {}
    fallback_summary = []
    for f in state.get("uploaded_files", []):
        df = load_dataframe(f["path"])
        prof = profile_dataframe(df)
        prof["schema"] = infer_schema(df)
        fallback_profiles[f["name"]] = prof
        fallback_summary.append(f"{f['name']}: {prof['row_count']} rows, {prof['column_count']} cols")
    fallback = {"dataset_profiles": fallback_profiles, "metadata_summary": {"datasets": fallback_summary}}
    if agent is None:
        result = fallback
    else:
        prompt = f"Session id: {state.get('session_id')}. Files: {state.get('uploaded_files',[])}. Produce output contract JSON only."
        response = await agent.ainvoke({"messages": [("user", prompt)]})
        raw = response.get("messages", [])[-1].content if response.get("messages") else "{}"
        result = parse_json_with_retry(raw, lambda d: "dataset_profiles" in d and "metadata_summary" in d, fallback)
    state["dataset_profiles"] = result["dataset_profiles"]
    state["metadata_summary"] = result["metadata_summary"]
    await emit(state["session_id"], "agent_message", {"agent": "metadata_agent", "message": "Metadata profiling complete"})
    return state
