from .base import BaseConnector


class DatabricksConnector(BaseConnector):
    def list_tables(self):
        return []

    def get_schema(self, table_name: str):
        return {}

    def run_query(self, query: str):
        return {"status": "stub"}

    def get_lineage(self, entity: str):
        return {"status": "stub"}

    def get_artifacts(self):
        return []
