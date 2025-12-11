#!/usr/bin/env python3
"""
Process Google Form CSV responses into JSON for the open letter page.
Respects privacy preferences for name display.

Privacy options:
- "Yes, display full name and roles" → Full name + roles
- "Yes, display initials and roles" → Initials + roles
- "Yes, display first name and roles" → First name + roles
- "Yes, display roles only" → Roles only (no name)
"""

import csv
import json
from datetime import datetime, timezone
from pathlib import Path


def get_display_name(first_name: str, last_name: str, preference: str) -> str | None:
    """Generate display name based on privacy preference."""
    first = first_name.strip() if first_name else ""
    last = last_name.strip() if last_name else ""
    pref_lower = preference.lower()

    if "full name" in pref_lower:
        return f"{first} {last}".strip() or None
    elif "initials" in pref_lower:
        first_initial = f"{first[0]}." if first else ""
        last_initial = f"{last[0]}." if last else ""
        initials = f"{first_initial} {last_initial}".strip()
        return initials or None
    elif "first name" in pref_lower:
        return first or None
    elif "roles only" in pref_lower:
        return None
    else:
        # Default to most private option
        return None


def process_csv(csv_path: Path, json_path: Path) -> None:
    """Process CSV and output JSON."""
    signatories = []

    # The comment column has a long name, we'll match it partially
    comment_col = "Additional testimony/comments"
    preference_col = "I wish to sign onto this letter"

    with open(csv_path, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)

        # Find actual column names (they may have slight variations)
        fieldnames = reader.fieldnames or []
        actual_comment_col = next(
            (col for col in fieldnames if comment_col in col), None
        )
        actual_pref_col = next(
            (col for col in fieldnames if preference_col in col), None
        )

        for row in reader:
            preference = row.get(actual_pref_col, "") if actual_pref_col else ""
            comment_text = row.get(actual_comment_col, "") if actual_comment_col else ""

            entry = {
                "displayName": get_display_name(
                    row.get("First Name", ""),
                    row.get("Last Name", ""),
                    preference,
                ),
                "roles": row.get("Role(s)", "").strip() or None,
                "comment": comment_text.strip() or None,
            }
            signatories.append(entry)

    output = {
        "lastUpdated": datetime.now(timezone.utc).isoformat(),
        "totalCount": len(signatories),
        "signatories": signatories,
    }

    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(output, f, indent=2, ensure_ascii=False)

    print(f"✓ Processed {len(signatories)} responses → {json_path}")


def main():
    base = Path(__file__).parent.parent
    csv_path = base / "static" / "REINSTATE PEYRIN! (Responses) - Form responses 1.csv"
    json_path = base / "static" / "signatories.json"

    if not csv_path.exists():
        print(f"✗ CSV file not found: {csv_path}")
        return

    process_csv(csv_path, json_path)


if __name__ == "__main__":
    main()
