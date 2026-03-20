import os
import sys

# Ensure the server/ directory is on the path so `app` package resolves correctly
sys.path.insert(0, os.path.dirname(__file__))

from app import create_app

app = create_app()

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    app.run(debug=False, port=port)
