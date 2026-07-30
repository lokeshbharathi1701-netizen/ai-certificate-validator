"""
ocr.py — EasyOCR Text Extraction Module
=========================================
Extracts text from certificate images and identifies key fields:
  • Student/Recipient Name
  • Certificate Number
  • Institute/University Name
  • Issue Date
  • Course / Degree Name

Uses EasyOCR for robust multilingual OCR.

Improvements over v1:
  - Handles ALL CAPS names (common on formal certificates)
  - Handles mixed-case, hyphenated, and prefix names (Dr., Mr., etc.)
  - Broader institution detection: abbreviations (IIT, NIT, BITS, VTU…)
  - Scores candidates instead of short-circuiting on the first match
  - Inline "Name: …" extraction also checks the following line
  - More trigger phrases and contextual scanning
"""

import re

# ── Lazy EasyOCR Reader ───────────────────────────────────────
_reader = None


def _get_reader():
    """Initialize EasyOCR reader on first use (heavy model load)."""
    global _reader
    if _reader is None:
        try:
            import easyocr
            print("🔄  Loading EasyOCR model (first load may take 1–3 min)...")
            # gpu=False: safe default; set gpu=True if CUDA is available
            _reader = easyocr.Reader(['en'], gpu=False, verbose=False)
            print("✅  EasyOCR loaded")
        except ImportError:
            print("⚠️  EasyOCR not installed. Run: pip install easyocr")
            _reader = None
        except Exception as e:
            print(f"⚠️  EasyOCR load failed: {e}")
            _reader = None
    return _reader


# ── Main Entry Point ──────────────────────────────────────────

def extract_text(image_path: str) -> dict:
    """
    Extract text and identify key certificate fields via OCR.

    Args:
        image_path (str): Path to the certificate image.

    Returns:
        dict: {
            "student"            : str,
            "certificate_number" : str,
            "institute"          : str,
            "date"               : str,
            "course"             : str,
            "raw_text"           : list[str]
        }
    """
    reader = _get_reader()

    if reader is None:
        return _empty_result()

    try:
        # Run OCR — returns list of (bbox, text, confidence)
        raw_results = reader.readtext(image_path)

        # Lower confidence threshold to 0.2 to catch more text
        text_lines = [
            text.strip()
            for (_, text, conf) in raw_results
            if conf > 0.2 and text.strip()
        ]

        full_text = " ".join(text_lines)
        print(f"   OCR lines detected: {len(text_lines)}")
        print(f"   Raw text preview  : {full_text[:200]!r}")

        result = {
            "student":            _extract_name(text_lines, full_text),
            "certificate_number": _extract_cert_number(full_text),
            "institute":          _extract_institute(text_lines, full_text),
            "date":               _extract_date(full_text),
            "course":             _extract_course(text_lines, full_text),
            "raw_text":           text_lines[:20],
        }

        print(f"   Name     : {result['student']}")
        print(f"   Institute: {result['institute']}")
        print(f"   Course   : {result['course']}")
        return result

    except Exception as e:
        print(f"❌  OCR extraction error: {e}")
        import traceback; traceback.print_exc()
        return _empty_result()


# ── Field Extractors ──────────────────────────────────────────

# Words that should NEVER be treated as a person's name
_NAME_STOPWORDS = {
    "certificate", "certify", "certifies", "awarded", "presented",
    "conferred", "completed", "achievement", "completion", "excellence",
    "participation", "appreciation", "recognition", "merit", "honor",
    "honour", "distinction", "successfully", "hereby", "upon", "this",
    "that", "the", "and", "for", "in", "of", "to", "is", "has", "have",
    "been", "with", "by", "from", "date", "signed", "authorized",
    "director", "principal", "president", "chairman", "registrar",
    "course", "program", "department", "faculty", "division",
}

# Name prefixes / titles
_NAME_PREFIXES = {"mr", "mrs", "ms", "miss", "dr", "prof", "er", "shri", "smt", "ku"}


