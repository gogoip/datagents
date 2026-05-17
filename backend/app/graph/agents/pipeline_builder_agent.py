from app.tools.codegen_tools import generate_pipeline_code
from app.graph.agents.common import as_json_tool, create_role_agent, emit, parse_json_with_retry

SYSTEM_PROMPT = """You are the Pipeline Builder Agent.
Scope: generate deployable starter pipeline artifacts.
Outputs: JSON keys: generated_artifacts, errors.
Guardrails: create templates only; never claim successful deployment.
"""

def create_pipeline_builder_agent():
    return create_role_agent(SYSTEM_PROMPT, [as_json_tool("generate_pipeline_code", "Generate pipeline code from metadata, dq_rules, model_recommendations.", generate_pipeline_code)])


async def run(state):
    if "generate_pipeline" not in state.get("approved_actions", []):
        state["pending_action"] = "generate_pipeline"
        await emit(state["session_id"], "approval_required", {"message": "Approve pipeline generation?", "pending_action": "generate_pipeline"})
        return state
    await emit(state["session_id"], "agent_started", {"agent": "pipeline_builder_agent"})
    first_profile = next(iter(state.get("dataset_profiles", {}).values()), {})
    code = generate_pipeline_code(first_profile, state.get("dq_results", {}), state.get("model_recommendations", {}))
    fallback = {"generated_artifacts": state.get("generated_artifacts", []) + [{"name": "pipeline_template.py", "kind": "code", "content": code}]}
    agent = create_pipeline_builder_agent()
    result = fallback
    if agent is not None:
        response = await agent.ainvoke({"messages": [("user", f"Create generated_artifacts using metadata={first_profile}, dq={state.get('dq_results',{})}, model={state.get('model_recommendations',{})}")]})
        raw = response.get("messages", [])[-1].content if response.get("messages") else "{}"
        result = parse_json_with_retry(raw, lambda d: "generated_artifacts" in d, fallback)
    state["generated_artifacts"] = result["generated_artifacts"]
    return state
