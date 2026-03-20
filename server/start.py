import sys
import os

# 1. Inject vendor directory so pip packages are found (bypasses AppRunner $PATH issues)
vendor_path = os.path.join(os.path.dirname(__file__), 'vendor')
sys.path.insert(0, vendor_path)

from gunicorn.app.base import BaseApplication

from app import create_app

class StandaloneApplication(BaseApplication):
    def __init__(self, app, options=None):
        self.options = options or {}
        self.application = app
        super().__init__()

    def load_config(self):
        config = {key: value for key, value in self.options.items()
                  if key in self.cfg.settings and value is not None}
        for key, value in config.items():
            self.cfg.set(key.lower(), value)

    def load(self):
        return self.application

if __name__ == '__main__':
    flask_app = create_app()

    options = {
        'bind': '0.0.0.0:8080',
        'workers': 2,
        'timeout': 120,
    }

    StandaloneApplication(flask_app, options).run()