def _is_plausible_name(text: str) -> bool:
    """
    Returns True if `text` looks like a person's name.
    Handles: Title Case, ALL CAPS, mixed (e.g. 'Mc', hyphenated).
    """
    # Strip surrounding punctuation/quotes
    text = text.strip(' "\'.,;:-')
    if not text:
        return False

    words = text.split()
    if not (1 <= len(words) <= 6):
        return False

    # Total length sanity check
    if len(text) > 70 or len(text) < 2:
        return False

    # All digits or mostly digits → not a name
    digits = sum(c.isdigit() for c in text)
    if digits > 2:
        return False

    # Check each word
    for w in words:
        # Strip prefix punctuation
        w_clean = w.strip('.,;:-\'()')
        if not w_clean:
            continue

        # Skip common title prefixes for the check
        if w_clean.lower().rstrip('.') in _NAME_PREFIXES:
            continue

        # Word must start with a letter
        if not w_clean[0].isalpha():
            return False

        # Must be either Title Case, ALL CAPS (≥2 letters), or have hyphen/apostrophe
        is_title   = w_clean[0].isupper()
        is_allcaps = w_clean.isupper() and len(w_clean) >= 2
        has_hyphen = '-' in w_clean or "'" in w_clean

        if not (is_title or is_allcaps or has_hyphen):
            return False

        # Reject common stopwords (case-insensitive)
        if w_clean.lower() in _NAME_STOPWORDS:
            return False

    return True


def _normalise_name(text: str) -> str:
    """Convert ALL CAPS name to Title Case for better readability."""
    text = text.strip()
    if text.isupper() and len(text) > 3:
        return text.title()
    return text


def _extract_name(lines: list, full_text: str) -> str:
    """
    Find the recipient/student name in OCR text lines.

    Strategy (in priority order):
      1. Explicit "Name:" label on same line or next line
      2. Trigger phrase followed by candidate name on next 1–3 lines
      3. Name embedded in a trigger phrase line itself
      4. Scored heuristic scan of all lines
    """

    # ── Strategy 1: Explicit label ─────────────────────────────
    name_label_re = re.compile(
        r'(?:student|candidate|recipient|awardee|holder|participant)?\s*'
        r'name\s*[:\-–]\s*(.+)',
        re.IGNORECASE
    )
    for i, line in enumerate(lines):
        m = name_label_re.search(line)
        if m:
            candidate = m.group(1).strip()
            if candidate and _is_plausible_name(candidate):
                return _normalise_name(candidate)
            # Value might be on the NEXT line
            if i + 1 < len(lines):
                nxt = lines[i + 1].strip()
                if _is_plausible_name(nxt):
                    return _normalise_name(nxt)

    # ── Strategy 2: Trigger phrases → name on following lines ──
    trigger_phrases = [
        "this is to certify that",
        "this certifies that",
        "certify that",
        "is hereby awarded",
        "is awarded to",
        "awarded to",
        "presented to",
        "conferred upon",
        "conferred on",
        "this is to certify",
        "has been awarded",
        "has successfully completed",
        "successfully completed",
        "is proudly presented to",
        "this certificate is presented to",
        "hereby certify",
        "we certify",
    ]
    for i, line in enumerate(lines):
        ll = line.lower()
        matched_phrase = next((p for p in trigger_phrases if p in ll), None)
        if matched_phrase:
            # Check if the name appears after the phrase on the SAME line
            after = ll.split(matched_phrase, 1)[1].strip()
            after_orig = line[line.lower().index(matched_phrase) + len(matched_phrase):].strip()
            if after_orig and _is_plausible_name(after_orig):
                return _normalise_name(after_orig)

            # Otherwise scan the next 1–4 lines
            for j in range(i + 1, min(i + 5, len(lines))):
                candidate = lines[j].strip()
                # Skip short filler / decorative lines
                if len(candidate) < 2 or candidate in ('', '-', '_', '|'):
                    continue
                if _is_plausible_name(candidate):
                    return _normalise_name(candidate)
            break  # Stop after first trigger hit

    # ── Strategy 3: "Mr./Dr. Name" anywhere in text ────────────
    prefix_re = re.compile(
        r'\b(?:Mr|Mrs|Ms|Miss|Dr|Prof|Er|Shri|Smt|Ku)\.?\s+([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+){0,4})',
        re.IGNORECASE
    )
    m = prefix_re.search(full_text)
    if m:
        candidate = m.group(0).strip()
        if _is_plausible_name(candidate.split('.', 1)[-1].strip()):
            return _normalise_name(m.group(0).strip())

    # ── Strategy 4: Scored heuristic scan ──────────────────────
    # Score each line; return the best candidate
    best_score   = 0
    best_candidate = None

    for line in lines:
        line = line.strip()
        if not _is_plausible_name(line):
            continue

        score = 0
        words = line.split()
        num_words = len(words)

        # Prefer 2–4 word names
        if 2 <= num_words <= 4:
            score += 3
        elif num_words == 1:
            score += 1

        # ALL CAPS names are common on formal certificates
        if line.isupper():
            score += 2

        # Contains a name prefix
        if words[0].lower().rstrip('.') in _NAME_PREFIXES:
            score += 2

        # No digits is good
        if not any(c.isdigit() for c in line):
            score += 1

        # Not too long
        if len(line) < 40:
            score += 1

        if score > best_score:
            best_score = score
            best_candidate = line

    if best_candidate:
        return _normalise_name(best_candidate)

    return "N/A"


