from app.tools.file_tools import load_dataframe
from app.tools.pii_tools import detect_pii_columns
from app.graph.agents.common import as_json_tool, create_role_agent, emit, parse_json_with_retry

SYSTEM_PROMPT = """You are the Governance Agent.
Scope: detect PII exposure and governance tags.
Outputs: JSON keys: generated_artifacts, governance_summary, errors.
Guardrails: use pii tools only; do not infer sensitive fields without evidence.
"""

def create_governance_agent():
    return create_role_agent(SYSTEM_PROMPT, [as_json_tool("detect_pii_columns", "Detect likely pii columns in file path.", lambda file_path: detect_pii_columns(load_dataframe(file_path)))])


async def run(state):
    await emit(state["session_id"], "agent_started", {"agent": "governance_agent"})
    pii = {f["name"]: detect_pii_columns(load_dataframe(f["path"])) for f in state.get("uploaded_files", [])}
    fallback = {"generated_artifacts": state.get("generated_artifacts", []) + [{"name": "governance_tags", "kind": "governance", "content": pii}], "governance_summary": pii}
    agent = create_governance_agent()
    result = fallback
    if agent is not None:
        response = await agent.ainvoke({"messages": [("user", f"Scan uploaded files for pii: {state.get('uploaded_files',[])}")]})
        raw = response.get("messages", [])[-1].content if response.get("messages") else "{}"
        result = parse_json_with_retry(raw, lambda d: "generated_artifacts" in d or "governance_summary" in d, fallback)
    state["generated_artifacts"] = result.get("generated_artifacts", fallback["generated_artifacts"])
    return state
