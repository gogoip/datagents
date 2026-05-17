from .common import emit


async def run(state):
    await emit(state["session_id"], "agent_started", {"agent": "debug_agent"})
    await emit(state["session_id"], "agent_message", {"agent": "debug_agent", "message": "No active errors detected"})
    return state