def _extract_cert_number(text: str) -> str:
    """Extract certificate/serial number using regex patterns."""
    patterns = [
        # "Certificate No: CERT2024001" or "Cert. No.: XYZ-123"
        r'(?:certificate|cert)\.?\s*(?:no|number|num|#|id)[.:\s]*([A-Z0-9][\w\-/]{3,20})',
        # "Serial/Ref/ID No.: …"
        r'(?:serial|ref|reference|roll|reg(?:istration)?|enrol(?:ment)?)\s*(?:no|number|num|#)?[.:\s]+([A-Z0-9][\w\-/]{3,20})',
        # Plain "No.: ABC123"
        r'\bno[.:\s]+([A-Z0-9][\w\-/]{3,20})',
        # Alphanumeric with letters + digits (e.g. CERT2024001, VTU/24/001)
        r'\b([A-Z]{2,6}[-/]?\d{4,10})\b',
        # Date-like serial: 24-001234
        r'\b(\d{2,4}[-/]\d{4,8}(?:[-/]\d{0,6})?)\b',
    ]
    for pattern in patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            result = match.group(1).strip()
            if len(result) >= 4:
                return result
    return "N/A"


def _extract_date(text: str) -> str:
    """Extract issue/completion date from OCR text."""
    patterns = [
        # DD/MM/YYYY or DD-MM-YYYY or DD.MM.YYYY
        r'\b(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})\b',
        # 01 January 2024 or 1st January 2024
        r'\b(\d{1,2}(?:st|nd|rd|th)?\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\w*\.?\s+\d{4})\b',
        # January 01, 2024 or January 1 2024
        r'\b((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\w*\.?\s+\d{1,2},?\s+\d{4})\b',
        # YYYY-MM-DD (ISO)
        r'\b(\d{4}[-\/]\d{2}[-\/]\d{2})\b',
        # Just year: 2024
        r'\b(20\d{2})\b',
    ]
    for pattern in patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            return match.group(1).strip()
    return "N/A"


