#!/usr/bin/env python3
"""
================================================================================
 PATIENT DATA DE-IDENTIFICATION TOOL  (HIPAA Safe Harbor helper)
================================================================================

 WHAT THIS DOES (in plain English)
 ---------------------------------
 You give this program a spreadsheet of patient data (.xlsx or .csv).
 It produces TWO files:

   1. A DE-IDENTIFIED spreadsheet (.xlsx) that is safe(r) to use with AI
      tools. Every patient gets a brand-new random study ID that looks like
      "BHH-a1b2c3d4". All 18 HIPAA Safe Harbor identifiers are removed:
      dates are reduced to the year only, dates of birth become ages
      (ages over 89 become "90+"), and ZIP codes are cut to 3 digits.

   2. An ENCRYPTED "crosswalk" file that maps each new random ID back to
      the original patient identifiers. It is locked with a password you
      choose. Keep this file and password PRIVATE — it is the only way to
      re-identify patients later. (To open it again, see "UNLOCKING" below.)

 HOW TO RUN IT
 -------------
 Option A - double-click friendly / no typing a file path:
     python deidentify_patients.py
     (a window pops up asking you to pick your spreadsheet)

 Option B - give the file path directly:
     python deidentify_patients.py "C:\\Patients\\clinic_export.xlsx"

 UNLOCKING the crosswalk later (re-identify patients):
     python deidentify_patients.py --unlock "clinic_export_crosswalk.enc"

 WHAT YOU NEED INSTALLED (one time only, needs internet just for install):
     pip install pandas openpyxl cryptography

 PRIVACY: This program runs 100% OFFLINE. It makes NO network calls and
 sends NOTHING anywhere. All files stay on your computer.

 IMPORTANT LIMITATION — PLEASE READ
 ----------------------------------
 Free-text fields (like clinic notes) are scrubbed with pattern-matching,
 which is NEVER 100% reliable. A human MUST review the output before it is
 treated as de-identified. This tool is an assistant, not a compliance
 guarantee.
================================================================================
"""

import argparse
import base64
import getpass
import io
import os
import re
import secrets
import sys
from difflib import SequenceMatcher

# ------------------------------------------------------------------------------
# Friendly check that the required (offline) libraries are installed.
# ------------------------------------------------------------------------------
_MISSING = []
try:
    import pandas as pd
except ImportError:
    _MISSING.append("pandas")
try:
    import openpyxl  # noqa: F401  (used by pandas to write .xlsx files)
except ImportError:
    _MISSING.append("openpyxl")
try:
    from cryptography.fernet import Fernet, InvalidToken
    from cryptography.hazmat.primitives import hashes
    from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
except ImportError:
    _MISSING.append("cryptography")

if _MISSING:
    sys.exit(
        "\nSome required software is missing: " + ", ".join(_MISSING) +
        "\nPlease run this once (needs internet only for the install):\n\n"
        "    pip install pandas openpyxl cryptography\n\n"
        "then run this program again.\n"
    )


# ==============================================================================
# SECTION 1 — CONFIGURATION: how we recognize each kind of column
# ==============================================================================
# Columns are matched by "fuzzy" name comparison, so "Patient_Name",
# "patientname", "Pt Name" and even a small typo like "Patinet Name" are all
# recognized. You do NOT need to rename your columns.

