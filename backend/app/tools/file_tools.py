from pathlib import Path
import pandas as pd

UPLOAD_ROOT = Path("backend/data/uploads")


def list_uploaded_files(session_id: str):
    folder = UPLOAD_ROOT / session_id
    if not folder.exists():
        return []
    return [{"name": p.name, "path": str(p), "size": p.stat().st_size} for p in folder.iterdir() if p.is_file()]


def load_dataframe(file_path: str) -> pd.DataFrame:
    if file_path.endswith(".csv"):
        return pd.read_csv(file_path)
    if file_path.endswith(".json"):
        return pd.read_json(file_path)
    if file_path.endswith(".xlsx") or file_path.endswith(".xls"):
        return pd.read_excel(file_path)
    raise ValueError(f"Unsupported file type: {file_path}")
