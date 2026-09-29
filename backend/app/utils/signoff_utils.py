"""Build sign-off DOCX documents using the supplied sample as the template."""

import os
import re
from copy import deepcopy
from pathlib import Path

from docx import Document
from docx.text.paragraph import Paragraph


SAMPLE_SIGNOFF_TEMPLATE = (
    Path(__file__).resolve().parents[3]
    / "samples"
    / "Signoff_Document_TSTD_2950.docx"
)
SCENARIO_HEADING = re.compile(r"^(?:#{1,6}\s*)?Scenario\s+\d+\s*:\s*(.+)$", re.I)


def _parse_scenarios(signoff_text: str) -> list[dict[str, str]]:
    scenarios: list[dict[str, str]] = []
    current = None

    for raw_line in signoff_text.splitlines():
        line = raw_line.strip().strip("*")
        if not line or line.startswith("```"):
            continue

        heading = SCENARIO_HEADING.match(line)
        if heading:
            current = {"title": heading.group(1).strip(), "summary": "", "evidence": "[Add link here]"}
            scenarios.append(current)
            continue

        if current is None or line.lower().startswith("sign-off document"):
            continue

        if line.lower().startswith("video evidence:"):
            evidence = line.split(":", 1)[1].strip()
            current["evidence"] = evidence or "[Add link here]"
        else:
            line = re.sub(r"^[-*]\s+", "", line)
            current["summary"] = " ".join(filter(None, (current["summary"], line)))

    return [scenario for scenario in scenarios if scenario["summary"]]


def _set_paragraph_runs(paragraph: Paragraph, text: str) -> None:
    if paragraph.runs:
        paragraph.runs[0].text = text
        for run in paragraph.runs[1:]:
            run.text = ""
    else:
        paragraph.add_run(text)


def build_signoff_docx(signoff_text: str, output_path: str) -> str:
    """Fill the sample's title/scenario/summary/evidence layout with generated content."""
    if not SAMPLE_SIGNOFF_TEMPLATE.is_file():
        raise FileNotFoundError(f"Sign-off template not found: {SAMPLE_SIGNOFF_TEMPLATE}")

    document = Document(SAMPLE_SIGNOFF_TEMPLATE)
    if len(document.paragraphs) < 4:
        raise ValueError("The sign-off sample must contain a title and a scenario block.")

    scenarios = _parse_scenarios(signoff_text)
    if not scenarios:
        raise ValueError("The generated sign-off did not contain any formatted scenarios.")

    title_template = deepcopy(document.paragraphs[0]._p)
    scenario_templates = [deepcopy(paragraph._p) for paragraph in document.paragraphs[1:4]]
    body = document._element.body
    for paragraph in list(document.paragraphs):
        body.remove(paragraph._p)

    title = Paragraph(title_template, document._body)
    _set_paragraph_runs(title, "Sign-off Document")
    body.insert(len(body) - 1, title_template)

    for index, scenario in enumerate(scenarios, start=1):
        heading_xml, summary_xml, evidence_xml = [deepcopy(node) for node in scenario_templates]
        heading = Paragraph(heading_xml, document._body)
        summary = Paragraph(summary_xml, document._body)
        evidence = Paragraph(evidence_xml, document._body)

        _set_paragraph_runs(heading, f"Scenario {index}: {scenario['title']}")
        _set_paragraph_runs(summary, scenario["summary"])
        if len(evidence.runs) >= 2:
            evidence.runs[0].text = "Video Evidence: "
            evidence.runs[1].text = scenario["evidence"]
            for run in evidence.runs[2:]:
                run.text = ""
        else:
            _set_paragraph_runs(evidence, f"Video Evidence: {scenario['evidence']}")

        for element in (heading_xml, summary_xml, evidence_xml):
            body.insert(len(body) - 1, element)

    os.makedirs(os.path.dirname(os.path.abspath(output_path)), exist_ok=True)
    document.save(output_path)
    return output_path