"use client"

import { useState, useEffect } from "react"
import { FileText, Trash2, Eye, Download, Search, Filter } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"

interface Document {
  id: string
  name: string
  type: string
  size: number
  uploadDate: Date
  status: "processed" | "processing" | "error"
  category: string
  chunks: number
  lastAccessed?: Date
}

export default function DocumentManager() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [filterCategory, setFilterCategory] = useState("all")
  const [filterStatus, setFilterStatus] = useState("all")
  const { toast } = useToast()

  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        const response = await fetch("http://localhost:8000/documents")
        if (!response.ok) {
          throw new Error("Failed to fetch documents")
        }
        const data = await response.json()
        setDocuments(data)
      } catch (error) {
        toast({
          title: "Error fetching documents",
          description: "Could not retrieve document list from the server.",
          variant: "destructive",
        })
      }
    }
    fetchDocuments()
  }, [toast])

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const getFileIcon = (type: string) => {
    return <FileText className="h-4 w-4 text-blue-500" />
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      processed: "default",
      processing: "secondary",
      error: "destructive",
    } as const

    const labels = {
      processed: "Processed",
      processing: "Processing",
      error: "Error",
    }

    return <Badge variant={variants[status as keyof typeof variants]}>{labels[status as keyof typeof labels]}</Badge>
  }

  const getCategoryBadge = (category: string) => {
    const colors = {
      policies: "bg-blue-100 text-blue-800",
      benefits: "bg-green-100 text-green-800",
      "work-policies": "bg-purple-100 text-purple-800",
      "leave-policies": "bg-orange-100 text-orange-800",
      performance: "bg-red-100 text-red-800",
    }

    return (
      <Badge className={colors[category as keyof typeof colors] || "bg-gray-100 text-gray-800"}>
        {category.replace("-", " ")}
      </Badge>
    )
  }

  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch = doc.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = filterCategory === "all" || doc.category === filterCategory
    const matchesStatus = filterStatus === "all" || doc.status === filterStatus
    return matchesSearch && matchesCategory && matchesStatus
  })

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`http://localhost:8000/documents/${id}`, {
        method: "DELETE",
      })
      if (!response.ok) {
        throw new Error("Failed to delete document")
      }
      setDocuments((prev) => prev.filter((doc) => doc.id !== id))
      toast({
        title: "Document deleted",
        description: "The document has been removed from the knowledge base",
      })
    } catch (error) {
      toast({
        title: "Error deleting document",
        description: "Could not delete the document from the server.",
        variant: "destructive",
      })
    }
  }

  const handleView = (doc: Document) => {
    window.open(`http://localhost:8000/documents/download/${doc.name}`, "_blank")
  }

  const handleDownload = (doc: Document) => {
    window.open(`http://localhost:8000/documents/download/${doc.name}`, "_blank")
  }

  const totalDocuments = documents.length
  const processedDocuments = documents.filter((d) => d.status === "processed").length
  const totalChunks = documents.reduce((sum, doc) => sum + doc.chunks, 0)

  return (
    <div className="space-y-6">
      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Documents</p>
                <p className="text-2xl font-bold text-gray-900">{totalDocuments}</p>
              </div>
              <FileText className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Processed</p>
                <p className="text-2xl font-bold text-green-600">{processedDocuments}</p>
              </div>
              <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                <span className="text-green-600 font-bold">✓</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Text Chunks</p>
                <p className="text-2xl font-bold text-purple-600">{totalChunks}</p>
              </div>
              <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center">
                <span className="text-purple-600 font-bold">#</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="h-5 w-5 mr-2" />
            Filter Documents
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search documents..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="policies">Policies</SelectItem>
                <SelectItem value="benefits">Benefits</SelectItem>
                <SelectItem value="work-policies">Work Policies</SelectItem>
                <SelectItem value="leave-policies">Leave Policies</SelectItem>
                <SelectItem value="performance">Performance</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="processed">Processed</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="error">Error</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Documents Table */}
      <Card>
        <CardHeader>
          <CardTitle>Document Library</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Document</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Chunks</TableHead>
                <TableHead>Upload Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDocuments.map((doc) => (
                <TableRow key={doc.id}>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      {getFileIcon(doc.type)}
                      <div>
                        <p className="font-medium">{doc.name}</p>
                        {doc.lastAccessed && (
                          <p className="text-xs text-gray-500">
                            Last accessed: {new Date(doc.lastAccessed).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{getCategoryBadge(doc.category)}</TableCell>
                  <TableCell>{getStatusBadge(doc.status)}</TableCell>
                  <TableCell>{formatFileSize(doc.size)}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{doc.chunks}</Badge>
                  </TableCell>
                  <TableCell>{new Date(doc.uploadDate).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Button variant="ghost" size="sm" onClick={() => handleView(doc)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDownload(doc)}>
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(doc.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}