# --- Columns that are DROPPED entirely (HIPAA Safe Harbor identifiers) -------
# Each entry: (human-readable reason, [name keywords that identify the column])
DROP_CATEGORIES = [
    ("Name (patient/relative/contact)",
     ["name", "firstname", "lastname", "fname", "lname", "mname",
      "middlename", "surname", "fullname", "patientname", "givenname",
      "familyname", "maidenname", "nickname", "alias", "nextofkin", "kin",
      "emergencycontact", "guarantor", "spouse", "parent", "guardian",
      "contact", "physicianname", "providername"]),
    ("Street address / geographic detail",
     ["address", "addr", "street", "streetaddress", "address1", "address2",
      "addressline", "apartment", "apt", "suite", "unit", "pobox"]),
    ("City / county / other small geography",
     ["city", "county", "town", "township", "municipality", "borough",
      "precinct", "neighborhood", "district"]),
    ("Phone number",
     ["phone", "telephone", "tel", "mobile", "cell", "cellphone",
      "homephone", "workphone", "phonenumber", "contactnumber"]),
    ("Fax number",
     ["fax", "faxnumber"]),
    ("Email address",
     ["email", "emailaddress", "mail"]),
    ("Social Security number",
     ["ssn", "socialsecurity", "socialsecuritynumber", "social", "ssnum"]),
    ("Existing MRN / chart number",
     ["mrn", "medicalrecord", "medicalrecordnumber", "chart", "chartnumber",
      "chartno", "chartnum", "recordnumber", "patientid", "patientnumber",
      "ptid", "pid", "emrid", "ehrid"]),
    ("Health plan / member / beneficiary number",
     ["healthplan", "healthplannumber", "member", "memberid", "membernumber",
      "beneficiary", "beneficiaryid", "policy", "policynumber", "insurance",
      "insuranceid", "insurancenumber", "subscriber", "subscriberid",
      "planid", "medicaidid", "medicareid", "groupnumber"]),
    ("Account number",
     ["account", "accountnumber", "acct", "acctno", "acctnum", "billingid",
      "invoicenumber"]),
    ("License / certificate number",
     ["license", "licence", "licensenumber", "certificate",
      "certificatenumber", "certnumber", "dln", "driverslicense",
      "driverlicense", "dlnumber"]),
    ("Vehicle identifier / VIN / plate",
     ["vehicle", "vehicleid", "vin", "licenseplate", "plate", "platenumber"]),
    ("Device identifier / serial number",
     ["device", "deviceid", "serial", "serialnumber", "serialno", "udi",
      "implantid", "pacemakerid"]),
    ("Web URL",
     ["url", "website", "webaddress", "web", "homepage", "link"]),
    ("IP address",
     ["ip", "ipaddress", "ipaddr"]),
    ("Biometric / photo",
     ["biometric", "fingerprint", "voiceprint", "retina", "retinal", "iris",
      "photo", "photograph", "picture", "image", "headshot", "faceid",
      "palmprint", "dnaprofile"]),
]

# --- Columns that are TRANSFORMED (kept, but made safe) ----------------------
DOB_KEYWORDS = ["dob", "dateofbirth", "birthdate", "birthday", "birth",
                "borndate", "born"]
DATE_KEYWORDS = ["date", "admitdate", "admissiondate", "dischargedate",
                 "visitdate", "encounterdate", "appointmentdate", "apptdate",
                 "servicedate", "deathdate", "dod", "dateofdeath", "labdate",
                 "collectiondate", "resultdate", "admission", "discharge",
                 "encounter", "visit", "appointment", "appt", "timestamp",
                 "datetime"]
ZIP_KEYWORDS = ["zip", "zipcode", "zip5", "postalcode", "postal", "postcode"]
AGE_KEYWORDS = ["age", "ageyears", "ageatvisit", "patientage", "ageyrs"]

# --- Free-text columns that get pattern-based scrubbing ----------------------
TEXT_KEYWORDS = ["note", "notes", "comment", "comments", "history", "hpi",
                 "narrative", "summary", "description", "impression",
                 "findings", "report", "remarks", "assessment", "plan",
                 "chiefcomplaint", "complaint", "text", "freetext",
                 "progressnote", "clinicalnote", "documentation", "memo"]

# --- HIPAA-restricted 3-digit ZIP prefixes -----------------------------------
# Safe Harbor allows keeping the first 3 digits of a ZIP code ONLY if that
# 3-digit area contains more than 20,000 people. These 17 areas do not, so
# they must be replaced with "000".
RESTRICTED_ZIP3 = {
    "036", "059", "063", "102", "203", "556", "692", "790", "821",
    "823", "830", "831", "878", "879", "884", "890", "893",
}


# ==============================================================================
# SECTION 2 — FUZZY COLUMN-NAME MATCHING
# ==============================================================================
def normalize(col_name):
    """Turn a column header into simple lowercase tokens.
    'Patient_Name', 'PatientName' and 'patient name' all become
    the tokens ['patient', 'name'] plus the glued form 'patientname'."""
    s = str(col_name)
    # Split CamelCase: 'PatientName' -> 'Patient Name'
    s = re.sub(r"(?<=[a-z0-9])(?=[A-Z])", " ", s)
    # Replace every non-letter/non-digit with a space, then lowercase.
    s = re.sub(r"[^A-Za-z0-9]+", " ", s).lower().strip()
    tokens = s.split()
    glued = "".join(tokens)
    return tokens, glued


