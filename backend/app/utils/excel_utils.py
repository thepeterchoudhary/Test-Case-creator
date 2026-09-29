"""
Excel Utilities
---------------
Generates test-case workbooks from the provided sample Excel template.
The sample's five metadata rows, row-6 column headers, and row-7 data layout
are preserved for both generation and review exports.
"""

import os
from copy import copy
from datetime import date, datetime
from pathlib import Path

import openpyxl
from openpyxl.styles import PatternFill, Font, Alignment, Border, Side
from openpyxl.worksheet.datavalidation import DataValidation

# ── Palette ────────────────────────────────────────────────────────────────
DARK_BLUE   = "0D2137"
MID_BLUE    = "0A3D62"
COL_HEADER  = "1B4F72"
LIGHT_GRAY  = "F2F2F2"
YELLOW_TEXT = "FFD700"
GREEN_TEXT  = "00C853"
RED_TEXT    = "FF1744"
ORANGE_TEXT = "FF6D00"
PURPLE_TEXT = "AA00FF"

STATUS_FILLS = {
    "Pass":    PatternFill("solid", fgColor="C8E6C9"),
    "Fail":    PatternFill("solid", fgColor="FFCDD2"),
    "Blocked": PatternFill("solid", fgColor="FFE0B2"),
    "Skip":    PatternFill("solid", fgColor="FFF9C4"),
    "NOT RUN": PatternFill("solid", fgColor="E3F2FD"),
}
PRIORITY_FILLS = {
    "P1": PatternFill("solid", fgColor="FFCDD2"),
    "P2": PatternFill("solid", fgColor="FFF9C4"),
    "P3": PatternFill("solid", fgColor="C8E6C9"),
}

SAMPLE_TEMPLATE = (
    Path(__file__).resolve().parents[3]
    / "samples"
    / "TSTD-2950-test-cases (4).xlsx"
)
HEADER_ROW = 6
DATA_START_ROW = HEADER_ROW + 1
SAMPLE_STATUS_VALUES = ("NOT RUN", "Pass", "Fail", "Skip", "Blocked")
SAMPLE_PRIORITY_VALUES = ("P1", "P2", "P3")

# 11 data columns
COLUMNS = [
    ("Test case ID",         15),
    ("Title",                30),
    ("Description/Scenario", 40),
    ("Precondition",         30),
    ("Test steps",           45),
    ("Expected results",     45),
    ("Status",               12),
    ("Actual results",       45),
    ("Bug ticket link",      20),
    ("Priority",             12),
    ("Remarks",              30),
]
NUM_COLS = len(COLUMNS)   # 11


# ── Style helpers ──────────────────────────────────────────────────────────

def _fill(hex_color: str) -> PatternFill:
    return PatternFill("solid", fgColor=hex_color)

def _font(bold=False, color="FFFFFF", size=10) -> Font:
    return Font(bold=bold, color=color, name="Calibri", size=size)

def _thin_border() -> Border:
    s = Side(style="thin", color="AAAAAA")
    return Border(left=s, right=s, top=s, bottom=s)

def _align(h="left", v="center", wrap=True) -> Alignment:
    return Alignment(horizontal=h, vertical=v, wrap_text=wrap)


def _set(ws, row, col, value="", bg=DARK_BLUE, bold=False,
         color="FFFFFF", size=10, h="left", v="center"):
    """Write a single cell without any merge."""
    c = ws.cell(row=row, column=col, value=value)
    c.fill      = _fill(bg)
    c.font      = _font(bold=bold, color=color, size=size)
    c.alignment = _align(h=h, v=v)
    return c


def _merge_set(ws, r1, c1, r2, c2, value="", bg=DARK_BLUE, bold=False,
               color="FFFFFF", size=10, h="left", v="center"):
    """Merge a range and write to the anchor cell."""
    ws.merge_cells(start_row=r1, start_column=c1,
                   end_row=r2,   end_column=c2)
    c = ws.cell(row=r1, column=c1, value=value)
    c.fill      = _fill(bg)
    c.font      = _font(bold=bold, color=color, size=size)
    c.alignment = _align(h=h, v=v)
    return c


