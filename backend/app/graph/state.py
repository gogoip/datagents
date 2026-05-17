from typing import TypedDict, Any


class AgentState(TypedDict, total=False):
    session_id: str
    user_query: str
    uploaded_files: list[dict[str, Any]]
    active_agents: list[str]
    selected_agents: list[str]
    agent_messages: list[dict[str, Any]]
    dataset_profiles: dict[str, Any]
    metadata_summary: dict[str, Any]
    requirements: dict[str, Any]
    dq_results: dict[str, Any]
    model_recommendations: dict[str, Any]
    generated_artifacts: list[dict[str, Any]]
    next_agent: str
    route: list[str]
    status: str
    errors: list[str]
    pending_action: str | None
    approved_actions: list[str]
    final_response: str
