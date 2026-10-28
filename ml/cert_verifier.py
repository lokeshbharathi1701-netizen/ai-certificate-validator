"""
cert_verifier.py — Government Certificate Type-Specific Verifier
================================================================
Extracts document-type-specific fields and runs rule-based
authenticity checks for:

  • OBC Certificate       (Other Backward Class)
  • Income Certificate    (Annual family income document)
  • Mark Sheet            (Government board / university marks)

Each verifier returns:
  - extracted fields  (dict)
  - check_results     (list of pass/warn/fail items)
  - authenticity_score (0–100)
  - verdict_reason     (human-readable string)
"""

import re

# ─────────────────────────────────────────────────────────────────
# Public API
# ─────────────────────────────────────────────────────────────────

CERT_TYPES = {
    "obc":      "OBC Certificate",
    "income":   "Income Certificate",
    "marksheet": "Mark Sheet",
    "general":  "General Certificate",
}


def verify_certificate(cert_type: str, ocr_result: dict, visual_result: dict) -> dict:
    """
    Run type-specific verification on top of base OCR + CNN results.

    Args:
        cert_type:     One of 'obc', 'income', 'marksheet', 'general'
        ocr_result:    Output from ocr.extract_text()
        visual_result: Output from predict.predict() (Deep CNN)

    Returns:
        dict with keys: cert_type_label, fields, checks, authenticity_score,
                        verdict_reason, is_verified
    """
    raw_lines = ocr_result.get("raw_text", [])
    # Prefer the full_text string already built by OCR (all lines, not truncated)
    full_text = ocr_result.get("full_text") or " ".join(raw_lines)

    if cert_type == "obc":
        fields, checks = _verify_obc(raw_lines, full_text)
    elif cert_type == "income":
        fields, checks = _verify_income(raw_lines, full_text)
    elif cert_type == "marksheet":
        fields, checks = _verify_marksheet(raw_lines, full_text)
    else:
        fields, checks = _verify_general(raw_lines, full_text, ocr_result)

    # ── Combine with CNN result ─────────────────────────────────
    visual_is_fake  = visual_result.get("prediction") == "Fake"
    visual_conf     = visual_result.get("confidence", 0)

    # Add CNN finding as a check
    if visual_is_fake:
        checks.append({
            "label":  "Visual Tampering Detection (Deep CNN)",
            "status": "fail",
            "detail": f"Deep CNN model detected visual anomalies with {visual_conf}% confidence"
        })
    else:
        checks.append({
            "label":  "Visual Tampering Detection (Deep CNN)",
            "status": "pass",
            "detail": f"No visual tampering patterns detected ({visual_conf}% confidence)"
        })

    # ── Score calculation ───────────────────────────────────────
    passed = sum(1 for c in checks if c["status"] == "pass")
    warned = sum(1 for c in checks if c["status"] == "warn")
    failed = sum(1 for c in checks if c["status"] == "fail")
    total  = len(checks)

    raw_score = (passed * 1.0 + warned * 0.5) / total * 100 if total else 50

    # CNN fake detection weighs heavily — but only if confidence is high
    if visual_is_fake:
        cnn_penalty = 20 if visual_conf >= 90 else 10  # graduated penalty
        raw_score = max(0, raw_score - cnn_penalty)

    authenticity_score = round(min(100, max(0, raw_score)), 1)
    # Certificate is verified if OCR checks mostly pass, even if CNN is uncertain
    is_verified = authenticity_score >= 55 and (not visual_is_fake or visual_conf < 70)
    cert_label         = CERT_TYPES.get(cert_type, "General Certificate")

    # ── Generate verdict reason ─────────────────────────────────
    if is_verified:
        verdict_reason = (
            f"The {cert_label} appears AUTHENTIC with a {authenticity_score}% "
            f"authenticity score. {passed}/{total} verification checks passed."
        )
    elif authenticity_score >= 40:
        verdict_reason = (
            f"The {cert_label} raised {warned + failed} concern(s). "
            f"Manual verification is strongly recommended before acceptance."
        )
    else:
        verdict_reason = (
            f"The {cert_label} FAILED {failed}/{total} critical checks and "
            f"scored only {authenticity_score}%. This document should NOT be accepted."
        )

    return {
        "cert_type":         cert_type,
        "cert_type_label":   cert_label,
        "fields":            fields,
        "checks":            checks,
        "authenticity_score": authenticity_score,
        "verdict_reason":    verdict_reason,
        "is_verified":       is_verified,
        "check_summary": {
            "passed": passed,
            "warned": warned,
            "failed": failed,
            "total":  total,
        }
    }