def fuzzy_hit(col_name, keywords, threshold=0.86):
    """Return True if the column name matches any keyword.
    Matches whole tokens, the 'glued' name, or a close spelling
    (so small typos like 'Patinet Name' are still caught)."""
    tokens, glued = normalize(col_name)
    for kw in keywords:
        if kw in tokens or kw == glued:
            return True
        # Multi-token keywords like 'dateofbirth' vs glued 'dateofbirth'
        if len(kw) >= 5 and kw in glued:
            return True
        # Typo tolerance via similarity score
        if SequenceMatcher(None, kw, glued).ratio() >= threshold:
            return True
        for t in tokens:
            if len(kw) >= 4 and SequenceMatcher(None, kw, t).ratio() >= threshold:
                return True
    return False


def classify_column(col_name, series):
    """Decide what to do with one column.
    Returns (action, reason) where action is one of:
      'drop', 'dob', 'date', 'zip', 'age', 'text', 'keep'."""
    # Order matters: check DOB before generic dates ('Birth Date' has 'date'
    # in it), and check drops before keeps.
    if fuzzy_hit(col_name, DOB_KEYWORDS):
        return "dob", "Date of birth -> converted to age (90+ capped)"
    for reason, keywords in DROP_CATEGORIES:
        if fuzzy_hit(col_name, keywords):
            return "drop", reason
    if fuzzy_hit(col_name, ZIP_KEYWORDS):
        return "zip", "ZIP code -> first 3 digits (restricted areas -> 000)"
    if fuzzy_hit(col_name, AGE_KEYWORDS):
        return "age", "Age -> ages over 89 become '90+'"
    if fuzzy_hit(col_name, DATE_KEYWORDS):
        return "date", "Date -> year only"
    # A column not named like a date may still CONTAIN dates (pandas may have
    # parsed it as datetimes when reading Excel) — treat those as dates too.
    if pd.api.types.is_datetime64_any_dtype(series):
        return "date", "Date values detected -> year only"
    if fuzzy_hit(col_name, TEXT_KEYWORDS):
        return "text", "Free text -> pattern-scrubbed (NEEDS HUMAN REVIEW)"
    return "keep", "Assumed clinical data (diagnoses/meds/labs/vitals) -> kept"


# ==============================================================================
# SECTION 3 — TRANSFORMATIONS (dates, ages, ZIP codes)
# ==============================================================================
def to_year_only(value):
    """'03/15/2021' -> '2021'.  Anything unreadable becomes blank."""
    if value is None or (isinstance(value, float) and pd.isna(value)):
        return ""
    ts = pd.to_datetime(str(value), errors="coerce")
    return str(ts.year) if pd.notna(ts) else ""


def dob_to_age(value, reference_date):
    """Turn a date of birth into an age in years.
    Ages 90 and above are reported only as '90+' (HIPAA requirement,
    because very old ages are rare enough to identify someone)."""
    if value is None or (isinstance(value, float) and pd.isna(value)):
        return ""
    dob = pd.to_datetime(str(value), errors="coerce")
    if pd.isna(dob):
        return ""
    age = reference_date.year - dob.year - (
        (reference_date.month, reference_date.day) < (dob.month, dob.day))
    if age < 0:
        return ""
    return "90+" if age >= 90 else str(int(age))


def cap_age(value):
    """For columns that already contain an age: 92 -> '90+', 47 -> '47'."""
    if value is None or (isinstance(value, float) and pd.isna(value)):
        return ""
    s = str(value).strip()
    if not s:
        return ""
    try:
        age = int(float(s))
    except ValueError:
        return s  # not a number; leave whatever text was there
    return "90+" if age >= 90 else str(age)


