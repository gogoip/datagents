from .base import BaseConnector


class LocalFilesConnector(BaseConnector):
    def __init__(self, files: list[dict]):
        self.files = files

    def list_tables(self):
        return [f["name"] for f in self.files]

    def get_schema(self, table_name: str):
        return {"table": table_name}

    def run_query(self, query: str):
        return {"status": "not_supported", "query": query}

    def get_lineage(self, entity: str):
        return {"entity": entity, "lineage": []}

    def get_artifacts(self):
        return []
