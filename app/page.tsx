"use client"

import { useState } from "react"
import { Upload, MessageCircle, FileText, Brain, Search } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import DocumentUpload from "@/components/document-upload"
import ChatInterface from "@/components/chat-interface"
import DocumentManager from "@/components/document-manager"
import { Toaster } from "@/components/ui/toaster"

export default function HRAssistant() {
  const [activeTab, setActiveTab] = useState("upload")

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Brain className="h-12 w-12 text-blue-600 mr-3" />
            <h1 className="text-4xl font-bold text-gray-900">HR Knowledge Assistant</h1>
          </div>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Instantly query company policies, benefits, and employment terms with AI-powered assistance
          </p>
        </div>

        {/* Features Overview */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="text-center">
              <Upload className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <CardTitle className="text-lg">Document Upload</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Upload HR documents, policy manuals, and handbooks in PDF, Word, or text format
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="text-center">
              <Search className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <CardTitle className="text-lg">Smart Search</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                AI-powered semantic search with context-aware retrieval and policy citations
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="text-center">
              <MessageCircle className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <CardTitle className="text-lg">Chat Interface</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Natural conversation interface for querying benefits, leave policies, and guidelines
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        {/* Main Interface */}
        <Card className="max-w-6xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="h-6 w-6 mr-2" />
              HR Knowledge Management
            </CardTitle>
            <CardDescription>Upload documents and start querying your HR knowledge base</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="upload">Upload Documents</TabsTrigger>
                <TabsTrigger value="chat">Ask Questions</TabsTrigger>
                <TabsTrigger value="manage">Manage Documents</TabsTrigger>
              </TabsList>

              <TabsContent value="upload" className="mt-6">
                <DocumentUpload />
              </TabsContent>

              <TabsContent value="chat" className="mt-6">
                <ChatInterface />
              </TabsContent>

              <TabsContent value="manage" className="mt-6">
                <DocumentManager />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Sample Queries */}
        <Card className="max-w-4xl mx-auto mt-8">
          <CardHeader>
            <CardTitle>Sample Questions You Can Ask</CardTitle>
            <CardDescription>Try these example queries to see how the assistant works</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-semibold text-blue-600">Benefits & Compensation</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• "How many vacation days do I get as a new employee?"</li>
                  <li>• "How do I enroll in health insurance?"</li>
                  <li>• "What retirement benefits are available?"</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold text-green-600">Leave & Policies</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• "What's the process for requesting parental leave?"</li>
                  <li>• "Can I work remotely and what are the guidelines?"</li>
                  <li>• "How do I report a workplace incident?"</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      <Toaster />
    </div>
  )
}