# ─────────────────────────────────────────────────────────────────
# OBC Certificate Verifier
# ─────────────────────────────────────────────────────────────────

def _verify_obc(lines: list, full_text: str) -> tuple:
    """Extract and verify OBC certificate specific fields."""
    fields = {
        "applicant_name":   _find_name_field(lines, full_text),
        "fathers_name":     _find_fathers_name(lines, full_text),
        "caste":            _find_caste(lines, full_text),
        "sub_caste":        _find_sub_caste(lines, full_text),
        "state":            _find_state(lines, full_text),
        "district":         _find_district(lines, full_text),
        "issuing_authority": _find_issuing_authority(lines, full_text),
        "issue_date":       _find_date(full_text),
        "certificate_no":   _find_cert_number(full_text),
        "validity":         _find_validity(lines, full_text),
    }

    checks = []

    obc_kw = re.search(
        r'\b(obc|other\s+backward|backward\s+class|socially\s+backward|obcncl|obc-ncl)\b',
        full_text, re.IGNORECASE
    )
    checks.append({
        "label":  "OBC Category Mention",
        "status": "pass" if obc_kw else "fail",
        "detail": "OBC/Backward Class keyword found" if obc_kw else "OBC category keyword NOT found in document"
    })

    checks.append({
        "label":  "Caste Information",
        "status": "pass" if fields["caste"] != "N/A" else "warn",
        "detail": f"Caste identified: {fields['caste']}" if fields["caste"] != "N/A" else "Caste name could not be extracted"
    })

    auth_kw = re.search(
        r'\b(tehsildar|sub.?divisional|district\s+magistrate|collector|'
        r'revenue\s+officer|sdm|dm\b|taluk|mandal)',
        full_text, re.IGNORECASE
    )
    checks.append({
        "label":  "Competent Issuing Authority",
        "status": "pass" if auth_kw else "warn",
        "detail": "Competent authority designation found" if auth_kw else "Issuing authority designation not clearly identified"
    })

    state_gov = re.search(
        r'\b(government\s+of|govt\.?\s+of|state\s+government)\b',
        full_text, re.IGNORECASE
    )
    checks.append({
        "label":  "State Government Mention",
        "status": "pass" if state_gov else "warn",
        "detail": "State government authority mentioned" if state_gov else "State government mention not found"
    })

    checks.append({
        "label":  "Certificate Number",
        "status": "pass" if fields["certificate_no"] != "N/A" else "warn",
        "detail": f"Cert. No: {fields['certificate_no']}" if fields["certificate_no"] != "N/A" else "Certificate number not found"
    })

    checks.append({
        "label":  "Issue Date",
        "status": "pass" if fields["issue_date"] != "N/A" else "fail",
        "detail": f"Dated: {fields['issue_date']}" if fields["issue_date"] != "N/A" else "Issue date missing — required for OBC validity"
    })

    checks.append({
        "label":  "Applicant Name",
        "status": "pass" if fields["applicant_name"] != "N/A" else "warn",
        "detail": f"Name: {fields['applicant_name']}" if fields["applicant_name"] != "N/A" else "Applicant name not clearly detected"
    })

    seal_kw = re.search(
        r'\b(seal|stamp|office\s+of|official|signed|signature|attested|verified)\b',
        full_text, re.IGNORECASE
    )
    checks.append({
        "label":  "Official Seal / Stamp Reference",
        "status": "pass" if seal_kw else "warn",
        "detail": "Seal/stamp reference found" if seal_kw else "No seal or stamp reference detected"
    })

    return fields, checks


