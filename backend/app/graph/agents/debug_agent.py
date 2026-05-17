from app.graph.agents.common import create_role_agent, emit, parse_json_with_retry

SYSTEM_PROMPT = """You are the Debug Agent.
Scope: analyze errors and recommend next debugging actions.
Outputs: JSON keys: errors, debug_summary, generated_artifacts.
Guardrails: no false success claims, report unresolved issues explicitly.
"""

def create_debug_agent():
    return create_role_agent(SYSTEM_PROMPT, tools=[])


async def run(state):
    await emit(state["session_id"], "agent_started", {"agent": "debug_agent"})
    fallback = {"errors": state.get("errors", []), "debug_summary": "No active errors detected"}
    agent = create_debug_agent()
    result = fallback
    if agent is not None:
        response = await agent.ainvoke({"messages": [("user", f"Analyze errors: {state.get('errors',[])}")]})
        raw = response.get("messages", [])[-1].content if response.get("messages") else "{}"
        result = parse_json_with_retry(raw, lambda d: "debug_summary" in d, fallback)
    state["errors"] = result.get("errors", state.get("errors", []))
    await emit(state["session_id"], "agent_message", {"agent": "debug_agent", "message": result.get("debug_summary", "Debug review complete")})
    return state
