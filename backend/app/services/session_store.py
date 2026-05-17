from __future__ import annotations
from threading import Lock
from copy import deepcopy


class SessionStore:
    def __init__(self) -> None:
        self._data: dict[str, dict] = {}
        self._lock = Lock()

    def get(self, session_id: str) -> dict:
        with self._lock:
            return deepcopy(self._data.get(session_id, {}))

    def set(self, session_id: str, state: dict) -> None:
        with self._lock:
            self._data[session_id] = deepcopy(state)

    def update(self, session_id: str, patch: dict) -> dict:
        with self._lock:
            current = self._data.get(session_id, {})
            current.update(patch)
            self._data[session_id] = current
            return deepcopy(current)


session_store = SessionStore()