# ─────────────────────────────────────────────────────────────────
# Income Certificate Verifier
# ─────────────────────────────────────────────────────────────────

def _verify_income(lines: list, full_text: str) -> tuple:
    """Extract and verify income certificate specific fields."""
    fields = {
        "applicant_name":    _find_name_field(lines, full_text),
        "fathers_name":      _find_fathers_name(lines, full_text),
        "annual_income":     _find_annual_income(lines, full_text),
        "income_source":     _find_income_source(lines, full_text),
        "financial_year":    _find_financial_year(full_text),
        "district":          _find_district(lines, full_text),
        "state":             _find_state(lines, full_text),
        "issuing_authority": _find_issuing_authority(lines, full_text),
        "issue_date":        _find_date(full_text),
        "certificate_no":    _find_cert_number(full_text),
        "validity_period":   _find_validity(lines, full_text),
    }

    checks = []

    income_kw = re.search(
        r'\b(income\s+certificate|annual\s+income|family\s+income)\b',
        full_text, re.IGNORECASE
    )
    checks.append({
        "label":  "Income Certificate Keyword",
        "status": "pass" if income_kw else "fail",
        "detail": "Income certificate keyword found" if income_kw else "Income certificate keyword NOT found"
    })

    checks.append({
        "label":  "Annual Income Amount",
        "status": "pass" if fields["annual_income"] != "N/A" else "fail",
        "detail": f"Income: {fields['annual_income']}" if fields["annual_income"] != "N/A" else "Income amount NOT found — critical field missing"
    })

    checks.append({
        "label":  "Financial Year",
        "status": "pass" if fields["financial_year"] != "N/A" else "warn",
        "detail": f"FY: {fields['financial_year']}" if fields["financial_year"] != "N/A" else "Financial year not detected"
    })

    auth_kw = re.search(
        r'\b(tehsildar|sub.?divisional|district\s+magistrate|collector|'
        r'revenue\s+officer|sdm|village\s+officer|mandal\s+revenue|mro\b|taluk)\b',
        full_text, re.IGNORECASE
    )
    checks.append({
        "label":  "Competent Issuing Authority",
        "status": "pass" if auth_kw else "warn",
        "detail": "Competent authority found" if auth_kw else "Issuing authority not clearly identified"
    })

    gov_kw = re.search(
        r'\b(government\s+of|govt\.?\s+of|state\s+government)\b',
        full_text, re.IGNORECASE
    )
    checks.append({
        "label":  "Government Authority",
        "status": "pass" if gov_kw else "warn",
        "detail": "Government authority mentioned" if gov_kw else "Government authority not clearly mentioned"
    })

    checks.append({
        "label":  "Issue Date",
        "status": "pass" if fields["issue_date"] != "N/A" else "fail",
        "detail": f"Dated: {fields['issue_date']}" if fields["issue_date"] != "N/A" else "Issue date missing"
    })

    checks.append({
        "label":  "Certificate Number",
        "status": "pass" if fields["certificate_no"] != "N/A" else "warn",
        "detail": f"No: {fields['certificate_no']}" if fields["certificate_no"] != "N/A" else "Certificate number not found"
    })

    checks.append({
        "label":  "Applicant Name",
        "status": "pass" if fields["applicant_name"] != "N/A" else "warn",
        "detail": f"Name: {fields['applicant_name']}" if fields["applicant_name"] != "N/A" else "Applicant name not found"
    })

    return fields, checks


# ─────────────────────────────────────────────────────────────────
# Mark Sheet Verifier
# ─────────────────────────────────────────────────────────────────

