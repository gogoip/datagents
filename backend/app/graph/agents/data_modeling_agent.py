from .common import emit


async def run(state):
    await emit(state["session_id"], "agent_started", {"agent": "data_modeling_agent"})
    state["model_recommendations"] = {"layers": ["bronze", "silver", "gold"], "suggestion": "Use star schema for analytics"}
    await emit(state["session_id"], "agent_message", {"agent": "data_modeling_agent", "message": "Model recommendations ready"})
    return state