def truncate_zip(value):
    """'90210-1234' -> '902'.  '03601' -> '000' (restricted low-population
    area).  Leading zeros lost by Excel are restored first."""
    if value is None or (isinstance(value, float) and pd.isna(value)):
        return ""
    s = re.sub(r"\.0$", "", str(value).strip())   # Excel '3601.0' -> '3601'
    digits = re.sub(r"[^0-9]", "", s.split("-")[0])
    if not digits:
        return ""
    zip5 = digits.zfill(5)[:5]                     # restore leading zeros
    zip3 = zip5[:3]
    return "000" if zip3 in RESTRICTED_ZIP3 else zip3


# ==============================================================================
# SECTION 4 — FREE-TEXT SCRUBBING (clinic notes etc.)
# ==============================================================================
# Each pattern below finds one kind of identifier inside sentences and
# replaces it with a [BRACKETED] placeholder. The order matters: e.g. we
# remove phone numbers before ZIP codes so that pieces of a phone number
# are not mistaken for a ZIP.
MONTHS = (r"(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|"
          r"jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|"
          r"oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)")

SCRUB_PATTERNS = [
    # Web links
    (re.compile(r"\b(?:https?://|www\.)\S+", re.I), "[URL]"),
    # Email addresses
    (re.compile(r"\b[\w.+-]+@[\w-]+\.[\w.-]+\b"), "[EMAIL]"),
    # Social Security numbers: 123-45-6789, 123 45 6789, or 9 digits together
    (re.compile(r"\b\d{3}[-\s]\d{2}[-\s]\d{4}\b|\b\d{9}\b"), "[SSN]"),
    # Phone numbers: (310) 555-1234, 310-555-1234, +1 310.555.1234 ...
    (re.compile(r"(?:\+?1[-.\s]?)?(?:\(\d{3}\)\s?|\d{3}[-.\s])\d{3}[-.\s]\d{4}\b"),
     "[PHONE]"),
    # IP addresses
    (re.compile(r"\b(?:\d{1,3}\.){3}\d{1,3}\b"), "[IP]"),
    # Written-out dates: 'March 15, 2021', 'Mar 3 2021', '15 March 2021'
    (re.compile(r"\b" + MONTHS + r"\.?\s+\d{1,2}(?:st|nd|rd|th)?(?:\s*,?\s*\d{2,4})?\b",
                re.I), "[DATE]"),
    (re.compile(r"\b\d{1,2}(?:st|nd|rd|th)?\s+" + MONTHS + r"\.?(?:\s*,?\s*\d{2,4})?\b",
                re.I), "[DATE]"),
    # Numeric dates: 3/15/2021, 03-15-21, 2021-03-15 ...
    (re.compile(r"\b\d{1,4}[/-]\d{1,2}[/-]\d{1,4}\b"), "[DATE]"),
    # Street addresses: '123 Main Street', '4 Oak Ave Apt 2B' ...
    (re.compile(r"\b\d{1,6}\s+(?:[A-Za-z0-9'.]+\s+){0,3}"
                r"(?:street|st|avenue|ave|road|rd|drive|dr|lane|ln|"
                r"boulevard|blvd|court|ct|circle|cir|place|pl|terrace|ter|"
                r"trail|trl|parkway|pkwy|highway|hwy|way)\b\.?"
                r"(?:\s*,?\s*(?:apt|apartment|suite|ste|unit|#)\s*\w+)?",
                re.I), "[ADDRESS]"),
    # ZIP codes (after phones/SSNs so their digits are already gone)
    (re.compile(r"\b\d{5}(?:-\d{4})?\b"), "[ZIP]"),
    # Ages 90 or older: '94-year-old', '97 yo', 'age 102', 'aged 91'
    (re.compile(r"\b(?:9\d|1[01]\d|12[0-9])\s*[-\s]?\s*"
                r"(?:(?:year|yr)s?[-\s]?old|y[/.]?o\b)", re.I),
     "[90+ years old]"),
    (re.compile(r"\b(?:age[d]?)\s*:?\s*(?:9\d|1[01]\d|12[0-9])\b", re.I),
     "age [90+]"),
]


def scrub_generic(text):
    """Run every pattern above over one piece of free text."""
    for pattern, replacement in SCRUB_PATTERNS:
        text = pattern.sub(replacement, text)
    return text