def _verify_marksheet(lines: list, full_text: str) -> tuple:
    """Extract and verify government mark sheet specific fields."""
    fields = {
        "student_name":      _find_name_field(lines, full_text),
        "roll_number":       _find_roll_number(full_text),
        "registration_no":   _find_registration_no(full_text),
        "board_university":  _find_board_university(lines, full_text),
        "examination":       _find_examination(lines, full_text),
        "exam_year":         _find_exam_year(full_text),
        "total_marks":       _find_total_marks(lines, full_text),
        "percentage_grade":  _find_percentage(lines, full_text),
        "result":            _find_result(lines, full_text),
        "issue_date":        _find_date(full_text),
    }

    checks = []

    ms_kw = re.search(
        r'\b(mark\s*sheet|marksheet|marks?\s+card|result|grade\s+sheet|'
        r'statement\s+of\s+marks|transcript|sslc|hslc|leaving\s+certificate|'
        r'secondary\s+school|school\s+leaving|marks?\s+obtained|'
        r'total\s+ma[ar]ks?)\b',
        full_text, re.IGNORECASE
    )
    checks.append({
        "label":  "Mark Sheet / Result Keyword",
        "status": "pass" if ms_kw else "fail",
        "detail": f"Mark sheet keyword found: '{ms_kw.group(0)}'"
            if ms_kw else "Mark sheet keyword NOT found"
    })

    checks.append({
        "label":  "Board / University Name",
        "status": "pass" if fields["board_university"] != "N/A" else "fail",
        "detail": f"Issuing body: {fields['board_university']}" if fields["board_university"] != "N/A" else "Board/University name NOT found — critical"
    })

    checks.append({
        "label":  "Student Name",
        "status": "pass" if fields["student_name"] != "N/A" else "warn",
        "detail": f"Student: {fields['student_name']}" if fields["student_name"] != "N/A" else "Student name not detected"
    })

    roll_ok = fields["roll_number"] != "N/A" or fields["registration_no"] != "N/A"
    checks.append({
        "label":  "Roll / Registration Number",
        "status": "pass" if roll_ok else "fail",
        "detail": (
            f"Roll: {fields['roll_number']}" if fields["roll_number"] != "N/A"
            else f"Reg: {fields['registration_no']}" if fields["registration_no"] != "N/A"
            else "Roll/Registration number NOT found"
        )
    })

    checks.append({
        "label":  "Examination Year / Session",
        "status": "pass" if fields["exam_year"] != "N/A" else "warn",
        "detail": f"Year: {fields['exam_year']}" if fields["exam_year"] != "N/A" else "Exam year not found"
    })

    marks_found = re.search(
        r'\b(\d{1,3}\s*/\s*\d{1,3}|\d{1,3}\s+out\s+of|\d{1,3}\s+marks|'
        r'total\s*:\s*\d|total\s+ma[ar]ks|grade\s*:\s*[a-f]|cgpa|sgpa|percentage|'
        r'marks?\s+obtained|four\s+zero|zero\s+[a-z]+|\b[0-9]{3}\s*\(p\))\b',
        full_text, re.IGNORECASE
    )
    checks.append({
        "label":  "Marks / Grades Present",
        "status": "pass" if marks_found else "fail",
        "detail": f"Marks/grades data found: '{marks_found.group(0)}'"
            if marks_found else "No marks or grade data found"
    })

    checks.append({
        "label":  "Result Status",
        "status": "pass" if fields["result"] != "N/A" else "warn",
        "detail": f"Result: {fields['result']}" if fields["result"] != "N/A" else "Result status not found"
    })

    govt_board = re.search(
        r'\b(cbse|icse|state\s+board|university|board\s+of\s+education|'
        r'bse|hse|sslc|hslc|matric|intermediate|ugc|aicte|tamilnadu|tamil\s+nadu|'
        r'department\s+of\s+government|government\s+examination|'
        r'examination\s+board|controller\s+of\s+examination)\b',
        full_text, re.IGNORECASE
    )
    # Add EMIS ID / Permanent Register as an additional authenticity signal
    emis_found = re.search(r'\b(EMIS|permanent\s+register|tmr\s+code|EMIS\s+ID)\b', full_text, re.IGNORECASE)
    checks.append({
        "label":  "Recognized Board / Authority",
        "status": "pass" if (govt_board or emis_found) else "warn",
        "detail": f"Recognized authority: {govt_board.group(0) if govt_board else emis_found.group(0)}"
            if (govt_board or emis_found) else "No recognized board/authority keyword found"
    })

    return fields, checks


