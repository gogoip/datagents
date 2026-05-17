from app.graph.agents.common import create_role_agent, emit, parse_json_with_retry

SYSTEM_PROMPT = """You are the Deployment Agent.
Scope: produce deployment configuration artifacts and readiness notes.
Outputs: JSON keys: generated_artifacts, deployment_summary, errors.
Guardrails: no hardcoded success language; include caveats for missing inputs.
"""

def create_deployment_agent():
    return create_role_agent(SYSTEM_PROMPT, tools=[])


async def run(state):
    await emit(state["session_id"], "agent_started", {"agent": "deployment_agent"})
    artifact = {"name": "deployment_config.yaml", "kind": "deployment", "content": "environment: dev\nengine: spark\n"}
    fallback = {"generated_artifacts": state.get("generated_artifacts", []) + [artifact], "deployment_summary": "Deployment config generated."}
    agent = create_deployment_agent()
    result = fallback
    if agent is not None:
        response = await agent.ainvoke({"messages": [("user", f"Generate deployment artifacts from current state context. State keys: {list(state.keys())}")]})
        raw = response.get("messages", [])[-1].content if response.get("messages") else "{}"
        result = parse_json_with_retry(raw, lambda d: "generated_artifacts" in d, fallback)
    state["generated_artifacts"] = result["generated_artifacts"]
    return state