# ── Header builder ─────────────────────────────────────────────────────────
# Column layout for the 4-row header (all 11 cols):
#
#  Col:  1          2          3       4          5         6-7      8       9      10     11
#  R1:  [Title (1-3)          ] [Module label(4)] [Module(5)] [Report(6-7)] [NR(8)] [P(9)] [F(10)] [S(11)]
#  R2:  [Cre.by lbl(1)] [Val(2)] [empty(3)] [Version lbl(4)] [Val(5)] [empty(6-7)] [NR(8)] [P(9)] [F(10)] [Bl(11)]
#  R3:  [Cre.at lbl(1)] [Val(2)] [empty(3)] [Exec.at lbl(4)] [Val(5)] [empty(6-7)] [labels row 8-11]
#  R4:  [Upd.by lbl(1)] [Val(2)] [Upd.at lbl(3)] [Val(4-5 merged)] [Exec.by lbl(6)] [Val(7)] [Bl: N (8-11 merged note)]

def _build_header(ws, metadata: dict, test_cases: list):
    today       = date.today().strftime("%m/%d/%Y")
    created_by  = metadata.get("created_by", "<name>")
    module      = metadata.get("module", "")
    version     = metadata.get("version", "1")
    executed_at = metadata.get("executed_at", today)
    executed_by = metadata.get("executed_by", created_by)
    ticket      = metadata.get("ticket_number", "")

    summary = metadata.get("summary", {})
    not_run = summary.get("not_run", len(test_cases))
    passed  = summary.get("passed",  0)
    failed  = summary.get("failed",  0)
    skipped = summary.get("skipped", 0)
    blocked = summary.get("blocked", 0)

    title = f"{ticket}  {module}".strip() if ticket else module

    # ── Fill all header cells dark blue first (avoids MergedCell conflicts) ──
    for r in range(1, 5):
        for col in range(1, NUM_COLS + 1):
            ws.cell(row=r, column=col).fill = _fill(DARK_BLUE)

    # ── ROW 1 ──────────────────────────────────────────────────────────────
    # Cols 1-3: title
    _merge_set(ws, 1, 1, 1, 3, value=title, bold=True, size=11)
    # Col 4: "Module / functionality area:" label
    _set(ws, 1, 4, "Module / functionality area:", bold=True, color="AAAAAA", size=9)
    # Col 5: module value
    _set(ws, 1, 5, module, bold=True, size=10)
    # Cols 6-7: "Test Execution Report"
    _merge_set(ws, 1, 6, 2, 7, value="Test Execution Report",
               bold=True, size=12, h="center")
    # Cols 8-11: counters (each merged rows 1-2)
    _merge_set(ws, 1, 8,  2, 8,  value=not_run, bold=True, color=YELLOW_TEXT, size=28, h="center")
    _merge_set(ws, 1, 9,  2, 9,  value=passed,  bold=True, color=GREEN_TEXT,  size=28, h="center")
    _merge_set(ws, 1, 10, 2, 10, value=failed,  bold=True, color=RED_TEXT,    size=28, h="center")
    _merge_set(ws, 1, 11, 2, 11, value=skipped, bold=True, color=ORANGE_TEXT, size=28, h="center")

    # ── ROW 2 ──────────────────────────────────────────────────────────────
    _set(ws, 2, 1, "Created by:",  bold=True, color="AAAAAA", size=9)
    _set(ws, 2, 2, created_by)
    _set(ws, 2, 3, "")
    _set(ws, 2, 4, "Version:", bold=True, color="AAAAAA", size=9)
    _set(ws, 2, 5, version)
    # cols 6-7 part of "Test Execution Report" merge — skip
    # cols 8-11 part of counter merges — skip

    # ── ROW 3 ──────────────────────────────────────────────────────────────
    _set(ws, 3, 1, "Created at:",  bold=True, color="AAAAAA", size=9)
    _set(ws, 3, 2, today)
    _set(ws, 3, 3, "")
    _set(ws, 3, 4, "Executed at:", bold=True, color="AAAAAA", size=9)
    _set(ws, 3, 5, executed_at)
    _set(ws, 3, 6, "")
    _set(ws, 3, 7, "")
    # Counter labels (rows 3)
    for col, lbl, col_color in [
        (8,  "Not run", YELLOW_TEXT),
        (9,  "Passed",  GREEN_TEXT),
        (10, "Failed",  RED_TEXT),
        (11, "Skipped", ORANGE_TEXT),
    ]:
        c = ws.cell(row=3, column=col, value=lbl)
        c.fill      = _fill(DARK_BLUE)
        c.font      = Font(bold=True, color=col_color, name="Calibri", size=10)
        c.alignment = _align(h="center")

    # ── ROW 4 ──────────────────────────────────────────────────────────────
    _set(ws, 4, 1, "Last updated by:", bold=True, color="AAAAAA", size=9)
    _set(ws, 4, 2, created_by)
    _set(ws, 4, 3, "Last updated at:", bold=True, color="AAAAAA", size=9)
    # cols 4-5 merged for "last updated at" value
    _merge_set(ws, 4, 4, 4, 5, value=today)
    _set(ws, 4, 6, "Executed by:", bold=True, color="AAAAAA", size=9)
    _set(ws, 4, 7, executed_by)
    # Col 8-11: blocked note
    _merge_set(ws, 4, 8, 4, 11,
               value=f"Blocked: {blocked}",
               bold=True, color=PURPLE_TEXT, size=9, h="center")


