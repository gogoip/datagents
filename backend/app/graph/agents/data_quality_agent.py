from app.tools.dq_tools import generate_dq_rules
from .common import emit


async def run(state):
    await emit(state["session_id"], "agent_started", {"agent": "data_quality_agent"})
    dq = {}
    artifacts = state.get("generated_artifacts", [])
    for name, profile in state.get("dataset_profiles", {}).items():
        rules = generate_dq_rules(profile)
        dq[name] = {"rules": rules, "duplicate_rows": profile.get("duplicate_rows", 0)}
        artifact = {"name": f"{name}_dq_rules", "kind": "dq_rules", "content": rules}
        artifacts.append(artifact)
        await emit(state["session_id"], "artifact_generated", artifact)
    state["generated_artifacts"] = artifacts
    state["dq_results"] = dq
    await emit(state["session_id"], "agent_message", {"agent": "data_quality_agent", "message": "Data quality checks complete"})
    return state
