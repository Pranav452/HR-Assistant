#!/usr/bin/env python3
"""
Setup script for HR Knowledge Assistant Backend
This script sets up the FastAPI backend with all required dependencies
"""

import subprocess
import sys
import os

def run_command(command):
    """Run a shell command and return the result"""
    try:
        result = subprocess.run(command, shell=True, check=True, capture_output=True, text=True)
        print(f"✅ {command}")
        return result.stdout
    except subprocess.CalledProcessError as e:
        print(f"❌ Error running: {command}")
        print(f"Error: {e.stderr}")
        return None

def create_directory_structure():
    """Create the backend directory structure"""
    directories = [
        "backend",
        "backend/app",
        "backend/app/core",
        "backend/app/services",
        "backend/app/models",
        "backend/app/api",
        "backend/app/utils",
        "backend/data",
        "backend/data/documents",
        "backend/data/vector_db"
    ]
    
    for directory in directories:
        os.makedirs(directory, exist_ok=True)
        print(f"📁 Created directory: {directory}")

def create_requirements_file():
    """Create requirements.txt for the backend"""
    requirements = """
fastapi==0.104.1
uvicorn[standard]==0.24.0
python-multipart==0.0.6
python-docx==1.1.0
PyPDF2==3.0.1
pdfplumber==0.10.3
chromadb==0.4.18
langchain==0.0.350
langchain-community==0.0.1
langchain-google-genai==0.0.6
sentence-transformers==2.2.2
unstructured==0.11.6
python-magic==0.4.27
aiofiles==23.2.1
pydantic==2.5.0
python-dotenv==1.0.0
numpy==1.24.3
pandas==2.0.3
tiktoken==0.5.2
"""
    
    with open("backend/requirements.txt", "w") as f:
        f.write(requirements.strip())
    print("📄 Created requirements.txt")

def create_env_template():
    """Create .env template file"""
    env_template = """
# Google Gemini API Configuration
GOOGLE_API_KEY=your_gemini_api_key_here

# Vector Database Configuration
CHROMA_PERSIST_DIRECTORY=./data/vector_db

# Document Storage
UPLOAD_DIRECTORY=./data/documents

# API Configuration
API_HOST=0.0.0.0
API_PORT=8000
DEBUG=True

# CORS Configuration
ALLOWED_ORIGINS=["http://localhost:3000", "http://127.0.0.1:3000"]
"""
    
    with open("backend/.env.template", "w") as f:
        f.write(env_template.strip())
    print("📄 Created .env.template")

def main():
    print("🚀 Setting up HR Knowledge Assistant Backend...")
    
    # Create directory structure
    create_directory_structure()
    
    # Create requirements file
    create_requirements_file()
    
    # Create environment template
    create_env_template()
    
    print("\n✅ Backend setup complete!")
    print("\nNext steps:")
    print("1. cd backend")
    print("2. python -m venv venv")
    print("3. source venv/bin/activate  # On Windows: venv\\Scripts\\activate")
    print("4. pip install -r requirements.txt")
    print("5. Copy .env.template to .env and add your API keys")
    print("6. python -m uvicorn app.main:app --reload")

if __name__ == "__main__":
    main()