# ── Public entry points ─────────────────────────────────────────────────────

def build_test_case_excel(
    test_cases: list[dict],
    metadata:   dict,
    output_path: str,
) -> str:
    if not SAMPLE_TEMPLATE.is_file():
        raise FileNotFoundError(f"Test case template not found: {SAMPLE_TEMPLATE}")

    wb = openpyxl.load_workbook(SAMPLE_TEMPLATE)
    ws = wb.active
    today = date.today()
    ticket = metadata.get("ticket_number", "")
    module = metadata.get("module", "")
    created_by = metadata.get("created_by", "")

    # Keep the sample workbook's metadata header, merges, formulas and layout.
    ws["B1"] = ticket or module
    ws["D1"] = module
    ws["B2"] = created_by
    ws["D2"] = metadata.get("version", "1")
    ws["B3"] = datetime.combine(today, datetime.min.time())
    ws["B4"] = created_by
    ws["D4"] = metadata.get("executed_at", "")
    ws["B5"] = today.strftime("%m/%d/%Y")
    ws["D5"] = metadata.get("executed_by", created_by)

    last_data_row = max(HEADER_ROW + len(test_cases), DATA_START_ROW)
    formula_end_row = max(last_data_row, 39)
    for cell, status in zip(("F1", "G1", "H1", "I1", "J1"), SAMPLE_STATUS_VALUES):
        ws[cell] = f'=COUNTIF(G{DATA_START_ROW}:G{formula_end_row},"{status}")'

    # Remove example cases but retain the template's preformatted rows.
    for row_idx in range(DATA_START_ROW, ws.max_row + 1):
        for col_idx in range(1, NUM_COLS + 1):
            ws.cell(row=row_idx, column=col_idx).value = None

    for row_idx in range(DATA_START_ROW, last_data_row + 1):
        if row_idx > ws.max_row:
            for col_idx in range(1, NUM_COLS + 1):
                source = ws.cell(row=DATA_START_ROW, column=col_idx)
                target = ws.cell(row=row_idx, column=col_idx)
                if source.has_style:
                    target._style = copy(source._style)
            ws.row_dimensions[row_idx].height = ws.row_dimensions[DATA_START_ROW].height

    ws.data_validations.dataValidation = []
    status_validation = DataValidation(
        type="list", formula1='"Pass,NOT RUN,Skip,Fail,Blocked"', allow_blank=True
    )
    ws.add_data_validation(status_validation)
    status_validation.add(f"G{DATA_START_ROW}:G{formula_end_row}")

    status_aliases = {
        "NOT RUN": "NOT RUN", "NOTRUN": "NOT RUN",
        "SKIP": "Skip", "SKIPPED": "Skip",
    }
    priority_aliases = {"HIGH": "P1", "MEDIUM": "P2", "LOW": "P3"}
    for index, tc in enumerate(test_cases, start=1):
        row_idx = DATA_START_ROW + index - 1
        status_raw = str(tc.get("status", "NOT RUN")).strip()
        status = status_aliases.get(status_raw.upper(), status_raw.title())
        if status not in SAMPLE_STATUS_VALUES:
            status = "NOT RUN"

        priority_raw = str(tc.get("priority", "P2")).strip()
        priority = priority_aliases.get(priority_raw.upper(), priority_raw.upper())
        if priority not in SAMPLE_PRIORITY_VALUES:
            priority = "P2"

        values = [
            tc.get("test_case_id") or f"TC_{index:03d}",
            tc.get("title", ""),
            tc.get("description_scenario", ""),
            tc.get("precondition", ""),
            tc.get("test_steps", ""),
            tc.get("expected_results", ""),
            status,
            tc.get("actual_results", ""),
            tc.get("bug_ticket_link", ""),
            priority,
            tc.get("remarks", ""),
        ]
        for col_idx, value in enumerate(values, start=1):
            ws.cell(row=row_idx, column=col_idx, value=value)

    os.makedirs(os.path.dirname(os.path.abspath(output_path)), exist_ok=True)
    wb.save(output_path)
    return output_path


