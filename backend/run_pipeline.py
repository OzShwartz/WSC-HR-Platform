"""CLI entry point - the required deliverable per recruitment-task/index.html:

    python -m backend.run_pipeline --job-id JOB001

Runs the full pipeline (repository → scoring engine → AI narratives →
export) against the CSVs in recruitment-task/data/ and writes a CSV (always)
and an HTML recruiter view (with --html) to output/.
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

from dotenv import load_dotenv

REPO_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(REPO_ROOT))

from backend.services.exporters import write_csv, write_html  # noqa: E402
from backend.services.pipeline import run_pipeline  # noqa: E402

DEFAULT_DATA_DIR = REPO_ROOT / "recruitment-task" / "data"
DEFAULT_OUTPUT_DIR = REPO_ROOT / "output"
DEFAULT_LOGO = REPO_ROOT / "brand" / "wsc-sports-logo.svg"


def main() -> None:
    load_dotenv(REPO_ROOT / ".env")

    parser = argparse.ArgumentParser(description="Score conference-attendee candidates against a job opening.")
    parser.add_argument("--job-id", required=True, help="e.g. JOB001")
    parser.add_argument("--data-dir", default=str(DEFAULT_DATA_DIR), help="Folder containing the 4 input CSVs")
    parser.add_argument("--output-dir", default=str(DEFAULT_OUTPUT_DIR))
    parser.add_argument("--html", action="store_true", help="Also write a branded HTML recruiter summary view")
    parser.add_argument("--no-llm", action="store_true", help="Force the deterministic AI fallback, even if an API key is set")
    args = parser.parse_args()

    llm = None if args.no_llm else "auto"
    job, results = run_pipeline(args.data_dir, args.job_id, llm=llm)

    csv_path = Path(args.output_dir) / f"{args.job_id}_candidates.csv"
    write_csv(results, csv_path)
    print(f"Wrote {len(results)} scored candidates for {job.title} ({job.job_id}) -> {csv_path}")

    if args.html:
        html_path = Path(args.output_dir) / f"{args.job_id}_report.html"
        logo_arg = (
            str(DEFAULT_LOGO.relative_to(Path(args.output_dir), walk_up=True)) if DEFAULT_LOGO.exists() else None
        )
        write_html(job, results, html_path, logo_path=logo_arg)
        print(f"Wrote HTML report -> {html_path}")

    top = results[0] if results else None
    if top:
        print(f"\nTop candidate: {top.candidate.full_name} - {top.score.overall_score}/100 ({top.score.recommendation})")


if __name__ == "__main__":
    main()
