import os
import sys


def validate():
    errors = []

    pdf_dir = os.environ.get("PDF_DIR", "/app/pdfs")
    try:
        os.makedirs(pdf_dir, exist_ok=True)
    except Exception as exc:
        errors.append(f"PDF_DIR ({pdf_dir}) could not be created: {exc}")

    if errors:
        print("\n[env] FATAL — calc-engine environment errors:")
        for e in errors:
            print(f"  ✗ {e}")
        print()
        sys.exit(1)