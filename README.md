# AI-Powered Test Case Generator & Review System

A full-stack application that behaves as a **Senior QA Engineer with 15+ years of experience**.

Built with **Python FastAPI** (backend) + **React + Vite** (frontend) + **Google Gemini** (AI).

---

## Quick Start

### 1. Get a Gemini API Key (Free)

1. Go to [https://aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)
2. Sign in with your Google account
3. Click **Create API Key**
4. Copy the key

---

### 2. Set Up the Backend

```bash
cd backend

# Copy the env template
copy .env.example .env
```

Open `.env` and paste your Gemini API key:
```
GEMINI_API_KEY=your_actual_key_here
GEMINI_MODEL=gemini-1.5-flash
```

Install Python dependencies:
```bash
pip install -r requirements.txt
```

Start the backend:
```bash
python run.py
```

The API will be available at: `http://localhost:8000`  
Swagger docs: `http://localhost:8000/docs`

---

### 3. Set Up the Frontend

```bash
cd frontend

# Install Node dependencies
npm install

# Start the dev server
npm run dev
```

The app will open at: `http://localhost:3000`

---

## Workflow

```
Step 1 → Input
  Provide ticket number, module, requirement text, and optional files
  (PDF, DOCX, XLSX, CSV, screenshots, wireframes)

Step 2 → Generate
  AI generates comprehensive test cases as a Senior QA Engineer
  Downloads as Excel in the exact format from your screenshot

Step 3 → Review
  Fill in execution results, upload evidence
  AI reviews pass/fail status, corrects test cases, identifies gaps

Step 4 → Sign-Off
  AI generates QA Sign-Off document from your template
  Downloads as formatted Excel
```

---

## Excel Format

The generated Excel matches the exact format from your screenshot:

| Column | Description |
|--------|-------------|
| Test case ID | TC_001, TC_002, … |
| Title | Short descriptive title |
| Description/Scenario | Detailed scenario |
| Precondition | Required setup |
| Test steps | Numbered steps |
| Expected results | Precise, measurable outcome |
| Status | Not Run / Pass / Fail / Blocked / Skipped |
| Actual results | What actually happened |
| Bug ticket link | Link to defect |
| Priority | High / Medium / Low |
| Remarks | Notes or review comments |

Header section includes: Created by, Created at, Module, Version, Test Execution Report summary.

---

## Features

- **Requirement Input**: Text, PDF, DOCX, XLSX, CSV, images, screenshots
- **AI Coverage**: Functional, UI, Boundary, Error Handling, Security, Data Validation, Integration, Regression
- **Conversational Chat**: Follow-up instructions like "add negative scenarios", "fix TC_003", "review these"
- **Editable Table**: Update Status and Actual Results directly in the browser
- **AI Review**: Validates execution, corrects test cases, identifies missing scenarios
- **Sign-Off**: Fills your template with actual test results
- **Download**: Excel output for all generated/reviewed artifacts

---

## Project Structure

```
├── backend/
│   ├── app/
│   │   ├── main.py               # FastAPI app
│   │   ├── routes/
│   │   │   ├── upload.py         # File upload
│   │   │   ├── generate.py       # Test case generation
│   │   │   ├── review.py         # Test case review
│   │   │   └── signoff.py        # Sign-off generation
│   │   ├── services/
│   │   │   └── gemini_service.py # Gemini AI integration
│   │   └── utils/
│   │       ├── excel_utils.py    # Excel file builder
│   │       └── file_utils.py     # File parsing utilities
│   ├── uploads/                  # Uploaded files (auto-created)
│   ├── outputs/                  # Generated Excel files (auto-created)
│   ├── requirements.txt
│   ├── .env.example
│   └── run.py
│
└── frontend/
    ├── src/
    │   ├── App.jsx               # Root layout + chat sidebar
    │   ├── context/AppContext.jsx# Global state
    │   ├── services/api.js       # Axios API client
    │   ├── components/
    │   │   ├── StepIndicator.jsx # Workflow steps
    │   │   ├── TestCaseTable.jsx # Sortable/filterable table
    │   │   ├── FileDropzone.jsx  # Drag-and-drop upload
    │   │   ├── SummaryBar.jsx    # Execution counters
    │   │   └── ChatPanel.jsx     # AI chat assistant
    │   └── pages/
    │       ├── InputPage.jsx     # Step 1
    │       ├── ResultsPage.jsx   # Step 2
    │       ├── ReviewPage.jsx    # Step 3
    │       └── SignOffPage.jsx   # Step 4
    ├── package.json
    └── vite.config.js
```

---

## Requirements

- **Python** 3.10+
- **Node.js** 18+
- **Gemini API Key** (free at aistudio.google.com)
