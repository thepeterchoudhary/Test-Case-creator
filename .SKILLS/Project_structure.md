# AI-Powered Test Case Generator and Test Case Review System

I want to build an AI-powered **Test Case Generator and Test Case Review System**. The system should behave like a **Senior QA Engineer with 15+ years of software testing experience**.

The primary goal is to allow a user to provide a **requirement, ticket number, module information, or requirement document**, and automatically generate high-quality manual and automation test cases in the predefined format.

The system should also support **test-case review after manual execution** and generate a standard **QA Sign-Off document**.

---

## 1. Requirement Input

The user can provide requirements in any supported format, including:

- Text
- Screenshot/image
- PDF
- Word document
- Excel file
- CSV
- Requirement document
- Jira/Azure DevOps ticket details
- Any other supported document format

The user will provide:

1. **Ticket number**
2. **Requirement / acceptance criteria**
3. Supporting documents/screenshots if required
4. Module information, if available

The system must understand the requirement regardless of the input format.

---

## 2. Ticket and Module Analysis

When a ticket is provided, the system must first analyze the ticket carefully.

### Important rule:

The system should **explore only the relevant module/feature mentioned in the ticket** for which test cases are being requested.

Do not generate unrelated test cases for other modules.

The system should identify:

- Module
- Sub-module
- Feature
- User flow
- Business rules
- Functional requirements
- Acceptance criteria
- Dependencies
- Validations
- Error handling
- Permissions/roles
- Data requirements
- UI behavior
- API/backend behavior if applicable
- Integration points
- Expected user journey

The system should use the **Explore section/details of the ticket as the primary source for understanding and writing test cases**, wherever the ticket contains an Explore/analysis section.

If the ticket references another module or dependency, understand it only to the extent necessary to validate the requested module.

---

## 3. Test Case Generation

Generate test cases as a **Senior QA Engineer**, not merely by converting each requirement into one test case.

The test cases must provide comprehensive coverage.

Consider:

### Functional Testing

- Positive scenarios
- Negative scenarios
- Happy path
- Alternate flows
- Business rules
- Functional validations

### UI Testing

- Field validations
- Buttons
- Labels
- Messages
- Dropdowns
- Checkboxes
- Radio buttons
- Tables
- Pagination
- Sorting
- Filtering
- Navigation
- Responsive behavior where applicable

### Boundary & Edge Cases

- Minimum values
- Maximum values
- Empty values
- Null values
- Special characters
- Invalid formats
- Duplicate data
- Large input
- Boundary limits

### Error Handling

- Invalid input
- Missing mandatory fields
- Server/API errors
- Timeout
- Network failure
- Session expiration
- Unexpected data

### Security

Where applicable, cover:

- Authentication
- Authorization
- Role-based access
- Unauthorized access
- Session handling
- Input manipulation
- Basic security validations

### Data Validation

- Database-related validation
- Data consistency
- Data persistence
- Create/Update/Delete behavior
- Duplicate records
- Data integrity

### Integration

Where applicable:

- API integration
- Third-party integration
- External services
- Email/SMS/notification integration
- Dependent modules

### Regression

Identify scenarios that should be included in regression testing because of the requested change.

---

## 4. Test Case Quality Rules

Every test case must be:

- Clear
- Unique
- Atomic
- Reproducible
- Measurable
- Professionally written
- Independent wherever possible

Avoid:

- Duplicate test cases
- Unnecessary test cases
- Vague expected results
- Multiple unrelated validations in one test case
- Assumptions that are not supported by the requirement

Expected results must clearly explain **what should happen**.

For example, do not write:

> System should work correctly.

Instead write:

> The system should display the validation message "Email is required" below the Email field and prevent form submission.

---

## 5. Test Case Format

The user will provide a screenshot/file containing the required test-case format.

**Always analyze the provided format first and use exactly the same structure.**

Do not change:

- Column names
- Column order
- Formatting
- Test case ID structure
- Naming convention
- Required fields

The generated test cases must be delivered as an **Excel file** using the same format.

If the user provides an existing Excel test-case template, use it as the template.

---

## 6. Automation Test Cases

The system must also support **Automation Test Case Generation**.

The automation flow should be simple.

Ask the user for:

1. Module/feature name
2. Happy path/user journey
3. Application URL/link
4. Any required login/access information or test environment details

The system should then analyze the specified module and generate automation test cases using the **same test-case format provided by the user**.

The system should identify:

- Automation candidates
- Preconditions
- User actions
- Expected results
- Test data
- Assertions
- Positive scenarios
- Negative scenarios
- Regression candidates

Do not create automation cases for scenarios that are clearly unsuitable for automation unless specifically requested.

---

## 7. Manual Test Execution Review

The system must support a second phase after test-case generation.

After the user manually executes the test cases, the user can provide:

- Executed test-case Excel
- Execution results
- Screenshots
- Defect details
- Comments
- Pass/Fail status
- Actual results
- Evidence

The AI must then **review the executed test cases as a Senior QA Engineer**.

It should verify:

- Whether the test case was executed correctly
- Whether the actual result matches the expected result
- Whether Pass/Fail status is correct
- Whether the evidence supports the result
- Whether the test case itself is correct
- Whether any important scenario was missed
- Whether the test case needs modification
- Whether the defect reported is valid based on the evidence
- Whether the requirement has been completely validated

If the user says something such as:

