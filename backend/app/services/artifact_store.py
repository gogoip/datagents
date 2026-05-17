class ArtifactStore:
    def __init__(self):
        self._artifacts: dict[str, list[dict]] = {}

    def add(self, session_id: str, artifact: dict):
        self._artifacts.setdefault(session_id, []).append(artifact)

    def get(self, session_id: str):
        return self._artifacts.get(session_id, [])


artifact_store = ArtifactStore()
