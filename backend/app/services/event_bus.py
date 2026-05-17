from __future__ import annotations
import asyncio


class EventBus:
    def __init__(self) -> None:
        self.queues: dict[str, asyncio.Queue] = {}

    def queue(self, session_id: str) -> asyncio.Queue:
        if session_id not in self.queues:
            self.queues[session_id] = asyncio.Queue()
        return self.queues[session_id]

    async def publish(self, session_id: str, event: dict) -> None:
        await self.queue(session_id).put(event)


event_bus = EventBus()