def build_review_excel(
    reviewed_test_cases: list[dict],
    metadata:            dict,
    output_path:         str,
) -> str:
    enriched = []
    for tc in reviewed_test_cases:
        enriched.append({
            **tc,
            "remarks": (
                f"[{tc.get('review_action', 'No Change')}] "
                f"{tc.get('review_comments', tc.get('remarks', ''))}"
            ),
        })
    return build_test_case_excel(enriched, metadata, output_path)


def build_signoff_excel(signoff_text: str, metadata: dict, output_path: str) -> str:
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "QA Sign-Off"

    ws.column_dimensions["A"].width = 30
    ws.column_dimensions["B"].width = 80

    lft = Alignment(horizontal="left", vertical="top", wrap_text=True)

    # Title row
    ws.merge_cells("A1:B1")
    c = ws["A1"]
    c.value     = "QA Sign-Off Document"
    c.fill      = _fill(DARK_BLUE)
    c.font      = Font(bold=True, color="FFFFFF", name="Calibri", size=14)
    c.alignment = Alignment(horizontal="center", vertical="center")
    ws.row_dimensions[1].height = 30

    # Ticket info row
    ws.merge_cells("A2:B2")
    c = ws["A2"]
    ticket = metadata.get("ticket_number", "")
    module = metadata.get("module", "")
    c.value     = f"Ticket: {ticket}   |   Module: {module}"
    c.fill      = _fill(MID_BLUE)
    c.font      = Font(bold=True, color="FFFFFF", name="Calibri", size=11)
    c.alignment = Alignment(horizontal="left", vertical="center")
    ws.row_dimensions[2].height = 22

    row = 3
    for line in signoff_text.split("\n"):
        line = line.strip()
        if not line:
            row += 1
            continue

        if line.startswith("##") or (line.startswith("**") and line.endswith("**")):
            label = line.lstrip("#").strip().strip("*")
            ws.merge_cells(f"A{row}:B{row}")
            c = ws.cell(row=row, column=1, value=label)
            c.fill      = _fill(COL_HEADER)
            c.font      = Font(bold=True, color="FFFFFF", name="Calibri", size=10)
            c.alignment = lft
            ws.row_dimensions[row].height = 18

        elif ":" in line and not line.startswith("-"):
            parts = line.split(":", 1)
            key = parts[0].strip().strip("*")
            val = parts[1].strip()
            c1 = ws.cell(row=row, column=1, value=key)
            c1.font      = Font(bold=True, name="Calibri", size=10, color="000000")
            c1.alignment = lft
            c1.fill      = _fill("E8F0FE")
            c2 = ws.cell(row=row, column=2, value=val)
            c2.font      = Font(name="Calibri", size=10, color="000000")
            c2.alignment = lft
            ws.row_dimensions[row].height = max(18, len(val) // 60 * 15 + 15)

        else:
            ws.merge_cells(f"A{row}:B{row}")
            c = ws.cell(row=row, column=1, value=line)
            c.font      = Font(name="Calibri", size=10, color="000000")
            c.alignment = lft
            ws.row_dimensions[row].height = 15

        row += 1

    os.makedirs(os.path.dirname(os.path.abspath(output_path)), exist_ok=True)
    wb.save(output_path)
    return output_path
