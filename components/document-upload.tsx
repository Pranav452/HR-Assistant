"use client"

import { useState, useCallback } from "react"
import { useDropzone } from "react-dropzone"
import { Upload, File, CheckCircle, AlertCircle, Loader2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"

interface UploadedFile {
  name: string
  size: number
  type: string
  status: "uploading" | "processing" | "completed" | "error"
  progress: number
  id: string
}

export default function DocumentUpload() {
  const [files, setFiles] = useState<UploadedFile[]>([])
  const { toast } = useToast()

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles = acceptedFiles.map((file) => ({
      name: file.name,
      size: file.size,
      type: file.type,
      status: "uploading" as const,
      progress: 0,
      id: Math.random().toString(36).substr(2, 9),
    }))

    setFiles((prev) => [...prev, ...newFiles])

    // Process files
    newFiles.forEach((file, index) => {
      processFile(file, acceptedFiles[index])
    })
  }, [])

  const processFile = async (file: UploadedFile, actualFile: File) => {
    try {
      // Create form data
      const formData = new FormData()
      formData.append('file', actualFile)

      // Upload to backend
      setFiles((prev) => prev.map((f) => (f.id === file.id ? { ...f, status: "uploading", progress: 50 } : f)))

      const response = await fetch('http://localhost:8000/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Upload failed')
      }

      // Processing stage
      setFiles((prev) => prev.map((f) => (f.id === file.id ? { ...f, status: "processing", progress: 75 } : f)))

      // Complete
      setFiles((prev) => prev.map((f) => (f.id === file.id ? { ...f, status: "completed", progress: 100 } : f)))

      toast({
        title: "Document processed successfully",
        description: `${file.name} has been added to the knowledge base`,
      })
    } catch (error) {
      console.error('Upload error:', error)
      setFiles((prev) => prev.map((f) => (f.id === file.id ? { ...f, status: "error" } : f)))

      toast({
        title: "Processing failed",
        description: `Failed to process ${file.name}`,
        variant: "destructive",
      })
    }
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
      "application/msword": [".doc"],
      "text/plain": [".txt"],
    },
    maxSize: 10 * 1024 * 1024, // 10MB
  })

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "uploading":
      case "processing":
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "error":
        return <AlertCircle className="h-4 w-4 text-red-500" />
      default:
        return <File className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      uploading: "default",
      processing: "secondary",
      completed: "default",
      error: "destructive",
    } as const

    const labels = {
      uploading: "Uploading",
      processing: "Processing",
      completed: "Completed",
      error: "Error",
    }

    return <Badge variant={variants[status as keyof typeof variants]}>{labels[status as keyof typeof labels]}</Badge>
  }

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <Card>
        <CardContent className="p-6">
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragActive ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-gray-400"
            }`}
          >
            <input {...getInputProps()} />
            <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            {isDragActive ? (
              <p className="text-blue-600 font-medium">Drop the files here...</p>
            ) : (
              <div>
                <p className="text-gray-600 font-medium mb-2">Drag & drop HR documents here, or click to select</p>
                <p className="text-sm text-gray-500">Supports PDF, Word documents, and text files (max 10MB)</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* File List */}
      {files.length > 0 && (
        <Card>
          <CardContent className="p-6">
            <h3 className="font-semibold mb-4">Uploaded Documents</h3>
            <div className="space-y-4">
              {files.map((file) => (
                <div key={file.id} className="flex items-center space-x-4 p-4 border rounded-lg">
                  {getStatusIcon(file.status)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                      {getStatusBadge(file.status)}
                    </div>
                    <p className="text-xs text-gray-500 mb-2">{formatFileSize(file.size)}</p>
                    {(file.status === "uploading" || file.status === "processing") && (
                      <div className="space-y-1">
                        <Progress value={file.progress} className="h-2" />
                        <p className="text-xs text-gray-500">
                          {file.status === "uploading" ? "Uploading" : "Processing"}: {file.progress}%
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      <Card>
        <CardContent className="p-6">
          <h3 className="font-semibold mb-3">Document Processing</h3>
          <div className="text-sm text-gray-600 space-y-2">
            <p>• Documents are automatically processed and indexed for semantic search</p>
            <p>• Text is intelligently chunked to preserve context and meaning</p>
            <p>• Metadata is extracted for better categorization and filtering</p>
            <p>• Vector embeddings are generated for similarity-based retrieval</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