# ─────────────────────────────────────────────────────────────────
# General Certificate (fallback)
# ─────────────────────────────────────────────────────────────────

def _verify_general(lines: list, full_text: str, ocr_result: dict) -> tuple:
    """General certificate verification using existing OCR result."""
    fields = {
        "recipient_name":    ocr_result.get("student", "N/A"),
        "certificate_number": ocr_result.get("certificate_number", "N/A"),
        "institution":       ocr_result.get("institute", "N/A"),
        "issue_date":        ocr_result.get("date", "N/A"),
        "course":            ocr_result.get("course", "N/A"),
    }

    checks = []

    checks.append({
        "label": "Certificate Keyword",
        "status": "pass" if re.search(r'\bcertificate\b', full_text, re.IGNORECASE) else "warn",
        "detail": "Certificate keyword found" if re.search(r'\bcertificate\b', full_text, re.IGNORECASE) else "Certificate keyword not found"
    })
    checks.append({
        "label": "Recipient Name",
        "status": "pass" if fields["recipient_name"] != "N/A" else "warn",
        "detail": f"Name: {fields['recipient_name']}" if fields["recipient_name"] != "N/A" else "Name not detected"
    })
    checks.append({
        "label": "Institution / Issuing Body",
        "status": "pass" if fields["institution"] != "N/A" else "warn",
        "detail": f"Issuer: {fields['institution']}" if fields["institution"] != "N/A" else "Institution not detected"
    })
    checks.append({
        "label": "Issue Date",
        "status": "pass" if fields["issue_date"] != "N/A" else "warn",
        "detail": f"Date: {fields['issue_date']}" if fields["issue_date"] != "N/A" else "Date not detected"
    })
    checks.append({
        "label": "Certificate Number",
        "status": "pass" if fields["certificate_number"] != "N/A" else "warn",
        "detail": f"No: {fields['certificate_number']}" if fields["certificate_number"] != "N/A" else "Certificate number not detected"
    })

    return fields, checks


# ─────────────────────────────────────────────────────────────────
# Field Extractors
# ─────────────────────────────────────────────────────────────────

def _find_name_field(lines, full_text):
    patterns = [
        r'(?:name\s+of\s+(?:the\s+)?(?:applicant|candidate|student|holder)|'
        r'applicant\s*[:\-]\s*|recipient\s*[:\-]\s*|student\s*name\s*[:\-]\s*)'
        r'([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,4})',
    ]
    for p in patterns:
        m = re.search(p, full_text, re.IGNORECASE)
        if m:
            return m.group(1).strip().title()
    for line in lines:
        m = re.search(r'name\s*[:\-]\s*(.+)', line, re.IGNORECASE)
        if m:
            candidate = m.group(1).strip()
            if 3 <= len(candidate) <= 60 and candidate.replace(' ', '').isalpha():
                return candidate.title()
    return "N/A"


def _find_fathers_name(lines, full_text):
    m = re.search(
        r"(?:father'?s?\s+name|s/o|d/o|son\s+of|daughter\s+of)\s*[:\-]?\s*"
        r"([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,4})",
        full_text, re.IGNORECASE
    )
    if m:
        return m.group(1).strip().title()
    return "N/A"


def _find_caste(lines, full_text):
    m = re.search(
        r'(?:caste|community|jati|belongs\s+to)\s*[:\-]\s*([A-Za-z\s]+?)(?:\s*\n|\s*,|\s*\.|$)',
        full_text, re.IGNORECASE
    )
    if m:
        val = m.group(1).strip()
        if 2 <= len(val) <= 40:
            return val.title()
    return "N/A"


