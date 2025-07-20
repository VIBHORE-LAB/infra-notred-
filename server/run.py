import os
import sys
import importlib.util

sys.path.append(os.path.dirname(__file__))  # ✅ Add path first
spec = importlib.util.find_spec("app")
print("[DEBUG] app is imported from:", spec.origin)

from app import create_app  # ✅ Now Python can resolve this properly

app = create_app()

if __name__ == "__main__":
    app.run(debug=True)
