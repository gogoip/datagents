from .common import emit


async def run(state):
    await emit(state["session_id"], "agent_started", {"agent": "requirement_agent"})
    req = {
        "objective": state.get("user_query", ""),
        "entities": [],
        "metrics": [],
        "expected_output": "analysis summary",
    }
    state["requirements"] = req
    await emit(state["session_id"], "agent_message", {"agent": "requirement_agent", "message": "Requirements extracted"})
    return state