def _find_sub_caste(lines, full_text):
    m = re.search(
        r'sub.?caste\s*[:\-]\s*([A-Za-z\s]+?)(?:\s*\n|\s*,|\s*\.|$)',
        full_text, re.IGNORECASE
    )
    if m:
        val = m.group(1).strip()
        if 2 <= len(val) <= 40:
            return val.title()
    return "N/A"


def _find_state(lines, full_text):
    indian_states = [
        "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
        "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
        "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram",
        "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
        "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
        "Delhi", "Jammu", "Kashmir", "Ladakh", "Puducherry"
    ]
    for state in indian_states:
        if state.lower() in full_text.lower():
            return state
    return "N/A"


def _find_district(lines, full_text):
    m = re.search(
        r'district\s*(?:of\s+)?[:\-]?\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)',
        full_text, re.IGNORECASE
    )
    if m:
        return m.group(1).strip().title()
    return "N/A"


def _find_issuing_authority(lines, full_text):
    authority_re = re.compile(
        r'\b(tehsildar|sub.?divisional\s+magistrate|district\s+magistrate|'
        r'collector|revenue\s+officer|sdm|village\s+officer|'
        r'mandal\s+revenue\s+officer|mro|taluk|tahsildar|naib\s+tehsildar)\b',
        re.IGNORECASE
    )
    for line in lines:
        if authority_re.search(line):
            return line.strip()
    m = authority_re.search(full_text)
    if m:
        return m.group(0).title()
    return "N/A"


def _find_date(full_text):
    patterns = [
        r'\b(\d{1,2}[\\/\-\.]\d{1,2}[\\/\-\.]\d{2,4})\b',
        r'\b(\d{1,2}(?:st|nd|rd|th)?\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\w*\.?\s+\d{4})\b',
        r'\b((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\w*\.?\s+\d{1,2},?\s+\d{4})\b',
        r'\b(\d{4}[-\/]\d{2}[-\/]\d{2})\b',
    ]
    for p in patterns:
        m = re.search(p, full_text, re.IGNORECASE)
        if m:
            return m.group(1).strip()
    return "N/A"


def _find_cert_number(full_text):
    patterns = [
        r'(?:certificate|cert)\.?\s*(?:no|number|num|#|id)[.:\s]*([A-Z0-9][\w\-/]{3,20})',
        r'(?:serial|ref|reference|reg(?:istration)?)\s*(?:no|number)?[.:\s]+([A-Z0-9][\w\-/]{3,20})',
        r'\bno[.:\s]+([A-Z0-9][\w\-/]{3,20})',
        r'\b([A-Z]{2,6}[-/]?\d{4,10})\b',
    ]
    for p in patterns:
        m = re.search(p, full_text, re.IGNORECASE)
        if m:
            val = m.group(1).strip()
            if len(val) >= 4:
                return val
    return "N/A"


def _find_validity(lines, full_text):
    m = re.search(
        r'valid(?:ity|ity\s+period|upto|up\s+to|till|until)?\s*[:\-]?\s*'
        r'(\d{1,2}[\\/\-\.]\d{1,2}[\\/\-\.]\d{2,4}|\d+\s+year)',
        full_text, re.IGNORECASE
    )
    if m:
        return m.group(1).strip()
    return "N/A"


def _find_annual_income(lines, full_text):
    patterns = [
        r'(?:annual\s+income|total\s+income|family\s+income|income)\s*[:\-]\s*'
        r'(?:rs\.?|Rs\.?|INR)?\s*([\d,]+(?:\.\d{1,2})?)',
        r'(?:rs\.?|Rs\.?|INR)\s*([\d,]+(?:\.\d{1,2})?)\s*(?:per\s+annum|p\.a\.|annually|per\s+year)',
        r'income\s+of\s+(?:rs\.?|Rs\.?)?\s*([\d,]+)',
    ]
    for p in patterns:
        m = re.search(p, full_text, re.IGNORECASE)
        if m:
            raw = m.group(1).replace(',', '')
            try:
                return "Rs. {:,}".format(int(float(raw)))
            except Exception:
                return m.group(1)
    return "N/A"


