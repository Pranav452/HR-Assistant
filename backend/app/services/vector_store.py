"""
Vector store service using ChromaDB for document storage and retrieval
"""

import chromadb
from chromadb.config import Settings as ChromaSettings
import google.generativeai as genai
from typing import List, Dict, Any, Optional
import asyncio
from datetime import datetime
import os
import mimetypes

from app.core.config import settings
from app.models.schemas import DocumentChunk, DocumentInfo

class VectorStore:
    def __init__(self):
        self.client = None
        self.collection = None
        self.embedding_function = None
        
    async def initialize(self):
        """Initialize ChromaDB and embedding function"""
        try:
            # Configure Gemini API
            genai.configure(api_key=settings.GOOGLE_API_KEY)
            
            # Initialize ChromaDB client
            self.client = chromadb.PersistentClient(
                path=settings.CHROMA_PERSIST_DIRECTORY,
                settings=ChromaSettings(
                    anonymized_telemetry=False,
                    allow_reset=True
                )
            )
            
            # Get or create collection
            self.collection = self.client.get_or_create_collection(
                name="hr_documents",
                metadata={"description": "HR Knowledge Base Documents"}
            )
            
            print(f"✅ ChromaDB initialized with {self.collection.count()} documents")
            
        except Exception as e:
            raise Exception(f"Failed to initialize vector store: {str(e)}")
    
    async def add_document(self, chunks: List[DocumentChunk], filename: str, file_size: int) -> str:
        """Add document chunks to the vector store"""
        try:
            if not self.collection:
                await self.initialize()

            # Generate a consistent document ID for all chunks of this document
            document_id = f"doc_{hash(filename)}_{datetime.now().timestamp()}"
            processed_date = datetime.now().isoformat() # ISO format for consistency

            documents = []
            metadatas = []
            ids = []

            for chunk in chunks:
                documents.append(chunk.content)
                # Add document-level metadata to each chunk's metadata
                chunk.metadata["document_id"] = document_id
                chunk.metadata["filename"] = filename
                chunk.metadata["file_size"] = file_size
                chunk.metadata["uploadDate"] = processed_date # Use uploadDate to match frontend
                metadatas.append(chunk.metadata)
                ids.append(chunk.chunk_id)

            self.collection.add(
                documents=documents,
                metadatas=metadatas,
                ids=ids
            )

            return document_id

        except Exception as e:
            raise Exception(f"Failed to add document to vector store: {str(e)}")
    
    async def search(self, query: str, top_k: int = 5, category_filter: Optional[str] = None) -> List[Dict[str, Any]]:
        """Search for similar documents"""
        try:
            if not self.collection:
                await self.initialize()
            
            # Prepare where clause for filtering
            where_clause = {}
            if category_filter:
                where_clause["category"] = category_filter
            
            # Perform similarity search
            results = self.collection.query(
                query_texts=[query],
                n_results=top_k,
                where=where_clause if where_clause else None
            )
            
            # Format results
            search_results = []
            if results['documents'] and results['documents'][0]:
                for i, doc in enumerate(results['documents'][0]):
                    metadata = results['metadatas'][0][i] if results['metadatas'] else {}
                    distance = results['distances'][0][i] if results['distances'] else 0
                    
                    search_results.append({
                        'content': doc,
                        'metadata': metadata,
                        'relevance': 1 - distance,  # Convert distance to relevance score
                        'id': results['ids'][0][i] if results['ids'] else None
                    })
            
            return search_results
            
        except Exception as e:
            raise Exception(f"Failed to search vector store: {str(e)}")
    
    async def list_documents(self) -> List[DocumentInfo]:
        """List all documents in the vector store"""
        try:
            if not self.collection:
                await self.initialize()
            
            # Get all documents
            results = self.collection.get(
                include=['metadatas']
            )
            
            # Group by filename to get document info
            documents_map = {}
            
            if results['metadatas']:
                for metadata in results['metadatas']:
                    filename = metadata.get('filename')
                    document_id_meta = metadata.get('document_id')
                    if not filename or not document_id_meta:
                        continue # Skip if filename or document_id is missing
                    
                    # Use the document_id from metadata if available, otherwise generate
                    document_id = metadata.get('document_id', f"doc_{hash(filename)}")
                    
                    if document_id not in documents_map:
                        # Get file info from metadata first, then fall back to file system
                        file_size = metadata.get('file_size', 0)
                        upload_date_str = metadata.get('uploadDate')
                        
                        # If we have upload date in metadata, use it, otherwise get from file
                        if upload_date_str:
                            try:
                                upload_date = datetime.fromisoformat(upload_date_str.replace('Z', '+00:00'))
                            except:
                                upload_date = datetime.now()
                        else:
                            # Fall back to file system
                            file_path = os.path.join(settings.UPLOAD_DIRECTORY, filename)
                            upload_date = datetime.now()
                            if os.path.exists(file_path):
                                stat = os.stat(file_path)
                                if file_size == 0:  # Only update if not already set
                                    file_size = stat.st_size
                                upload_date = datetime.fromtimestamp(stat.st_mtime)

                        documents_map[document_id] = {
                            'id': document_id,
                            'name': filename,
                            'type': mimetypes.guess_type(filename)[0] or "application/octet-stream",
                            'size': int(file_size),
                            'uploadDate': upload_date,
                            'status': 'processed', # Assuming processed if in vector store
                            'category': metadata.get('category', 'general'),
                            'chunks': 0,
                        }
                    
                    documents_map[document_id]['chunks'] += 1
            
            # Convert to DocumentInfo objects
            document_list = [
                DocumentInfo(**doc_info) for doc_info in documents_map.values()
            ]
            
            return document_list
            
        except Exception as e:
            raise Exception(f"Failed to list documents: {str(e)}")
    
    async def delete_document(self, document_id: str):
        """Delete a document and all its chunks"""
        try:
            if not self.collection:
                await self.initialize()
            
            # Get all chunks for this document
            results = self.collection.get()
            
            # Find chunks belonging to this document
            chunk_ids_to_delete = []
            if results['ids'] and results['metadatas']:
                for i, metadata in enumerate(results['metadatas']):
                    if f"doc_{hash(metadata.get('filename', ''))}" == document_id:
                        chunk_ids_to_delete.append(results['ids'][i])
            
            # Delete chunks
            if chunk_ids_to_delete:
                self.collection.delete(ids=chunk_ids_to_delete)
            
        except Exception as e:
            raise Exception(f"Failed to delete document: {str(e)}")
    
    async def health_check(self) -> str:
        """Check vector store health"""
        try:
            if not self.collection:
                await self.initialize()
            
            count = self.collection.count()
            return f"healthy - {count} documents indexed"
            
        except Exception as e:
            return f"unhealthy - {str(e)}"
