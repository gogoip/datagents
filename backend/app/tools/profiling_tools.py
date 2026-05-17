import pandas as pd


def infer_schema(df: pd.DataFrame):
    return {col: str(dtype) for col, dtype in df.dtypes.items()}


def profile_dataframe(df: pd.DataFrame):
    return {
        "row_count": int(len(df)),
        "column_count": int(len(df.columns)),
        "columns": list(df.columns),
        "null_counts": {k: int(v) for k, v in df.isnull().sum().to_dict().items()},
        "duplicate_rows": int(df.duplicated().sum()),
        "sample": df.head(5).fillna("").to_dict(orient="records"),
    }
