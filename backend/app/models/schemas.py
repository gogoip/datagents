from pydantic import BaseModel
from typing import Any


class ChatRequest(BaseModel):
    session_id: str
    message: str
    selected_agents: list[str] = []


class ApprovalRequest(BaseModel):
    session_id: str
    approved: bool
    pending_action: str


class Artifact(BaseModel):
    name: str
    kind: str
    content: Any
