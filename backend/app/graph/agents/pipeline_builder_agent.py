from app.tools.codegen_tools import generate_pipeline_code
from .common import emit


async def run(state):
    if "generate_pipeline" not in state.get("approved_actions", []):
        state["pending_action"] = "generate_pipeline"
        await emit(state["session_id"], "approval_required", {"message": "Approve pipeline generation?", "pending_action": "generate_pipeline"})
        return state
    await emit(state["session_id"], "agent_started", {"agent": "pipeline_builder_agent"})
    first_profile = next(iter(state.get("dataset_profiles", {}).values()), {})
    code = generate_pipeline_code(first_profile, state.get("dq_results", {}), state.get("model_recommendations", {}))
    artifact = {"name": "pipeline_template.py", "kind": "code", "content": code}
    state["generated_artifacts"] = state.get("generated_artifacts", []) + [artifact]
    await emit(state["session_id"], "artifact_generated", artifact)
    await emit(state["session_id"], "agent_message", {"agent": "pipeline_builder_agent", "message": "Pipeline template generated"})
    return state
