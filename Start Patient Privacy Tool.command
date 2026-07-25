#!/bin/bash
# =============================================================================
#  Beverly Hills Health — Patient Privacy Tool  (Mac launcher)
# =============================================================================
#  HOW TO USE:  just DOUBLE-CLICK this file in Finder.
#
#  The very first time only, macOS may block it. If so:
#     right-click (or Control-click) this file -> Open -> Open.
#  After that, a normal double-click works forever.
#
#  The first launch takes a minute while it sets itself up (it creates a
#  private Python environment and installs what it needs — internet is
#  needed ONLY for that one-time setup). Every launch after that is fast
#  and fully offline. Your browser opens to the app automatically.
#
#  To STOP the app: close the Terminal window that appears.
# =============================================================================

# Always work from the folder this file lives in, so it can be moved anywhere
# (Desktop, Applications, a USB stick) as long as app.py moves with it.
cd "$(dirname "$0")" || exit 1

echo "======================================================"
echo "  Beverly Hills Health - Patient Privacy Tool"
echo "======================================================"

# ---- 1. Find Python 3 (comes with macOS command line tools) -----------------
if command -v python3 >/dev/null 2>&1; then
    PY=python3
else
    echo ""
    echo "Python 3 was not found on this Mac."
    echo "Easiest fix: install it from  https://www.python.org/downloads/"
    echo "then double-click this file again."
    read -r -p "Press Return to close..."
    exit 1
fi

# ---- 2. One-time setup: private environment with the needed libraries -------
# (kept in a hidden '.venv' folder next to this file; never touches the
#  system Python, and avoids Mac 'externally managed environment' errors)
if [ ! -f ".venv/bin/python3" ]; then
    echo ""
    echo "First-time setup: preparing the app (about a minute)..."
    "$PY" -m venv .venv || { echo "Setup failed."; read -r -p "Press Return to close..."; exit 1; }
    ./.venv/bin/pip install --quiet --upgrade pip
    ./.venv/bin/pip install --quiet flask pandas openpyxl cryptography || {
        echo "Could not install the required libraries (is the internet on?)."
        read -r -p "Press Return to close..."
        exit 1
    }
    echo "Setup complete. This was a one-time step."
fi

# ---- 3. Start the app (your browser opens by itself) ------------------------
echo ""
echo "Starting... your browser will open to the app in a moment."
echo "Leave this window open while you use the app."
echo "To STOP the app, simply close this window."
echo ""
exec ./.venv/bin/python3 app.py