# Very common words that might appear inside a name/address field but would
# wrongly blank out normal clinical prose if we redacted them everywhere.
_STOPWORDS = {"the", "and", "for", "with", "from", "north", "south", "east",
              "west", "new", "old", "san", "los", "las", "fort", "mount",
              "lake", "park", "hill", "hills", "beach", "city", "saint"}


def build_patient_scrubber(identifier_values):
    """Given one patient's own identifiers (their name, street, city, MRN...),
    build a regex that finds those exact words in that patient's notes.
    Returns None if there is nothing to look for."""
    pieces = set()
    for raw in identifier_values:
        if raw is None or (isinstance(raw, float) and pd.isna(raw)):
            continue
        value = re.sub(r"\.0$", "", str(raw).strip())
        if len(value) < 3:
            continue
        pieces.add(value)                       # the full value, e.g. 'Jane Doe'
        for word in re.split(r"[^\w'@.-]+", value):   # and each word: 'Jane', 'Doe'
            word = word.strip("'.-")
            if len(word) >= 3 and word.lower() not in _STOPWORDS:
                pieces.add(word)
    if not pieces:
        return None
    # Longest first, so 'Jane Doe' is replaced before 'Jane' alone.
    ordered = sorted(pieces, key=len, reverse=True)
    return re.compile(
        r"(?<![\w])(?:" + "|".join(re.escape(p) for p in ordered) + r")(?![\w])",
        re.I)


def scrub_text_for_patient(text, patient_scrubber):
    """Scrub one note: first the generic patterns, then this specific
    patient's own name/address/ID values copied from their other columns."""
    if text is None or (isinstance(text, float) and pd.isna(text)):
        return ""
    result = scrub_generic(str(text))
    if patient_scrubber is not None:
        result = patient_scrubber.sub("[REDACTED]", result)
    return result


# ==============================================================================
# SECTION 5 — RANDOM MRN GENERATION
# ==============================================================================
def make_new_mrns(count):
    """Create 'count' brand-new random IDs like 'BHH-a1b2c3d4'.
    They come from a cryptographic random generator, are NOT derived from
    any patient data, and cannot be reversed. Uniqueness is guaranteed
    within this file."""
    mrns, seen = [], set()
    while len(mrns) < count:
        candidate = "BHH-" + secrets.token_hex(4)   # 8 random hex characters
        if candidate not in seen:
            seen.add(candidate)
            mrns.append(candidate)
    return mrns


# ==============================================================================
# SECTION 6 — ENCRYPTED CROSSWALK (password-protected re-identification key)
# ==============================================================================
# The crosswalk file starts with a short marker, then a random "salt", then
# the encrypted data. The password is stretched into an encryption key with
# PBKDF2 (600,000 rounds of SHA-256), and the data is sealed with Fernet
# (AES encryption + tamper detection) from the 'cryptography' library.
CROSSWALK_MAGIC = b"BHHXWALK"
PBKDF2_ITERATIONS = 600_000


def _derive_key(password, salt):
    kdf = PBKDF2HMAC(algorithm=hashes.SHA256(), length=32,
                     salt=salt, iterations=PBKDF2_ITERATIONS)
    return base64.urlsafe_b64encode(kdf.derive(password.encode("utf-8")))


def encrypt_crosswalk(csv_bytes, password, out_path):
    salt = secrets.token_bytes(16)
    token = Fernet(_derive_key(password, salt)).encrypt(csv_bytes)
    with open(out_path, "wb") as f:
        f.write(CROSSWALK_MAGIC + salt + token)


def decrypt_crosswalk(in_path, password):
    with open(in_path, "rb") as f:
        blob = f.read()
    if not blob.startswith(CROSSWALK_MAGIC):
        sys.exit("That file does not look like a crosswalk made by this tool.")
    salt, token = blob[8:24], blob[24:]
    try:
        return Fernet(_derive_key(password, salt)).decrypt(token)
    except InvalidToken:
        sys.exit("Wrong password (or the file was damaged). Nothing decrypted.")


