def build_route(user_query: str, selected_agents: list[str]) -> list[str]:
    q = user_query.lower()
    if selected_agents:
        route = ["requirement_agent", *selected_agents]
    elif "pipeline" in q or "bronze" in q or "silver" in q:
        route = [
            "requirement_agent",
            "metadata_agent",
            "data_quality_agent",
            "data_modeling_agent",
            "governance_agent",
            "pipeline_builder_agent",
            "deployment_agent",
        ]
    elif "quality" in q or "describe" in q or "metadata" in q:
        route = ["requirement_agent", "metadata_agent", "data_quality_agent"]
    else:
        route = ["requirement_agent", "metadata_agent"]
    return route + ["final_response"]