def _extract_institute(lines: list, full_text: str) -> str:
    """
    Extract institution/university name from text.

    Handles:
      - Full names: "ABC University of Technology"
      - Abbreviations: IIT, NIT, BITS, VTU, CBSE, AICTE, UGC, etc.
      - Generic names without keywords but with organisational patterns
    """
    # ── Priority 1: Strong keyword match ───────────────────────
    strong_keywords = [
        "university", "college", "institute", "institution", "school",
        "academy", "foundation", "board", "council", "centre", "center",
        "polytechnic", "faculty", "department", "corporation",
        "organisation", "organization", "association", "society",
        "authority", "committee", "consortium",
    ]
    for line in lines:
        ll = line.lower()
        if any(kw in ll for kw in strong_keywords):
            return line.strip()

    # ── Priority 2: Known Indian / common abbreviations ────────
    abbrev_re = re.compile(
        r'\b(IIT|NIT|BITS|VTU|JNTU|GTU|SPPU|MDU|RGPV|AKTU|KTU|'
        r'CBSE|ICSE|UGC|AICTE|NAAC|NBA|NSDC|'
        r'IIIT|IISER|IIM|ISB|XLRI|FMS|TISS|IGNOU|NIOS|'
        r'MIT|Stanford|Harvard|Oxford|Cambridge)\b',
        re.IGNORECASE
    )
    for line in lines:
        if abbrev_re.search(line):
            return line.strip()

    # ── Priority 3: Line containing "of Technology / Science / …" ──
    org_re = re.compile(
        r'\bof\s+(technology|science|engineering|arts|commerce|management|'
        r'medicine|law|education|pharmacy|nursing|agriculture)\b',
        re.IGNORECASE
    )
    for line in lines:
        if org_re.search(line):
            return line.strip()

    # ── Priority 4: ALL-CAPS line at the top (letterhead style) ─
    for line in lines[:6]:
        stripped = line.strip()
        if stripped.isupper() and len(stripped.split()) >= 2 and len(stripped) > 6:
            return stripped

    # ── Fallback: First substantial line (institutes often on top) ──
    for line in lines[:5]:
        stripped = line.strip()
        if len(stripped) > 8 and not stripped.isdigit() and not re.fullmatch(r'[\W\d]+', stripped):
            return stripped

    return "N/A"


def _extract_course(lines: list, full_text: str) -> str:
    """Extract degree/course name from text."""
    # ── Priority 1: Inline label ───────────────────────────────
    label_re = re.compile(
        r'(?:course|program(?:me)?|degree|qualification|discipline)\s*[:\-–]\s*(.+)',
        re.IGNORECASE
    )
    for i, line in enumerate(lines):
        m = label_re.search(line)
        if m:
            candidate = m.group(1).strip()
            if 2 <= len(candidate.split()) <= 10 and len(candidate) < 80:
                return candidate
            # Value on next line
            if i + 1 < len(lines):
                return lines[i + 1].strip()

    # ── Priority 2: Keyword match ──────────────────────────────
    strong_course_kws = [
        "bachelor", "master", "doctorate", "phd", "ph.d",
        "diploma", "advanced diploma", "post graduate", "postgraduate",
        "bsc", "msc", "b.sc", "m.sc",
        "b.tech", "m.tech", "btech", "mtech", "be ", "m.e",
        "mba", "bba", "b.com", "m.com", "bca", "mca",
        "b.ed", "m.ed", "llb", "llm",
    ]
    for line in lines:
        ll = line.lower()
        if any(kw in ll for kw in strong_course_kws):
            return line.strip()

    # ── Priority 3: Broader course-related words ───────────────
    soft_kws = [
        "engineering", "science", "arts", "commerce", "technology",
        "management", "medicine", "pharmacy", "nursing", "law",
        "computer", "information", "electronics", "mechanical",
        "civil", "electrical", "chemical", "biotechnology",
        "course", "training", "certification", "workshop",
    ]
    for line in lines:
        if any(kw in line.lower() for kw in soft_kws):
            return line.strip()

    return "N/A"


# ── Helpers ───────────────────────────────────────────────────

def _empty_result() -> dict:
    """Return an empty OCR result when extraction fails."""
    return {
        "student":            "N/A",
        "certificate_number": "N/A",
        "institute":          "N/A",
        "date":               "N/A",
        "course":             "N/A",
        "raw_text":           []
    }