def ask_new_password():
    """Ask the user to choose and confirm a password (typing is hidden)."""
    print("\nChoose a password for the encrypted crosswalk file.")
    print("You will need this exact password to ever re-identify patients,")
    print("so write it down somewhere safe. It is NOT recoverable if lost.")
    while True:
        pw1 = getpass.getpass("  New crosswalk password: ")
        if len(pw1) < 8:
            print("  Please use at least 8 characters.")
            continue
        pw2 = getpass.getpass("  Type it again to confirm: ")
        if pw1 != pw2:
            print("  The two entries did not match — try again.")
            continue
        return pw1


# ==============================================================================
# SECTION 7 — FILE INPUT (command line or pop-up file picker)
# ==============================================================================
def pick_input_file(cli_path):
    """Use the path typed on the command line, or open a file-picker window."""
    if cli_path:
        if not os.path.exists(cli_path):
            sys.exit(f"File not found: {cli_path}")
        return cli_path
    try:
        import tkinter as tk
        from tkinter import filedialog
        root = tk.Tk()
        root.withdraw()                       # hide the empty main window
        root.attributes("-topmost", True)     # bring the picker to the front
        path = filedialog.askopenfilename(
            title="Choose the patient spreadsheet to de-identify",
            filetypes=[("Spreadsheets", "*.xlsx *.csv"),
                       ("Excel files", "*.xlsx"),
                       ("CSV files", "*.csv"),
                       ("All files", "*.*")])
        root.destroy()
        if not path:
            sys.exit("No file chosen — nothing to do.")
        return path
    except Exception:
        sys.exit(
            "No file was given and the file-picker window could not open.\n"
            "Please run again with the file path, for example:\n"
            "    python deidentify_patients.py \"C:\\Patients\\export.xlsx\"")


def read_spreadsheet(path):
    """Read .xlsx or .csv. Everything is read as TEXT so ZIP codes keep
    their leading zeros and ID numbers are not mangled."""
    ext = os.path.splitext(path)[1].lower()
    if ext == ".csv":
        return pd.read_csv(path, dtype=str, keep_default_na=False,
                           na_values=[""])
    if ext in (".xlsx", ".xlsm", ".xls"):
        return pd.read_excel(path, dtype=str)
    sys.exit(f"Unsupported file type '{ext}'. Please use .xlsx or .csv.")


