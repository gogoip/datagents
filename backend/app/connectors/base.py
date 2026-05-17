from abc import ABC, abstractmethod


class BaseConnector(ABC):
    @abstractmethod
    def list_tables(self): ...

    @abstractmethod
    def get_schema(self, table_name: str): ...

    @abstractmethod
    def run_query(self, query: str): ...

    @abstractmethod
    def get_lineage(self, entity: str): ...

    @abstractmethod
    def get_artifacts(self): ...
