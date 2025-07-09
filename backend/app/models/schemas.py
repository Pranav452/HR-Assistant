"""
Pydantic models for request/response schemas
"""

from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime

class QueryRequest(BaseModel):
    query: str
    top_k: Optional[int] = 5
    category_filter: Optional[str] = None

class SourceDocument(BaseModel):
    document: str
    page: Optional[int] = None
    relevance: float
    content: str

class QueryResponse(BaseModel):
    answer: str
    sources: List[SourceDocument]
    category: str
    confidence: float
    processing_time: float

class DocumentChunk(BaseModel):
    content: str
    metadata: Dict[str, Any]
    chunk_id: str

class DocumentInfo(BaseModel):
    id: str
    name: str
    type: str
    size: int
    uploadDate: datetime
    status: str
    category: Optional[str] = None
    chunks: int

class ProcessingStatus(BaseModel):
    document_id: str
    status: str
    progress: float
    message: str
