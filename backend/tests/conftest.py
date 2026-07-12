import os
import sys

# /app  (the directory that holds app.py) is the parent of this tests/ folder.
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