def _find_income_source(lines, full_text):
    m = re.search(
        r'(?:source\s+of\s+income|occupation|profession)\s*[:\-]\s*(.+?)(?:\n|,|\.|$)',
        full_text, re.IGNORECASE
    )
    if m:
        val = m.group(1).strip()
        if 3 <= len(val) <= 60:
            return val.title()
    return "N/A"


def _find_financial_year(full_text):
    m = re.search(r'\b(20\d{2}\s*[-]\s*(?:20)?\d{2})\b', full_text)
    if m:
        return m.group(1).strip()
    return "N/A"


def _find_roll_number(full_text):
    m = re.search(
        r'(?:roll\s*(?:no|number|num)|permanent\s+reg(?:ister)?(?:\s+no)?|'
        r'permanent\s+register)\s*[:\-\.#]?\s*([A-Z0-9][\w\-/]{3,20})',
        full_text, re.IGNORECASE
    )
    if m:
        return m.group(1).strip()
    # Fallback: look for standalone register number like 5709453
    m2 = re.search(r'(?:permanent|register|reg).*?(\d{6,10})\b', full_text, re.IGNORECASE)
    if m2:
        return m2.group(1).strip()
    return "N/A"


def _find_registration_no(full_text):
    m = re.search(
        r'(?:reg(?:istration)?|enrolment|enrollment)\s*(?:no|number|num|#)?[.:\-\s]+([A-Z0-9][\w\-/]{3,20})',
        full_text, re.IGNORECASE
    )
    if m:
        return m.group(1).strip()
    return "N/A"


def _find_board_university(lines, full_text):
    strong_kws = [
        "board of school examinations", "board of education",
        "state board", "board of", "university", "cbse", "icse",
        "examination board", "council", "bse", "hse",
        "department of government examinations"
    ]
    for line in lines:
        ll = line.lower()
        if any(kw in ll for kw in strong_kws):
            return line.strip()
    return "N/A"


def _find_examination(lines, full_text):
    m = re.search(
        r'(?:examination|exam|class|standard|grade|semester)\s*[:\-]?\s*'
        r'(.{3,50}?)(?:\n|,|\.|$)',
        full_text, re.IGNORECASE
    )
    if m:
        val = m.group(1).strip()
        if 3 <= len(val) <= 80:
            return val
    cls_m = re.search(
        r'\b(class\s+(?:x|xii|10|12|viii|ix|xi|8|9|11)|sslc|hslc|matric(?:ulation)?|intermediate|higher\s+secondary|secondary)\b',
        full_text, re.IGNORECASE
    )
    if cls_m:
        return cls_m.group(1).title()
    return "N/A"


def _find_exam_year(full_text):
    m = re.search(r'\b(20\d{2}\s*[-]\s*(?:20)?\d{2}|20\d{2})\b', full_text)
    if m:
        return m.group(1).strip()
    return "N/A"


def _find_total_marks(lines, full_text):
    m = re.search(
        r'(?:total\s+marks?|marks?\s+obtained|grand\s+total)\s*[:\-]?\s*(\d{2,4}(?:\s*/\s*\d{2,4})?)',
        full_text, re.IGNORECASE
    )
    if m:
        return m.group(1).strip()
    return "N/A"


def _find_percentage(lines, full_text):
    m = re.search(
        r'(?:percentage|percent|cgpa|sgpa|grade\s+point)\s*[:\-]?\s*'
        r'(\d{1,3}(?:\.\d{1,2})?(?:\s*%)?)',
        full_text, re.IGNORECASE
    )
    if m:
        val = m.group(1).strip()
        return val if '%' in val else val + '%'
    return "N/A"


def _find_result(lines, full_text):
    result_re = re.compile(
        r'\b(pass(?:ed)?|fail(?:ed)?|distinction|first\s+class|second\s+class|'
        r'third\s+class|compartment|withheld|absent|promoted)\b',
        re.IGNORECASE
    )
    m = result_re.search(full_text)
    if m:
        return m.group(1).title()
    return "N/A"
