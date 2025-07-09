"""
FastAPI main application for HR Knowledge Assistant
"""

from fastapi import FastAPI, File, UploadFile, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from typing import List, Optional
import os
from dotenv import load_dotenv

from app.core.config import settings
from app.services.document_processor import DocumentProcessor
from app.services.vector_store import VectorStore
from app.services.qa_service import QAService
from app.models.schemas import QueryRequest, QueryResponse, DocumentInfo

# Load environment variables
load_dotenv()
print(f"DEBUG: GOOGLE_API_KEY loaded: {settings.GOOGLE_API_KEY[:5]}...") # Print first 5 chars for security

# Initialize FastAPI app
app = FastAPI(
    title="HR Knowledge Assistant API",
    description="AI-powered HR document processing and query system",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize services
document_processor = DocumentProcessor()
vector_store = VectorStore()
qa_service = QAService(vector_store)

@app.on_event("startup")
async def startup_event():
    """Initialize services on startup"""
    await vector_store.initialize()
    print("✅ Vector store initialized")

@app.get("/")
async def root():
    """Health check endpoint"""
    return {"message": "HR Knowledge Assistant API is running"}

@app.post("/upload", response_model=dict)
async def upload_document(file: UploadFile = File(...)):
    """Upload and process a document"""
    try:
        # Validate file type
        allowed_types = [
            "application/pdf",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "application/msword",
            "text/plain"
        ]
        
        if file.content_type not in allowed_types:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported file type: {file.content_type}"
            )
        
        # Save uploaded file
        file_path = os.path.join(settings.UPLOAD_DIRECTORY, file.filename)
        os.makedirs(settings.UPLOAD_DIRECTORY, exist_ok=True)
        
        file_content = await file.read()
        with open(file_path, "wb") as buffer:
            buffer.write(file_content)
        
        file_size = len(file_content) # Get file size

        # Process document
        chunks = await document_processor.process_document(file_path, file.filename)
        
        # Store in vector database
        document_id = await vector_store.add_document(chunks, file.filename, file_size)
        
        return {
            "message": "Document processed successfully",
            "document_id": document_id,
            "filename": file.filename,
            "chunks_created": len(chunks),
            "status": "completed"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/query", response_model=QueryResponse)
async def query_documents(request: QueryRequest):
    """Query the knowledge base"""
    try:
        response = await qa_service.answer_query(
            query=request.query,
            top_k=request.top_k or 5
        )
        return response
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/documents", response_model=List[DocumentInfo])
async def list_documents():
    """List all processed documents"""
    try:
        documents = await vector_store.list_documents()
        return documents
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/documents/{document_id}")
async def delete_document(document_id: str):
    """Delete a document from the knowledge base"""
    try:
        await vector_store.delete_document(document_id)
        return {"message": "Document deleted successfully"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health_check():
    """Detailed health check"""
    try:
        vector_store_status = await vector_store.health_check()
        
        return {
            "status": "healthy",
            "services": {
                "vector_store": vector_store_status,
                "document_processor": "healthy",
                "qa_service": "healthy"
            }
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "error": str(e)
        }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=settings.API_HOST,
        port=settings.API_PORT,
        reload=settings.DEBUG
    )
