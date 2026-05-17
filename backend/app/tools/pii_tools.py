PII_HINTS = ["email", "phone", "ssn", "address", "name", "dob"]


def detect_pii_columns(df):
    out = []
    for col in df.columns:
        low = col.lower()
        if any(h in low for h in PII_HINTS):
            out.append(col)
    return out
