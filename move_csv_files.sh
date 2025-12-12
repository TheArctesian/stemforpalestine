#!/bin/bash
# Move CSV response files from Downloads to static directory

DOWNLOADS_DIR="/Downloads"
STATIC_DIR="/home/okita/Scripts/Organising/stemforpalestine/static"

# Move organization endorsement file
mv "$DOWNLOADS_DIR/Organization Endorsement_ Sign the Open Letter to Reinstate Peyrin! (Responses) - Form responses 1.csv" "$STATIC_DIR/"

# Move petition responses file
mv "$DOWNLOADS_DIR/REINSTATE PEYRIN! (Responses) - Form responses 1.csv" "$STATIC_DIR/"

echo "CSV files moved successfully to $STATIC_DIR"
