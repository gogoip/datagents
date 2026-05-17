from app.graph.agents.common import create_role_agent, emit, parse_json_with_retry

SYSTEM_PROMPT = """You are the Data Modeling Agent.
Scope: propose logical/physical data modeling recommendations.
Outputs: JSON keys: model_recommendations, generated_artifacts, errors.
Guardrails: align with requirement and metadata context.
"""

def create_data_modeling_agent():
    return create_role_agent(SYSTEM_PROMPT, tools=[])


async def run(state):
    await emit(state["session_id"], "agent_started", {"agent": "data_modeling_agent"})
    fallback = {"model_recommendations": {"layers": ["bronze", "silver", "gold"], "suggestion": "Use star schema for analytics"}}
    agent = create_data_modeling_agent()
    result = fallback
    if agent is not None:
        response = await agent.ainvoke({"messages": [("user", f"Context: requirements={state.get('requirements',{})}, metadata={state.get('metadata_summary',{})}")]})
        raw = response.get("messages", [])[-1].content if response.get("messages") else "{}"
        result = parse_json_with_retry(raw, lambda d: "model_recommendations" in d, fallback)
    state["model_recommendations"] = result["model_recommendations"]
    return state
