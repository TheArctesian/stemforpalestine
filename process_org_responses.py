#!/usr/bin/env python3
"""
Process organization endorsement responses from CSV and output to JSON.
Extracts: Organization Name, Description of Organization, Additional Testimony
"""

import csv
import json
from pathlib import Path


def process_org_responses():
    """Process organization endorsement responses and create JSON output."""

    # Define file paths
    csv_file = Path("static/Organization Endorsement_ Sign the Open Letter to Reinstate Peyrin! (Responses) - Form responses 1.csv")
    output_file = Path("static/org_signatories.json")

    # Check if CSV file exists
    if not csv_file.exists():
        print(f"Error: CSV file not found at {csv_file}")
        return

    organizations = []

    # Read CSV and extract relevant fields
    with open(csv_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)

        for row in reader:
            org_data = {
                "organization_name": row.get("Organization Name", "").strip(),
                "description": row.get("Description of Organization (optional)", "").strip(),
                "additional_testimony": row.get(
                    "Additional testimony/comments regarding Peyrin, free speech in higher education, tech complicity, and a free Palestine? (optional)",
                    ""
                ).strip()
            }

            # Only include if organization name is not empty
            if org_data["organization_name"]:
                organizations.append(org_data)

    # Write to JSON file
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(organizations, f, indent=2, ensure_ascii=False)

    print(f"Successfully processed {len(organizations)} organizations")
    print(f"Output written to: {output_file}")


if __name__ == "__main__":
    process_org_responses()
