from app.graph.agents.common import create_role_agent, emit, parse_json_with_retry

SYSTEM_PROMPT = """You are the Requirement Agent.
Scope: extract analytics requirements from user query and session context.
Outputs: strict JSON object with keys: requirements, metadata_summary, dq_results, generated_artifacts, errors.
Guardrails: no fabricated data, no code execution, explain unknowns in requirements.assumptions.
"""


def create_requirement_agent():
    return create_role_agent(SYSTEM_PROMPT, tools=[])


async def run(state):
    await emit(state["session_id"], "agent_started", {"agent": "requirement_agent"})
    agent = create_requirement_agent()
    fallback = {
        "requirements": {
            "objective": state.get("user_query", ""),
            "entities": [],
            "metrics": [],
            "assumptions": ["No tool-backed extraction available; used session query."],
        }
    }
    if agent is None:
        result = fallback
    else:
        response = await agent.ainvoke({"messages": [("user", f"Extract requirements from: {state.get('user_query','')}")]})
        raw = response.get("messages", [])[-1].content if response.get("messages") else "{}"
        result = parse_json_with_retry(raw, lambda d: "requirements" in d, fallback)
    state["requirements"] = result["requirements"]
    await emit(state["session_id"], "agent_message", {"agent": "requirement_agent", "message": "Requirements extracted"})
    return state