- "Please fix it"
- "This test case is not working"
- "Expected result is incorrect"
- "Test case is wrong"
- "Please improve this"
- "Some scenarios are missing"
- "Actual result doesn't match"
- "Review these test cases"
- "These cases failed"
- "Update the test cases"

then the system must understand the intent and **revise/review the test cases accordingly**, rather than simply generating new unrelated test cases.

---

## 8. Test Case Review Output

After execution, provide a reviewed Excel file in the **same predefined format**.

Where applicable, identify:

- Original Test Case
- Review Comments
- Corrected Test Case
- Execution Status
- Actual Result
- Expected Result
- Defect/Issue
- Recommendation

Do not unnecessarily modify valid test cases.

Only modify test cases when there is a genuine issue, missing coverage, ambiguity, duplication, or incorrect expected behavior.

---

## 9. QA Sign-Off Document

The user will provide a **Sign-Off document/template**.

This Sign-Off document format will remain the **same for every project/ticket**.

Therefore:

- Use the provided Sign-Off template as the master template.
- Do not change its structure unless explicitly requested.
- Populate the relevant information dynamically for each ticket/module.
- Maintain the same headings, sections, formatting, and overall structure.

The system should generate the final QA Sign-Off document after test execution/review.

The Sign-Off should include the relevant information such as:

- Ticket number
- Module
- Feature
- Requirement
- Testing scope
- Testing performed
- Total test cases
- Passed test cases
- Failed test cases
- Blocked test cases
- Defects identified
- Regression testing status
- Automation status, if applicable
- Known issues
- QA observations
- Final QA status
- Sign-off/recommendation

Only include fields that exist in the provided Sign-Off template.

---

## 10. End-to-End Workflow

The complete application workflow should be:

### Step 1 – User Input

User provides:

- Ticket number
- Requirement
- Requirement files/screenshots
- Test-case template
- Sign-Off template

### Step 2 – Ticket Exploration

AI analyzes the ticket and identifies the **specific Explore/module/feature relevant to the requested testing**.

### Step 3 – Requirement Analysis

AI extracts:

- Functional requirements
- Acceptance criteria
- Business rules
- User journeys
- Validations
- Dependencies
- Risks

### Step 4 – Test Case Generation

AI creates comprehensive test cases as a Senior QA Engineer.

### Step 5 – Excel Generation

AI generates the test cases using the exact provided Excel format/template.

### Step 6 – Manual Execution

User executes the test cases manually.

### Step 7 – Execution Upload

User uploads the executed test-case file and supporting evidence.

### Step 8 – AI Test Case Review

AI reviews:

- Test-case quality
- Execution results
- Expected vs actual results
- Evidence
- Failures
- Missing scenarios
- Defects

### Step 9 – Correction

If the user asks to fix/improve the test cases, AI updates only the necessary cases while maintaining the original format.

### Step 10 – Final QA Sign-Off

AI generates the QA Sign-Off document using the **same standard Sign-Off template provided by the user**.

---

## 11. Important AI Behavior

The AI should behave like an experienced Senior QA Engineer.

It should **think beyond the exact wording of the requirement** and identify realistic testing risks.

However, it must not invent unsupported business requirements.

When information is missing:

- Clearly identify the missing information.
- Make reasonable QA assumptions only when appropriate.
- Mark assumptions clearly.
- Ask the user for clarification when the missing information can materially affect test coverage.

---

## 12. Change Request Handling

The application must understand conversational follow-up instructions.

For example:

**User:** Generate test cases for this ticket.
**AI:** generates test cases.

**User:** Please review these.
**AI:** reviews the existing test cases.

**User:** This test case is not working.
**AI:** identifies the relevant test case and investigates the issue.

**User:** Fix it.
**AI:** corrects the relevant test case.

**User:** Add negative scenarios.
**AI:** adds only the required negative scenarios while maintaining the existing format.

**User:** Generate automation cases.
**AI:** generates automation-ready cases for the relevant module.

**User:** Prepare sign-off.
**AI:** generates the Sign-Off document using the standard Sign-Off template.

The system should maintain context throughout this workflow.

---

## 13. Input/Output Requirements

### Input

Support:

- Text
- Image
- PDF
- DOC/DOCX
- XLS/XLSX
- CSV
- Ticket information
- Application URL
- Module information
- Execution evidence

### Output

Generate:

1. **Manual Test Case Excel**
2. **Automation Test Case Excel**
3. **Reviewed/Corrected Test Case Excel**
4. **QA Sign-Off Document**

All outputs must follow the templates provided by the user.

---

## 14. AI API

Use the **Gemini Free API** as the AI interface.

The application should be designed so that the AI layer can:

- Read requirements
- Analyze uploaded files
- Understand ticket/module information
- Generate test cases
- Review executed test cases
- Modify test cases
- Generate automation test cases
- Generate the final QA Sign-Off document

Keep the AI integration modular so that the AI provider can be changed later if required.

---

## 15. Most Important Rule

The system should not simply act as a test-case generator.

It should behave as a complete:

**Requirement Analysis → Module Exploration → Test Design → Test Case Generation → Manual Execution Review → Test Case Correction → Automation Test Design → QA Sign-Off**

system.

Always prioritize:

**Quality > Quantity**

Generate all meaningful test scenarios required for proper QA coverage while avoiding duplicate or unnecessary cases.

The final output should be professional enough to be used directly by a real QA team.
