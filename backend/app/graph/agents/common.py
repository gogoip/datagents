import json
import os
from typing import Any, Callable

from langchain_core.tools import tool
from langchain_mistralai import ChatMistralAI
from langgraph.prebuilt import create_react_agent

from app.services.event_bus import event_bus


aSYNC_RETRY_COUNT = 2


async def emit(session_id: str, event_type: str, payload: dict):
    await event_bus.publish(session_id, {"type": event_type, **payload})


def _to_json_string(value: Any) -> str:
    return json.dumps(value, ensure_ascii=False, default=str)


def parse_json_with_retry(raw: Any, validator: Callable[[dict[str, Any]], bool], fallback: dict[str, Any]) -> dict[str, Any]:
    if isinstance(raw, dict):
        return raw if validator(raw) else fallback

    text = raw if isinstance(raw, str) else _to_json_string(raw)
    for _ in range(3):
        try:
            parsed = json.loads(text)
            if isinstance(parsed, dict) and validator(parsed):
                return parsed
        except Exception:
            pass
        start = text.find("{")
        end = text.rfind("}")
        if start >= 0 and end > start:
            text = text[start : end + 1]
    return fallback


def build_llm():
    api_key = os.getenv("MISTRAL_API_KEY")
    if not api_key:
        return None
    return ChatMistralAI(model="mistral-large-latest", api_key=api_key, temperature=0)


def as_json_tool(name: str, description: str, fn: Callable[..., Any]):
    @tool(name, description=description)
    def _wrapped(*args, **kwargs) -> str:
        try:
            result = fn(*args, **kwargs)
            return _to_json_string(result)
        except Exception as e:
            return _to_json_string({"error": str(e)})

    return _wrapped


def create_role_agent(system_prompt: str, tools: list):
    llm = build_llm()
    if llm is None:
        return None
    return create_react_agent(llm, tools=tools, state_modifier=system_prompt)
