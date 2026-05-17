def generate_dq_rules(profile: dict):
    rules = []
    for col, nulls in profile.get("null_counts", {}).items():
        rules.append({"rule": f"{col} should have limited nulls", "observed_nulls": nulls})
    if profile.get("duplicate_rows", 0) > 0:
        rules.append({"rule": "Dataset should not contain duplicate rows", "observed_duplicates": profile["duplicate_rows"]})
    return rules
