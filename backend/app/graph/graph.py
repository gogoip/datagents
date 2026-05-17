from langgraph.graph import END, StateGraph
from app.graph.state import AgentState
from app.graph.router import build_route
from app.graph.agents import (
    requirement_agent,
    metadata_agent,
    data_modeling_agent,
    data_quality_agent,
    pipeline_builder_agent,
    governance_agent,
    debug_agent,
    deployment_agent,
)

AGENT_MAP = {
    "requirement_agent": requirement_agent.run,
    "metadata_agent": metadata_agent.run,
    "data_modeling_agent": data_modeling_agent.run,
    "data_quality_agent": data_quality_agent.run,
    "pipeline_builder_agent": pipeline_builder_agent.run,
    "governance_agent": governance_agent.run,
    "debug_agent": debug_agent.run,
    "deployment_agent": deployment_agent.run,
}


async def intent_router(state: AgentState):
    route = build_route(state.get("user_query", ""), state.get("selected_agents", []))
    state["route"] = route
    return state


async def final_response(state: AgentState):
    state["final_response"] = "Analysis complete. Review artifacts and summaries in session output."
    return state


async def run_graph(state: AgentState):
    await intent_router(state)
    for step in state.get("route", []):
        if step == "final_response":
            await final_response(state)
            break
        fn = AGENT_MAP[step]
        before = state.get("pending_action")
        state = await fn(state)
        if state.get("pending_action") and state.get("pending_action") != before:
            return state
    return state


def build_graph():
    g = StateGraph(AgentState)
    g.add_node("intent_router", intent_router)
    for name, fn in AGENT_MAP.items():
        g.add_node(name, fn)
    g.add_node("final_response", final_response)
    g.set_entry_point("intent_router")
    g.add_edge("intent_router", END)
    return g.compile()
