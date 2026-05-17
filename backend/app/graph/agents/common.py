from app.services.event_bus import event_bus


async def emit(session_id: str, event_type: str, payload: dict):
    await event_bus.publish(session_id, {"type": event_type, **payload})
