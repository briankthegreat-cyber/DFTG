#!/usr/bin/env python3
# =============================================================================
#  Beverly Hills Health — De-Identify / Re-Identify Web App (runs LOCALLY)
# =============================================================================
#  WHAT THIS IS
#  ------------
#  A tiny website that runs ONLY on this computer (no internet, nothing is
#  uploaded anywhere). It has two pages:
#
#    PAGE 1 — DE-IDENTIFY
#       Upload a patient .xlsx (or .csv). The de-identified Excel file
#       downloads automatically. The encrypted crosswalk (.enc) that maps
#       the new random MRNs back to the real patients is saved automatically
#       into the "crosswalks" folder next to this program — you never have
#       to handle it yourself.
#
#    PAGE 2 — RE-IDENTIFY
#       Upload the results .xlsx (the de-identified sheet, e.g. after AI
#       added columns to it). The app automatically finds the matching
#       crosswalk file that is already stored, unlocks it with your
#       password, and the re-identified Excel file downloads automatically.
#
#  HOW TO START IT
#  ---------------
#       python3 app.py
#  Your web browser opens to the app by itself. When you are done, close
#  the black terminal window (or press Ctrl+C in it) to stop the app.
#
#  ONE-TIME INSTALL (needs internet only for this step):
#       pip install flask pandas openpyxl cryptography
#
#  PRIVACY: the app listens only on 127.0.0.1 (this computer). It makes
#  ZERO network calls. Files are processed in memory; the only thing written
#  to disk is the encrypted crosswalk.
# =============================================================================

import base64
import datetime
import io
import os
import re
import secrets
import sys
import threading
import webbrowser

# ---- friendly dependency check ----------------------------------------------
_MISSING = []
try:
    import pandas as pd
except ImportError:
    _MISSING.append("pandas")
try:
    import openpyxl  # noqa: F401  (lets pandas read/write .xlsx)
except ImportError:
    _MISSING.append("openpyxl")
try:
    from cryptography.fernet import Fernet, InvalidToken
    from cryptography.hazmat.primitives import hashes
    from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
except ImportError:
    _MISSING.append("cryptography")
try:
    from flask import Flask, request, render_template_string, send_file
except ImportError:
    _MISSING.append("flask")

if _MISSING:
    sys.exit(
        "\nSome required software is missing: " + ", ".join(_MISSING) +
        "\nPlease run this once (needs internet only for the install):\n\n"
        "    pip install flask pandas openpyxl cryptography\n\n"
        "then start the app again with:  python3 app.py\n"
    )

# Where the encrypted crosswalk files live, next to this program.
APP_DIR = os.path.dirname(os.path.abspath(__file__))
CROSSWALK_DIR = os.path.join(APP_DIR, "crosswalks")
os.makedirs(CROSSWALK_DIR, exist_ok=True)


# =============================================================================
#  SECTION 1 — DE-IDENTIFICATION LOGIC
#  (same rules as the deidentify.py script: all 18 HIPAA Safe Harbor
#   identifiers removed, dates -> year, DOB -> age with 90+ cap,
#   ZIP -> 3 digits, free-text notes scrubbed)
# =============================================================================
MRN_PREFIX = "BHH-"

