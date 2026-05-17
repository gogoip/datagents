from app.tools.dq_tools import generate_dq_rules
from app.graph.agents.common import as_json_tool, create_role_agent, emit, parse_json_with_retry

SYSTEM_PROMPT = """You are the Data Quality Agent.
Scope: generate data quality rule suggestions from dataset profiles.
Outputs: JSON with keys: dq_results, generated_artifacts, errors.
Guardrails: only derive rules from provided profiles.
"""


def create_data_quality_agent():
    return create_role_agent(SYSTEM_PROMPT, [as_json_tool("generate_dq_rules", "Generate DQ rules from a profile dict.", generate_dq_rules)])


async def run(state):
    await emit(state["session_id"], "agent_started", {"agent": "data_quality_agent"})
    fallback_dq, artifacts = {}, state.get("generated_artifacts", [])
    for name, profile in state.get("dataset_profiles", {}).items():
        rules = generate_dq_rules(profile)
        fallback_dq[name] = {"rules": rules, "duplicate_rows": profile.get("duplicate_rows", 0)}
        artifacts.append({"name": f"{name}_dq_rules", "kind": "dq_rules", "content": rules})
    fallback = {"dq_results": fallback_dq, "generated_artifacts": artifacts}
    agent = create_data_quality_agent()
    result = fallback
    if agent is not None:
        response = await agent.ainvoke({"messages": [("user", f"Generate dq_results JSON from profiles: {state.get('dataset_profiles',{})}")]})
        raw = response.get("messages", [])[-1].content if response.get("messages") else "{}"
        result = parse_json_with_retry(raw, lambda d: "dq_results" in d, fallback)
    state["dq_results"] = result["dq_results"]
    state["generated_artifacts"] = result.get("generated_artifacts", artifacts)
    return state