# ==============================================================================
# SECTION 8 — MAIN DE-IDENTIFICATION WORKFLOW
# ==============================================================================
def run_deidentification(input_path):
    df = read_spreadsheet(input_path)
    if df.empty:
        sys.exit("The spreadsheet appears to be empty — nothing to do.")
    n_rows = len(df)
    print(f"\nRead {n_rows} patient rows and {len(df.columns)} columns from:")
    print(f"  {input_path}")

    # ---- 1. Decide what to do with every column -----------------------------
    plan = {}          # column name -> (action, human-readable reason)
    for col in df.columns:
        plan[col] = classify_column(col, df[col])

    # ---- 2. Show the per-column handling plan -------------------------------
    ACTION_LABEL = {
        "drop": "REMOVED",
        "dob":  "DOB -> AGE",
        "date": "YEAR ONLY",
        "zip":  "ZIP -> 3 DIGITS",
        "age":  "AGE CAPPED",
        "text": "TEXT SCRUBBED",
        "keep": "KEPT",
    }
    print("\n" + "=" * 78)
    print("PER-COLUMN HANDLING PLAN")
    print("=" * 78)
    width = max(len(str(c)) for c in df.columns) + 2
    for col, (action, reason) in plan.items():
        print(f"  {str(col):<{width}} {ACTION_LABEL[action]:<16} {reason}")
    print("=" * 78)

    # ---- 3. Make the new random MRNs ---------------------------------------
    new_mrns = make_new_mrns(n_rows)

    # ---- 4. Build the encrypted crosswalk BEFORE we destroy anything --------
    # It stores, for each new MRN, the original values of every identifying
    # or transformed column, so an authorized person can re-identify later.
    crosswalk_cols = [c for c, (a, _) in plan.items()
                      if a in ("drop", "dob", "date", "zip", "age")]
    crosswalk = pd.DataFrame({"New_MRN": new_mrns})
    for col in crosswalk_cols:
        crosswalk["ORIGINAL " + str(col)] = df[col].values

    # ---- 5. Build the de-identified output ----------------------------------
    today = pd.Timestamp.today()
    out = pd.DataFrame({"MRN": new_mrns})

    # Values from the patient's own identifier columns, used to scrub that
    # same patient's notes (their name, street, city, old MRN, etc.).
    ident_cols = [c for c, (a, _) in plan.items() if a == "drop"]

    for col, (action, _reason) in plan.items():
        if action == "drop":
            continue                                    # gone for good
        elif action == "dob":
            out["Age (from " + str(col) + ")"] = [
                dob_to_age(v, today) for v in df[col]]
        elif action == "date":
            out[str(col) + " (year)"] = [to_year_only(v) for v in df[col]]
        elif action == "zip":
            out[str(col) + " (first 3)"] = [truncate_zip(v) for v in df[col]]
        elif action == "age":
            out[col] = [cap_age(v) for v in df[col]]
        elif action == "text":
            scrubbed = []
            for i in range(n_rows):
                row_idents = [df.iloc[i][c] for c in ident_cols]
                scrubber = build_patient_scrubber(row_idents)
                scrubbed.append(
                    scrub_text_for_patient(df.iloc[i][col], scrubber))
            out[col] = scrubbed
        else:  # 'keep' — clinical data (diagnoses, meds, labs, vitals)
            out[col] = df[col].values

    # ---- 6. Write the de-identified spreadsheet -----------------------------
    base = os.path.splitext(input_path)[0]
    out_path = base + "_deidentified.xlsx"
    out.to_excel(out_path, index=False)

    # ---- 7. Encrypt and write the crosswalk ---------------------------------
    password = ask_new_password()
    crosswalk_path = base + "_crosswalk.enc"
    csv_buffer = io.StringIO()
    crosswalk.to_csv(csv_buffer, index=False)
    encrypt_crosswalk(csv_buffer.getvalue().encode("utf-8"), password,
                      crosswalk_path)

    # ---- 8. Final report and safety warning ---------------------------------
    print("\nDONE. Two files were created:")
    print(f"  1. De-identified data : {out_path}")
    print(f"  2. Encrypted crosswalk: {crosswalk_path}")
    print("     (maps each new MRN back to the original identifiers;")
    print("      locked with your password — keep both PRIVATE)")
    print("\n" + "!" * 78)
    print("! WARNING: automated scrubbing of free-text notes is NEVER 100%")
    print("! reliable. Names, addresses, dates or other identifiers written in")
    print("! unusual ways can slip through. A HUMAN MUST REVIEW the output")
    print("! (especially the scrubbed note columns) before treating this file")
    print("! as de-identified or sharing it with any AI tool or third party.")
    print("!" * 78)


def run_unlock(crosswalk_path):
    """Decrypt a crosswalk file so an AUTHORIZED person can re-identify
    patients. The result contains PHI — handle it accordingly."""
    if not os.path.exists(crosswalk_path):
        sys.exit(f"File not found: {crosswalk_path}")
    password = getpass.getpass("Crosswalk password: ")
    csv_bytes = decrypt_crosswalk(crosswalk_path, password)
    out_path = os.path.splitext(crosswalk_path)[0] + "_UNLOCKED_PHI.csv"
    with open(out_path, "wb") as f:
        f.write(csv_bytes)
    print(f"\nDecrypted crosswalk written to: {out_path}")
    print("WARNING: that file contains patient identifiers (PHI).")
    print("Store it securely and delete it as soon as you are finished.")


# ==============================================================================
# SECTION 9 — PROGRAM ENTRY POINT
# ==============================================================================
def main():
    parser = argparse.ArgumentParser(
        description="De-identify a patient spreadsheet (HIPAA Safe Harbor "
                    "helper). Runs 100%% offline.")
    parser.add_argument("input", nargs="?", default=None,
                        help="Path to the .xlsx or .csv file. If left out, "
                             "a file-picker window opens.")
    parser.add_argument("--unlock", metavar="CROSSWALK_FILE", default=None,
                        help="Decrypt a previously created crosswalk file "
                             "(requires its password).")
    args = parser.parse_args()

    if args.unlock:
        run_unlock(args.unlock)
    else:
        run_deidentification(pick_input_file(args.input))


if __name__ == "__main__":
    main()
