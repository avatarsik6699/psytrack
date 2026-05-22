_PHQ9 = [(4, "Minimal"), (9, "Mild"), (14, "Moderate"), (19, "Mod. Severe")]
_GAD7 = [(4, "Minimal"), (9, "Mild"), (14, "Moderate")]
_YMRS = [(7, "Minimal"), (15, "Mild"), (25, "Moderate")]


def compute_severity_label(scale_code: str, score: int) -> str:
    table = {"PHQ-9": _PHQ9, "GAD-7": _GAD7, "YMRS": _YMRS}.get(scale_code)
    if table is None:
        return "N/A"
    for threshold, label in table:
        if score <= threshold:
            return label
    return "Severe"
