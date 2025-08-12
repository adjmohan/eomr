#!/usr/bin/env python3
import subprocess
import sys
import time
import threading
import os

def run_flask():
    """Run the Flask backend"""
    print("Starting Flask backend...")
    subprocess.run([sys.executable, "app.py"], cwd=".")

def run_vite():
    """Run the Vite frontend"""
    print("Starting Vite frontend...")
    subprocess.run(["npm", "run", "dev:client"], shell=True)

if __name__ == "__main__":
    # Start Flask backend in a separate thread
    flask_thread = threading.Thread(target=run_flask)
    flask_thread.daemon = True
    flask_thread.start()
    
    # Give Flask a moment to start
    time.sleep(2)
    
    # Start Vite frontend (this will block)
    run_vite()