DROP_KEYWORDS = [
    "name", "first", "last", "middle", "fname", "lname", "patient",
    "guarantor", "guardian", "spouse", "relative", "kin", "emergency contact",
    "employer", "occupation",
    "address", "addr", "street", "city", "county", "district",
    "phone", "cell", "mobile", "tel", "fax",
    "email", "e-mail",
    "ssn", "social security", "social sec",
    "mrn", "medical record", "chart number", "chart no",
    "beneficiary", "member id", "member no", "subscriber", "policy",
    "insurance id", "insurance no", "plan id", "medicare", "medicaid id",
    "account", "acct", "invoice", "guarantor acct",
    "license", "licence", "dl number", "drivers", "certificate",
    "vin", "vehicle", "license plate", "plate number",
    "device id", "serial", "device serial", "implant serial",
    "url", "website", "web address",
    "ip address", "ip addr",
    "fingerprint", "biometric", "retina", "voiceprint",
    "photo", "image path", "face photo",
]
DATE_KEYWORDS = [
    "dob", "birth", "date", "dos", "admit", "admission", "discharge",
    "service", "collected", "resulted", "visit", "appt", "appointment",
    "encounter", "death", "deceased", "expire", "expiration",
]
AGE_KEYWORDS = ["age"]
ZIP_KEYWORDS = ["zip", "postal", "postcode"]
FREETEXT_KEYWORDS = [
    "note", "notes", "comment", "hpi", "history", "narrative", "assessment",
    "plan", "reason", "description", "impression", "summary", "remark",
    "chief complaint", "cc", "subjective", "objective",
]
RESTRICTED_ZIP3 = {
    "036", "059", "063", "102", "203", "556", "692", "790",
    "821", "823", "830", "831", "878", "879", "884", "890", "893",
}
RE_PATTERNS = [
    (re.compile(
        r"\b((?i:daughter|son|wife|husband|spouse|mother|father|mom|dad|brother|sister|"
        r"aunt|uncle|niece|nephew|cousin|grandson|granddaughter|grandmother|grandfather|"
        r"caregiver|guardian|poa|power\s+of\s+attorney|emergency\s+contact|neighbor|friend|roommate))"
        r"(\s+(?i:is\s+|named\s+)?)((?:[A-Z][a-z]+\s*){1,3})",
    ), lambda m: m.group(1) + m.group(2) + "[NAME] "),
    (re.compile(r"\b(?:aged?)\s*:?\s*(?:9\d|1[01]\d)\b(?!\s*(?:y|year|yr))", re.I), "[AGE 90+]"),
    (re.compile(r"\b(?:9\d|1[01]\d)[-\s]*(?:y/?o|yo|yrs?|years?[-\s]*old|year[-\s]*old)\b", re.I), "[AGE 90+]"),
    (re.compile(r"\b\d{3}[-.\s]?\d{2}[-.\s]?\d{4}\b"), "[SSN]"),
    (re.compile(r"\b(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b"), "[PHONE]"),
    (re.compile(r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b"), "[EMAIL]"),
    (re.compile(r"https?://\S+|www\.\S+"), "[URL]"),
    (re.compile(r"\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b"), "[IP]"),
    (re.compile(r"\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b"), "[DATE]"),
    (re.compile(r"\b\d{4}[/-]\d{1,2}[/-]\d{1,2}\b"), "[DATE]"),
    (re.compile(r"\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{1,2},?\s+\d{4}\b", re.I), "[DATE]"),
    (re.compile(r"\b\d{5}(?:-\d{4})?\b"), "[ZIP]"),
    (re.compile(r"\b\d{1,6}\s+([A-Z][a-z]+\s){0,3}(Street|St|Avenue|Ave|Boulevard|Blvd|Road|Rd|Lane|Ln|Drive|Dr|Court|Ct|Way|Place|Pl)\b", re.I), "[ADDRESS]"),
]


def norm(s):
    return re.sub(r"[\s_]+", " ", str(s)).strip().lower()


def matches(colname, keywords):
    c = norm(colname)
    tokens = set(re.findall(r"[a-z0-9]+", c))
    for k in keywords:
        k = k.strip().lower()
        if " " in k:
            if k in c:
                return True
        elif len(k) >= 5:
            if k in c or k in tokens:
                return True
        else:
            if k in tokens:
                return True
    return False


def classify(colname):
    if matches(colname, ZIP_KEYWORDS):
        return "zip"
    if matches(colname, AGE_KEYWORDS):
        return "age"
    if matches(colname, DATE_KEYWORDS):
        return "date"
    if matches(colname, FREETEXT_KEYWORDS):
        return "freetext"
    if matches(colname, DROP_KEYWORDS):
        return "drop"
    return "keep"


def new_mrn(used):
    while True:
        m = MRN_PREFIX + secrets.token_hex(4).upper()
        if m not in used:
            used.add(m)
            return m


def to_year(val):
    if pd.isna(val) or str(val).strip() == "":
        return ""
    d = pd.to_datetime(val, errors="coerce")
    if pd.isna(d):
        m = re.search(r"(19|20)\d{2}", str(val))
        return m.group(0) if m else ""
    return str(d.year)


def dob_to_ageband(val):
    if pd.isna(val) or str(val).strip() == "":
        return ""
    d = pd.to_datetime(val, errors="coerce")
    if pd.isna(d):
        return ""
    today = datetime.date.today()
    age = today.year - d.year - ((today.month, today.day) < (d.month, d.day))
    return "90+" if age > 89 else str(age)


def cap_age(val):
    if pd.isna(val) or str(val).strip() == "":
        return ""
    m = re.search(r"\d{1,3}", str(val))
    if not m:
        return ""
    age = int(m.group(0))
    return "90+" if age > 89 else str(age)


def scrub_zip(val):
    if pd.isna(val) or str(val).strip() == "":
        return ""
    m = re.search(r"\d{3}", str(val))
    if not m:
        return ""
    z3 = m.group(0)
    return "000" if z3 in RESTRICTED_ZIP3 else z3 + "**"


def scrub_freetext(text, phrases, tokens):
    """Remove the patient's own name/address/ID words, then pattern-scrub."""
    if pd.isna(text) or str(text).strip() == "":
        return text
    s = str(text)
    for ph in sorted(phrases, key=len, reverse=True):
        if len(ph) >= 4:
            s = re.sub(re.escape(ph), "[REDACTED]", s, flags=re.I)
    for tok in sorted(tokens, key=len, reverse=True):
        s = re.sub(r"\b" + re.escape(tok) + r"\b", "[REDACTED]", s, flags=re.I)
    for pat, repl in RE_PATTERNS:
        s = pat.sub(repl, s)
    return s


def deidentify_dataframe(df):
    """Returns (deidentified_df, crosswalk_df, freetext_column_names)."""
    df = df.fillna("")
    df.columns = [str(c) for c in df.columns]
    plan = {c: classify(c) for c in df.columns}

    # Collect each patient's own identifier values so we can scrub them
    # out of that same patient's notes.
    name_cols = [c for c in df.columns
                 if matches(c, ["name", "first", "last", "middle", "patient",
                                "guarantor", "guardian", "spouse", "kin"])]
    geo_cols = [c for c in df.columns
                if matches(c, ["address", "addr", "street", "city", "county"])]
    other_drop = [c for c in df.columns
                  if plan[c] == "drop" and c not in name_cols and c not in geo_cols]

    row_phrases, row_tokens = [], []
    for _, row in df.iterrows():
        phrases, tokens = [], set()
        for c in name_cols + geo_cols:
            v = str(row[c]).strip()
            if not v:
                continue
            if " " in v:
                phrases.append(v)
            minlen = 2 if c in name_cols else 3
            for t in re.split(r"[\s,]+", v):
                if len(t) >= minlen and not t.isdigit():
                    tokens.add(t)
        for c in other_drop:
            v = str(row[c]).strip()
            if len(v) >= 4:
                tokens.add(v)
        row_phrases.append(phrases)
        row_tokens.append(tokens)

    used = set()
    mrns = [new_mrn(used) for _ in range(len(df))]

    out = pd.DataFrame({"MRN": mrns})
    cross = pd.DataFrame({"MRN": mrns})
    freetext_cols = []

    def cross_name(c):
        # If the ORIGINAL sheet already had a column called "MRN", it must
        # not overwrite the crosswalk's new-MRN column — rename it.
        return c + " (original)" if c.strip().upper() == "MRN" else c

    for c in df.columns:
        cat = plan[c]
        if cat == "drop":
            cross[cross_name(c)] = df[c]  # original kept in crosswalk only
        elif cat == "date":
            if matches(c, ["dob", "birth"]):
                out[c + " (age)"] = df[c].apply(dob_to_ageband)
            else:
                out[c + " (year)"] = df[c].apply(to_year)
            cross[cross_name(c)] = df[c]
        elif cat == "age":
            out[c] = df[c].apply(cap_age)
            cross[cross_name(c)] = df[c]
        elif cat == "zip":
            out[c + " (zip3)"] = df[c].apply(scrub_zip)
            cross[cross_name(c)] = df[c]
        elif cat == "freetext":
            freetext_cols.append(c)
            out[c] = [scrub_freetext(v, row_phrases[i], row_tokens[i])
                      for i, v in enumerate(df[c])]
        else:
            out[c] = df[c]
    return out, cross, freetext_cols


# =============================================================================
#  SECTION 2 — CROSSWALK ENCRYPTION
#  Same file format as the original scripts (16-byte salt + Fernet token,
#  PBKDF2-SHA256 with 390,000 rounds), so crosswalks made by the older
#  deidentify.py script still open here.
# =============================================================================
PBKDF2_ITERATIONS = 390000


def _derive_key(password, salt):
    kdf = PBKDF2HMAC(algorithm=hashes.SHA256(), length=32,
                     salt=salt, iterations=PBKDF2_ITERATIONS)
    return base64.urlsafe_b64encode(kdf.derive(password.encode()))


def encrypt_crosswalk(cross_df, password, path):
    salt = secrets.token_bytes(16)
    token = Fernet(_derive_key(password, salt)).encrypt(
        cross_df.to_csv(index=False).encode())
    with open(path, "wb") as f:
        f.write(salt + token)


def try_decrypt_crosswalk(path, password):
    """Returns a DataFrame, or None if the password doesn't fit this file."""
    with open(path, "rb") as f:
        raw = f.read()
    salt, token = raw[:16], raw[16:]
    try:
        plain = Fernet(_derive_key(password, salt)).decrypt(token)
    except (InvalidToken, ValueError):
        return None
    return pd.read_csv(io.BytesIO(plain), dtype=str, keep_default_na=False)


# =============================================================================
#  SECTION 3 — RE-IDENTIFICATION LOGIC
# =============================================================================
def find_matching_crosswalk(results_df, password):
    """Try every stored .enc (newest first) with the given password and pick
    the one whose MRNs best match the uploaded file.
    Returns (crosswalk_df, filename, n_decrypted) — crosswalk_df is None if
    nothing matched."""
    mrns = set(results_df["MRN"].astype(str).str.strip())
    files = sorted(
        (f for f in os.listdir(CROSSWALK_DIR) if f.lower().endswith(".enc")),
        key=lambda f: os.path.getmtime(os.path.join(CROSSWALK_DIR, f)),
        reverse=True)
    best, best_name, best_overlap, n_ok = None, None, 0, 0
    for fname in files:
        cw = try_decrypt_crosswalk(os.path.join(CROSSWALK_DIR, fname), password)
        if cw is None or "MRN" not in cw.columns:
            continue
        n_ok += 1
        overlap = len(mrns & set(cw["MRN"].astype(str).str.strip()))
        if overlap > best_overlap:
            best, best_name, best_overlap = cw, fname, overlap
    return best, best_name, n_ok


def reidentify_dataframe(results_df, cross_df):
    """Put the real identities back next to the AI results, matched by MRN."""
    results_df = results_df.fillna("")
    cross_df = cross_df.fillna("")
    merged = cross_df.merge(results_df, on="MRN", how="right",
                            suffixes=(" (original)", ""))
    id_cols = [c for c in cross_df.columns if c != "MRN"]
    rest = [c for c in merged.columns if c not in id_cols and c != "MRN"]
    merged = merged[["MRN"] + id_cols + rest]
    matched = (merged[id_cols[0]].astype(str).str.strip().ne("").sum()
               if id_cols else 0)
    return merged, int(matched), len(merged) - int(matched)


# =============================================================================
#  SECTION 4 — THE WEB PAGES
# =============================================================================
app = Flask(__name__)
app.config["MAX_CONTENT_LENGTH"] = 100 * 1024 * 1024   # 100 MB upload cap

PAGE = """
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>BHH {{ mode_title }}</title>
<style>
  :root { --blue:#1e5aa8; --green:#1e8a5a; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: -apple-system, "Segoe UI", Roboto, Arial, sans-serif;
         background: #eef2f7; color: #223; min-height: 100vh;
         display: flex; flex-direction: column; align-items: center; }
  header { width: 100%; background: #fff; border-bottom: 1px solid #dde;
           padding: 18px 0; text-align: center; }
  header h1 { font-size: 20px; color: #345; font-weight: 600; }
  nav { margin-top: 12px; }
  nav a { display: inline-block; padding: 10px 26px; margin: 0 6px;
          border-radius: 8px 8px 0 0; text-decoration: none; font-weight: 600;
          color: #667; background: #f2f5f9; border: 1px solid #dde;
          border-bottom: none; }
  nav a.active-deid  { background: var(--blue);  color: #fff; border-color: var(--blue); }
  nav a.active-reid  { background: var(--green); color: #fff; border-color: var(--green); }
  main { flex: 1; display: flex; align-items: flex-start; justify-content: center;
         width: 100%; padding: 40px 16px; }
  .card { background: #fff; border: 1px solid #dde; border-radius: 14px;
          box-shadow: 0 4px 18px rgba(30,60,110,.08); padding: 36px;
          width: 100%; max-width: 560px; text-align: center; }
  .card h2 { font-size: 30px; letter-spacing: 1px; margin-bottom: 6px;
             color: {{ accent }}; text-transform: uppercase; }
  .card p.sub { color: #667; margin-bottom: 24px; font-size: 15px; }
  .dropzone { border: 2px dashed {{ accent }}; border-radius: 12px;
              padding: 38px 18px; cursor: pointer; background: #fafcff;
              transition: background .15s; }
  .dropzone:hover, .dropzone.drag { background: #eef5ff; }
  .dropzone .big { font-size: 40px; }
  .dropzone .hint { color: #667; margin-top: 8px; font-size: 15px; }
  .dropzone .fname { margin-top: 10px; font-weight: 700; color: {{ accent }};
                     word-break: break-all; }
  input[type=file] { display: none; }
  label.pw { display: block; text-align: left; margin: 22px 0 6px;
             font-weight: 600; font-size: 14px; color: #445; }
  input[type=password] { width: 100%; padding: 12px; font-size: 16px;
             border: 1px solid #ccd5e0; border-radius: 8px; }
  button { margin-top: 22px; width: 100%; padding: 15px; font-size: 18px;
           font-weight: 700; color: #fff; background: {{ accent }};
           border: none; border-radius: 10px; cursor: pointer; }
  button:disabled { background: #b6c3d4; cursor: not-allowed; }
  .msg-err { background: #fde8e8; border: 1px solid #f5b5b5; color: #922;
             padding: 12px; border-radius: 8px; margin-bottom: 18px; }
  .msg-ok  { background: #e6f6ec; border: 1px solid #b5e0c5; color: #1e6a42;
             padding: 12px; border-radius: 8px; margin-bottom: 18px; }
  .note { margin-top: 20px; font-size: 13px; color: #778; line-height: 1.5;
          text-align: left; }
  footer { padding: 14px; color: #99a; font-size: 12px; text-align: center; }
</style>
</head>
<body>
<header>
  <h1>Beverly Hills Health — Patient Privacy Tool <span style="color:#9ab">(runs only on this computer)</span></h1>
  <nav>
    <a href="/" class="{{ 'active-deid' if mode=='deid' else '' }}">De-identify</a>
    <a href="/reidentify" class="{{ 'active-reid' if mode=='reid' else '' }}">Re-identify</a>
  </nav>
</header>
<main>
  <div class="card">
    {% if error %}<div class="msg-err">{{ error }}</div>{% endif %}
    {% if okmsg %}<div class="msg-ok">{{ okmsg }}</div>{% endif %}
    <h2>{{ mode_title }}</h2>
    <p class="sub">{{ subtitle }}</p>
    <form method="post" enctype="multipart/form-data" action="{{ action }}">
      <div class="dropzone" id="dz">
        <div class="big">&#128196;</div>
        <div class="hint"><b>Click to choose</b> or drag &amp; drop your
             .xlsx file here</div>
        <div class="fname" id="fname"></div>
      </div>
      <input type="file" id="file" name="file" accept=".xlsx,.xls,.csv" required>
      <label class="pw" for="pw">{{ pw_label }}</label>
      <input type="password" id="pw" name="password" required
             placeholder="{{ pw_placeholder }}" minlength="4">
      <button type="submit" id="go" disabled>{{ button_text }}</button>
    </form>
    <div class="note">{{ note | safe }}</div>
  </div>
</main>
<footer>All processing happens locally &mdash; no patient data ever leaves this computer.</footer>
<script>
  const dz = document.getElementById('dz'),
        input = document.getElementById('file'),
        fname = document.getElementById('fname'),
        go = document.getElementById('go');
  dz.addEventListener('click', () => input.click());
  input.addEventListener('change', show);
  ['dragover','dragenter'].forEach(e => dz.addEventListener(e, ev => {
      ev.preventDefault(); dz.classList.add('drag'); }));
  ['dragleave','drop'].forEach(e => dz.addEventListener(e, ev => {
      ev.preventDefault(); dz.classList.remove('drag'); }));
  dz.addEventListener('drop', ev => {
      if (ev.dataTransfer.files.length) { input.files = ev.dataTransfer.files; show(); }});
  function show() {
      if (input.files.length) { fname.textContent = input.files[0].name; go.disabled = false; }
  }
</script>
</body>
</html>
"""

DEID_CTX = dict(
    mode="deid", mode_title="De-identify", accent="var(--blue)",
    action="/deidentify",
    subtitle="Upload the patient spreadsheet. The de-identified Excel file "
             "downloads automatically.",
    pw_label="Choose a crosswalk password (needed later to re-identify)",
    pw_placeholder="Pick a password and keep it safe",
    button_text="De-identify ↓ Download",
    note="What happens: every patient gets a random MRN, all 18 HIPAA "
         "identifiers are removed, dates become year-only, DOB becomes age "
         "(90+ capped), ZIPs are cut to 3 digits, and notes are auto-scrubbed."
         "<br><br>The encrypted crosswalk (.enc) is stored automatically in the "
         "app's <b>crosswalks</b> folder — you don't need to do anything with it."
         "<br><br><b>&#9888;&#65039; Automated scrubbing of free-text notes is never "
         "100%. A human must review the output before sharing it with any AI "
         "tool.</b>",
)

REID_CTX = dict(
    mode="reid", mode_title="Re-identify", accent="var(--green)",
    action="/reidentify",
    subtitle="Upload the results spreadsheet (it must still have the MRN "
             "column). The re-identified Excel file downloads automatically.",
    pw_label="Crosswalk password (the one you chose when de-identifying)",
    pw_placeholder="Enter your crosswalk password",
    button_text="Re-identify ↓ Download",
    note="The app automatically finds the matching encrypted crosswalk that "
         "is already stored in its <b>crosswalks</b> folder, unlocks it with "
         "your password, and puts the real patient identities back next to "
         "your results, matched by MRN."
         "<br><br><b>&#9888;&#65039; The downloaded file contains PHI. Keep it on "
         "clinic computers only; never paste it into AI tools without a "
         "signed BAA.</b>",
)


def load_upload(file_storage):
    """Read an uploaded .xlsx/.csv into a DataFrame (everything as text)."""
    name = (file_storage.filename or "").lower()
    data = file_storage.read()
    if not data:
        raise ValueError("The uploaded file is empty.")
    if name.endswith(".csv"):
        return pd.read_csv(io.BytesIO(data), dtype=str, keep_default_na=False)
    return pd.read_excel(io.BytesIO(data), dtype=str)


def as_download(df, filename):
    """Turn a DataFrame into an .xlsx download (the browser saves it
    automatically because of the attachment header)."""
    buf = io.BytesIO()
    df.to_excel(buf, index=False)
    buf.seek(0)
    return send_file(
        buf, as_attachment=True, download_name=filename,
        mimetype="application/vnd.openxmlformats-officedocument"
                 ".spreadsheetml.sheet")


@app.route("/")
def page_deidentify():
    n = len([f for f in os.listdir(CROSSWALK_DIR) if f.endswith(".enc")])
    ok = request.args.get("done")
    okmsg = (f"Done — your de-identified file downloaded, and the encrypted "
             f"crosswalk was stored automatically ({n} crosswalk file(s) "
             f"saved so far)." if ok else None)
    return render_template_string(PAGE, error=request.args.get("error"),
                                  okmsg=okmsg, **DEID_CTX)


@app.route("/reidentify")
def page_reidentify():
    n = len([f for f in os.listdir(CROSSWALK_DIR) if f.endswith(".enc")])
    okmsg = f"{n} encrypted crosswalk file(s) already stored and ready." \
        if n else None
    error = request.args.get("error") or (
        None if n else "No crosswalk stored yet — de-identify a file first.")
    return render_template_string(PAGE, error=error, okmsg=okmsg, **REID_CTX)


@app.route("/deidentify", methods=["POST"])
def do_deidentify():
    try:
        f = request.files.get("file")
        password = request.form.get("password", "")
        if f is None or not f.filename:
            raise ValueError("Please choose a file first.")
        if len(password) < 4:
            raise ValueError("Please choose a password (at least 4 characters).")
        df = load_upload(f)
        if df.empty:
            raise ValueError("That spreadsheet has no rows.")

        out, cross, _ = deidentify_dataframe(df)

        # Save the encrypted crosswalk automatically — "it's already there"
        # for the Re-identify page later.
        base = os.path.splitext(os.path.basename(f.filename))[0]
        base = re.sub(r"[^A-Za-z0-9_-]+", "_", base) or "file"
        stamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
        encrypt_crosswalk(
            cross, password,
            os.path.join(CROSSWALK_DIR, f"{base}_CROSSWALK_{stamp}.enc"))

        return as_download(out, f"{base}_DEIDENTIFIED.xlsx")
    except Exception as e:
        from flask import redirect
        from urllib.parse import quote
        return redirect("/?error=" + quote(str(e)))


@app.route("/reidentify", methods=["POST"])
def do_reidentify():
    from flask import redirect
    from urllib.parse import quote
    try:
        f = request.files.get("file")
        password = request.form.get("password", "")
        if f is None or not f.filename:
            raise ValueError("Please choose a file first.")
        results = load_upload(f)
        results.columns = [str(c) for c in results.columns]
        mrn_col = next((c for c in results.columns
                        if c.strip().upper() == "MRN"), None)
        if mrn_col is None:
            raise ValueError("No 'MRN' column found in that file — upload the "
                             "de-identified sheet (or one keeping its MRN column).")
        results = results.rename(columns={mrn_col: "MRN"})

        cross, cw_name, n_ok = find_matching_crosswalk(results, password)
        if cross is None:
            if n_ok == 0:
                raise ValueError("Wrong password — none of the stored "
                                 "crosswalk files could be unlocked with it.")
            raise ValueError("Password OK, but no stored crosswalk matches "
                             "the MRNs in that file. Was the MRN column edited?")

        merged, matched, unmatched = reidentify_dataframe(results, cross)
        base = os.path.splitext(os.path.basename(f.filename))[0]
        base = re.sub(r"[^A-Za-z0-9_-]+", "_", base) or "file"
        return as_download(merged, f"{base}_REIDENTIFIED.xlsx")
    except Exception as e:
        return redirect("/reidentify?error=" + quote(str(e)))


# =============================================================================
#  SECTION 5 — START THE APP (and open the browser automatically)
# =============================================================================
def main():
    url = "http://127.0.0.1:5050"
    print("=" * 62)
    print("  Beverly Hills Health — Patient Privacy Tool")
    print(f"  Open your browser to:  {url}")
    print("  (it should open by itself in a moment)")
    print("  To STOP the app: close this window or press Ctrl+C.")
    print("=" * 62)
    threading.Timer(1.0, lambda: webbrowser.open(url)).start()
    # 127.0.0.1 = reachable ONLY from this computer, never from the network.
    app.run(host="127.0.0.1", port=5050, debug=False)


if __name__ == "__main__":
    main()
