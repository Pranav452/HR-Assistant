"""
Question-Answering service using Gemini API
"""

import google.generativeai as genai
from typing import List, Dict, Any
import time
import asyncio

from app.core.config import settings
from app.services.vector_store import VectorStore
from app.models.schemas import QueryResponse, SourceDocument

class QAService:
    def __init__(self, vector_store: VectorStore):
        self.vector_store = vector_store
        self.model = None
        self._initialize_model()
    
    def _initialize_model(self):
        """Initialize Gemini model"""
        try:
            genai.configure(api_key=settings.GOOGLE_API_KEY)
            self.model = genai.GenerativeModel('gemini-1.5-flash')
        except Exception as e:
            raise Exception(f"Failed to initialize Gemini model: {str(e)}")
    
    async def answer_query(self, query: str, top_k: int = 5) -> QueryResponse:
        """Answer a query using RAG approach"""
        start_time = time.time()
        
        try:
            # Retrieve relevant documents
            search_results = await self.vector_store.search(query, top_k)
            
            if not search_results:
                return QueryResponse(
                    answer="I couldn't find relevant information in the HR documents to answer your question. Please try rephrasing your query or contact HR directly.",
                    sources=[],
                    category="unknown",
                    confidence=0.0,
                    processing_time=time.time() - start_time
                )
            
            # Prepare context from search results
            context = self._prepare_context(search_results)
            
            # Generate answer using Gemini
            answer = await self._generate_answer(query, context)
            
            # Prepare source documents
            sources = self._prepare_sources(search_results)
            
            # Categorize query
            category = self._categorize_query(query)
            
            # Calculate confidence based on relevance scores
            confidence = self._calculate_confidence(search_results)
            
            return QueryResponse(
                answer=answer,
                sources=sources,
                category=category,
                confidence=confidence,
                processing_time=time.time() - start_time
            )
            
        except Exception as e:
            return QueryResponse(
                answer=f"I encountered an error while processing your question: {str(e)}",
                sources=[],
                category="error",
                confidence=0.0,
                processing_time=time.time() - start_time
            )
    
    def _prepare_context(self, search_results: List[Dict[str, Any]]) -> str:
        """Prepare context from search results"""
        context_parts = []
        
        for i, result in enumerate(search_results[:5]):  # Use top 5 results
            content = result['content']
            metadata = result['metadata']
            filename = metadata.get('filename', 'Unknown Document')
            
            context_parts.append(f"[Source {i+1}: {filename}]\n{content}\n")
        
        return "\n".join(context_parts)
    
    async def _generate_answer(self, query: str, context: str) -> str:
        """Generate answer using Gemini"""
        try:
            prompt = f"""
You are an HR Knowledge Assistant. Answer the following question based ONLY on the provided HR document context. 

Guidelines:
- Provide accurate, helpful information based on the context
- If the context doesn't contain enough information, say so clearly
- Be specific about policies, procedures, and requirements
- Use a professional but friendly tone
- Include relevant details like timeframes, requirements, or steps
- If multiple options exist, explain them clearly

Context from HR Documents:
{context}

Question: {query}

Answer:"""

            response = self.model.generate_content(prompt)
            return response.text
            
        except Exception as e:
            return f"I'm sorry, I encountered an error generating the response: {str(e)}"
    
    def _prepare_sources(self, search_results: List[Dict[str, Any]]) -> List[SourceDocument]:
        """Prepare source documents for response"""
        sources = []
        
        for result in search_results[:3]:  # Top 3 sources
            metadata = result['metadata']
            
            # Extract page number if available
            page_num = None
            content = result['content']
            if '[Page ' in content:
                try:
                    page_start = content.find('[Page ') + 6
                    page_end = content.find(']', page_start)
                    page_num = int(content[page_start:page_end])
                except:
                    pass
            
            sources.append(SourceDocument(
                document=metadata.get('filename', 'Unknown Document'),
                page=page_num,
                relevance=result['relevance'],
                content=content[:200] + "..." if len(content) > 200 else content
            ))
        
        return sources
    
    def _categorize_query(self, query: str) -> str:
        """Categorize the query"""
        query_lower = query.lower()
        
        categories = {
            'benefits': ['benefit', 'insurance', 'health', 'dental', 'vision', '401k', 'retirement'],
            'leave-policies': ['leave', 'vacation', 'pto', 'sick', 'maternity', 'paternity', 'time off'],
            'work-policies': ['remote', 'work from home', 'wfh', 'flexible', 'schedule', 'attendance'],
            'performance': ['performance', 'review', 'evaluation', 'appraisal', 'feedback', 'goals'],
            'conduct': ['conduct', 'behavior', 'harassment', 'discrimination', 'ethics', 'report'],
            'compensation': ['salary', 'wage', 'pay', 'compensation', 'bonus', 'raise', 'promotion']
        }
        
        for category, keywords in categories.items():
            if any(keyword in query_lower for keyword in keywords):
                return category
        
        return 'general'
    
    def _calculate_confidence(self, search_results: List[Dict[str, Any]]) -> float:
        """Calculate confidence score based on relevance"""
        if not search_results:
            return 0.0
        
        # Average relevance of top 3 results
        top_results = search_results[:3]
        avg_relevance = sum(result['relevance'] for result in top_results) / len(top_results)
        
        # Boost confidence if multiple high-relevance results
        if len([r for r in top_results if r['relevance'] > 0.8]) >= 2:
            avg_relevance = min(avg_relevance * 1.1, 1.0)
        
        return round(avg_relevance, 2)
