from .common import emit


async def run(state):
    await emit(state["session_id"], "agent_started", {"agent": "deployment_agent"})
    artifact = {"name": "deployment_config.yaml", "kind": "deployment", "content": "environment: dev\nengine: spark\n"}
    state["generated_artifacts"] = state.get("generated_artifacts", []) + [artifact]
    await emit(state["session_id"], "artifact_generated", artifact)
    await emit(state["session_id"], "agent_message", {"agent": "deployment_agent", "message": "Deployment summary generated"})
    return state
