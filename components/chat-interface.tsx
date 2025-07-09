"use client"

import { useState, useRef, useEffect } from "react"
import { Send, Bot, User, FileText, Clock, Tag } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"

interface Message {
  id: string
  type: "user" | "assistant"
  content: string
  timestamp: Date
  sources?: Array<{
    document: string
    page?: number
    relevance: number
  }>
  category?: string
}

const sampleQuestions = [
  "How many vacation days do I get as a new employee?",
  "What's the process for requesting parental leave?",
  "Can I work remotely and what are the guidelines?",
  "How do I enroll in health insurance?",
  "What are the performance review procedures?",
  "How do I report a workplace incident?",
]

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      type: "assistant",
      content:
        "Hello! I'm your HR Knowledge Assistant. I can help you find information about company policies, benefits, leave procedures, and more. What would you like to know?",
      timestamp: new Date(),
      category: "greeting",
    },
  ])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const scrollAreaRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
    }
  }, [messages])

  const handleSend = async () => {
    if (!input.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      type: "user",
      content: input,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    try {
      // Real API call to backend
      const response = await fetch('http://localhost:8000/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: input }),
      })

      if (!response.ok) {
        throw new Error('Failed to get response from backend')
      }

      const data = await response.json()

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: "assistant",
        content: data.answer,
        timestamp: new Date(),
        sources: data.sources?.map((source: any) => ({
          document: source.document,
          page: source.page,
          relevance: source.relevance,
        })) || [],
        category: data.category,
      }

      setMessages((prev) => [...prev, assistantMessage])
    } catch (error) {
      console.error('Error calling backend:', error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: "assistant",
        content: "I'm sorry, I'm having trouble connecting to the backend. Please make sure the backend server is running on localhost:8000.",
        timestamp: new Date(),
        sources: [],
        category: "error",
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const generateResponse = (query: string): string => {
    const lowerQuery = query.toLowerCase()

    if (lowerQuery.includes("vacation") || lowerQuery.includes("pto") || lowerQuery.includes("time off")) {
      return "Based on our Employee Handbook, new employees receive 15 vacation days per year, which accrue at a rate of 1.25 days per month. You can start using vacation time after completing your 90-day probationary period. Vacation requests should be submitted at least 2 weeks in advance through the HR portal."
    }

    if (lowerQuery.includes("parental leave") || lowerQuery.includes("maternity") || lowerQuery.includes("paternity")) {
      return "Our parental leave policy provides 12 weeks of paid leave for primary caregivers and 6 weeks for secondary caregivers. To request parental leave, you need to notify HR at least 30 days before your expected leave date and complete the Family Leave Request form. You'll also need to provide medical certification from your healthcare provider."
    }

    if (lowerQuery.includes("remote") || lowerQuery.includes("work from home") || lowerQuery.includes("wfh")) {
      return "Our remote work policy allows eligible employees to work from home up to 3 days per week. To be eligible, you must have completed your probationary period and received manager approval. Remote work requests should be submitted monthly through the scheduling system, and you're required to maintain the same productivity standards as in-office work."
    }

    if (lowerQuery.includes("health insurance") || lowerQuery.includes("medical") || lowerQuery.includes("benefits")) {
      return "Health insurance enrollment is available during your first 30 days of employment or during the annual open enrollment period. We offer three plan options: Basic PPO, Premium PPO, and High-Deductible Health Plan with HSA. You can enroll through our benefits portal or contact HR directly. The company covers 80% of the premium for employee coverage."
    }

    return "I found relevant information in our HR documents. Could you please be more specific about what you're looking for? I can help with policies related to benefits, leave, remote work, performance reviews, and workplace procedures."
  }

  const categorizeQuery = (query: string): string => {
    const lowerQuery = query.toLowerCase()

    if (lowerQuery.includes("vacation") || lowerQuery.includes("leave") || lowerQuery.includes("pto")) {
      return "leave-policies"
    }
    if (lowerQuery.includes("benefits") || lowerQuery.includes("insurance") || lowerQuery.includes("health")) {
      return "benefits"
    }
    if (lowerQuery.includes("remote") || lowerQuery.includes("work from home")) {
      return "work-policies"
    }
    if (lowerQuery.includes("performance") || lowerQuery.includes("review")) {
      return "performance"
    }

    return "general"
  }

  const getCategoryColor = (category?: string) => {
    const colors = {
      "leave-policies": "bg-blue-100 text-blue-800",
      benefits: "bg-green-100 text-green-800",
      "work-policies": "bg-purple-100 text-purple-800",
      performance: "bg-orange-100 text-orange-800",
      general: "bg-gray-100 text-gray-800",
      greeting: "bg-indigo-100 text-indigo-800",
    }
    return colors[category as keyof typeof colors] || colors.general
  }

  const handleSampleQuestion = (question: string) => {
    setInput(question)
  }

  return (
    <div className="flex flex-col h-[600px]">
      {/* Sample Questions */}
      <div className="mb-4">
        <h3 className="text-sm font-medium text-gray-700 mb-2">Try these sample questions:</h3>
        <div className="flex flex-wrap gap-2">
          {sampleQuestions.slice(0, 3).map((question, index) => (
            <Button
              key={index}
              variant="outline"
              size="sm"
              onClick={() => handleSampleQuestion(question)}
              className="text-xs"
            >
              {question}
            </Button>
          ))}
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 pr-4" ref={scrollAreaRef}>
        <div className="space-y-4">
          {messages.map((message) => (
            <div key={message.id} className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`flex max-w-[80%] ${message.type === "user" ? "flex-row-reverse" : "flex-row"}`}>
                <div className={`flex-shrink-0 ${message.type === "user" ? "ml-2" : "mr-2"}`}>
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      message.type === "user" ? "bg-blue-500" : "bg-gray-500"
                    }`}
                  >
                    {message.type === "user" ? (
                      <User className="w-4 h-4 text-white" />
                    ) : (
                      <Bot className="w-4 h-4 text-white" />
                    )}
                  </div>
                </div>
                <div className="flex-1">
                  <Card className={message.type === "user" ? "bg-blue-50" : "bg-gray-50"}>
                    <CardContent className="p-3">
                      <p className="text-sm">{message.content}</p>

                      {/* Message metadata */}
                      <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                        <div className="flex items-center space-x-2">
                          <Clock className="w-3 h-3" />
                          <span>{message.timestamp.toLocaleTimeString()}</span>
                        </div>
                        {message.category && (
                          <Badge className={`text-xs ${getCategoryColor(message.category)}`}>
                            <Tag className="w-3 h-3 mr-1" />
                            {message.category.replace("-", " ")}
                          </Badge>
                        )}
                      </div>

                      {/* Sources */}
                      {message.sources && message.sources.length > 0 && (
                        <div className="mt-3 pt-2 border-t border-gray-200">
                          <p className="text-xs font-medium text-gray-600 mb-1">Sources:</p>
                          <div className="space-y-1">
                            {message.sources.map((source, index) => (
                              <div key={index} className="flex items-center justify-between text-xs">
                                <div className="flex items-center space-x-1">
                                  <FileText className="w-3 h-3 text-gray-400" />
                                  <span className="text-gray-600">
                                    {source.document}
                                    {source.page && ` (p. ${source.page})`}
                                  </span>
                                </div>
                                <Badge variant="secondary" className="text-xs">
                                  {Math.round(source.relevance * 100)}% match
                                </Badge>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="flex max-w-[80%]">
                <div className="flex-shrink-0 mr-2">
                  <div className="w-8 h-8 rounded-full bg-gray-500 flex items-center justify-center">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                </div>
                <Card className="bg-gray-50">
                  <CardContent className="p-3">
                    <div className="flex items-center space-x-2">
                      <div className="animate-pulse flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div
                          className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                          style={{ animationDelay: "0.1s" }}
                        ></div>
                        <div
                          className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                          style={{ animationDelay: "0.2s" }}
                        ></div>
                      </div>
                      <span className="text-xs text-gray-500">Searching knowledge base...</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="flex space-x-2 mt-4">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about HR policies, benefits, leave procedures..."
          onKeyPress={(e) => e.key === "Enter" && handleSend()}
          disabled={isLoading}
        />
        <Button onClick={handleSend} disabled={isLoading || !input.trim()}>
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}
