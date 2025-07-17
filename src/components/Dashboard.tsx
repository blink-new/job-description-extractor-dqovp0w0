import { useState, useRef } from 'react'
import { Upload, FileText, Trash2, Download, Play, Plus, X } from 'lucide-react'
import { Button } from './ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Progress } from './ui/progress'
import { Badge } from './ui/badge'
import { useToast } from '../hooks/use-toast'
import { blink } from '../blink/client'
import { ResultsPage } from './ResultsPage'

interface User {
  id: string
  email: string
  displayName?: string
}

interface JobDescription {
  id: string
  filename: string
  fileUrl: string
  fileType: string
  fileSize: number
  status: 'uploaded' | 'processing' | 'analyzed' | 'error'
  uploadedAt: string
  analyzedAt?: string
  extractedContent?: string
  analysisResults?: any
}

interface DashboardProps {
  user: User
}

export function Dashboard({ user }: DashboardProps) {
  const [jobDescriptions, setJobDescriptions] = useState<JobDescription[]>([])
  const [uploading, setUploading] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [currentView, setCurrentView] = useState<'dashboard' | 'results'>('dashboard')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    const files = Array.from(e.dataTransfer.files)
    handleFiles(files)
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    handleFiles(files)
  }

  const handleFiles = async (files: File[]) => {
    const validFiles = files.filter(file => 
      file.type === 'application/pdf' || 
      file.type === 'application/msword' ||
      file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    )

    if (validFiles.length === 0) {
      toast({
        title: "Invalid file format",
        description: "Please upload only PDF or DOC files",
        variant: "destructive"
      })
      return
    }

    setUploading(true)
    
    for (const file of validFiles) {
      try {
        const { publicUrl } = await blink.storage.upload(
          file,
          `job-descriptions/${Date.now()}-${file.name}`,
          { upsert: true }
        )

        const newJobDescription: JobDescription = {
          id: Date.now().toString(),
          filename: file.name,
          fileUrl: publicUrl,
          fileType: file.type,
          fileSize: file.size,
          status: 'uploaded',
          uploadedAt: new Date().toISOString()
        }

        setJobDescriptions(prev => [...prev, newJobDescription])
        
        toast({
          title: "File uploaded successfully",
          description: `${file.name} has been uploaded`
        })
      } catch (error) {
        console.error('Upload error:', error)
        toast({
          title: "Upload failed",
          description: `Failed to upload ${file.name}`,
          variant: "destructive"
        })
      }
    }
    
    setUploading(false)
  }

  const deleteJobDescription = (id: string) => {
    setJobDescriptions(prev => prev.filter(jd => jd.id !== id))
    toast({
      title: "File deleted",
      description: "File has been removed from the list"
    })
  }

  const analyzeJobDescriptions = async () => {
    if (jobDescriptions.length === 0) {
      toast({
        title: "No files to analyze",
        description: "Please upload some job descriptions first",
        variant: "destructive"
      })
      return
    }

    setAnalyzing(true)
    
    // Update status to processing
    setJobDescriptions(prev => 
      prev.map(jd => ({ ...jd, status: 'processing' as const }))
    )

    try {
      const analysisPromises = jobDescriptions.map(async (jd) => {
        try {
          // Extract content from the file
          const extractedContent = await blink.data.extractFromUrl(jd.fileUrl)
          
          // Analyze the content using AI
          const { text: analysisResults } = await blink.ai.generateText({
            prompt: `Analyze this job description and extract key information in JSON format. Include:
            - Job title
            - Company name
            - Location
            - Employment type (full-time, part-time, contract, etc.)
            - Required skills and qualifications
            - Responsibilities
            - Salary range (if mentioned)
            - Benefits (if mentioned)
            - Experience level required
            - Education requirements
            
            Job description content:
            ${extractedContent}
            
            Return only valid JSON format.`,
            model: 'gpt-4o-mini'
          })

          return {
            ...jd,
            status: 'analyzed' as const,
            analyzedAt: new Date().toISOString(),
            extractedContent,
            analysisResults: JSON.parse(analysisResults)
          }
        } catch (error) {
          console.error('Analysis error for', jd.filename, error)
          return {
            ...jd,
            status: 'error' as const
          }
        }
      })

      const analyzedResults = await Promise.all(analysisPromises)
      setJobDescriptions(analyzedResults)
      
      toast({
        title: "Analysis complete",
        description: `Successfully analyzed ${analyzedResults.filter(r => r.status === 'analyzed').length} job descriptions`
      })
      
      // Navigate to results page
      setCurrentView('results')
    } catch (error) {
      console.error('Analysis error:', error)
      toast({
        title: "Analysis failed",
        description: "There was an error analyzing the job descriptions",
        variant: "destructive"
      })
    } finally {
      setAnalyzing(false)
    }
  }

  const downloadResults = () => {
    const analyzedJobs = jobDescriptions.filter(jd => jd.status === 'analyzed')
    
    if (analyzedJobs.length === 0) {
      toast({
        title: "No results to download",
        description: "Please analyze some job descriptions first",
        variant: "destructive"
      })
      return
    }

    const results = analyzedJobs.map(jd => ({
      filename: jd.filename,
      uploadedAt: jd.uploadedAt,
      analyzedAt: jd.analyzedAt,
      analysis: jd.analysisResults
    }))

    const blob = new Blob([JSON.stringify(results, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `job-analysis-results-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    toast({
      title: "Results downloaded",
      description: "Analysis results have been downloaded as JSON file"
    })
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getStatusColor = (status: JobDescription['status']) => {
    switch (status) {
      case 'uploaded': return 'bg-blue-100 text-blue-800'
      case 'processing': return 'bg-yellow-100 text-yellow-800'
      case 'analyzed': return 'bg-green-100 text-green-800'
      case 'error': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  // Handle view switching
  if (currentView === 'results') {
    return (
      <ResultsPage 
        jobDescriptions={jobDescriptions}
        onBack={() => setCurrentView('dashboard')}
      />
    )
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Job Description Analyzer</h1>
            <p className="text-muted-foreground mt-2">
              Upload job descriptions and extract key information with AI analysis
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Welcome, {user.email}</span>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => blink.auth.logout()}
            >
              Sign Out
            </Button>
          </div>
        </div>
      </div>

      {/* Upload Zone */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload Job Descriptions
          </CardTitle>
          <CardDescription>
            Drag and drop your PDF or DOC files here, or click to browse
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive 
                ? 'border-primary bg-primary/5' 
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.doc,.docx"
              onChange={handleFileInput}
              className="hidden"
            />
            
            {uploading ? (
              <div className="flex flex-col items-center gap-2">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <p className="text-sm text-muted-foreground">Uploading files...</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                  <Plus className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-lg font-medium">Drop files here or click to browse</p>
                  <p className="text-sm text-muted-foreground">
                    Supports PDF, DOC, and DOCX files
                  </p>
                </div>
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-2"
                >
                  Select Files
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* File Management */}
      {jobDescriptions.length > 0 && (
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Uploaded Files ({jobDescriptions.length})
                </CardTitle>
                <CardDescription>
                  Manage your uploaded job descriptions
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={analyzeJobDescriptions}
                  disabled={analyzing || jobDescriptions.length === 0}
                  className="flex items-center gap-2"
                >
                  {analyzing ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <Play className="h-4 w-4" />
                  )}
                  {analyzing ? 'Analyzing...' : 'Analyze All'}
                </Button>
                <Button
                  variant="outline"
                  onClick={downloadResults}
                  disabled={jobDescriptions.filter(jd => jd.status === 'analyzed').length === 0}
                  className="flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Download Results
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              {jobDescriptions.map((jd) => (
                <div
                  key={jd.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{jd.filename}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatFileSize(jd.fileSize)} • Uploaded {new Date(jd.uploadedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Badge className={getStatusColor(jd.status)}>
                      {jd.status.charAt(0).toUpperCase() + jd.status.slice(1)}
                    </Badge>
                    {jd.status === 'processing' && (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteJobDescription(jd.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Analysis Results */}
      {jobDescriptions.some(jd => jd.status === 'analyzed') && (
        <Card>
          <CardHeader>
            <CardTitle>Analysis Results</CardTitle>
            <CardDescription>
              Extracted information from job descriptions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {jobDescriptions
                .filter(jd => jd.status === 'analyzed')
                .map((jd) => (
                  <div key={jd.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-medium">{jd.filename}</h3>
                      <span className="text-sm text-muted-foreground">
                        Analyzed {jd.analyzedAt ? new Date(jd.analyzedAt).toLocaleDateString() : ''}
                      </span>
                    </div>
                    
                    {jd.analysisResults && (
                      <div className="bg-gray-50 rounded-lg p-4">
                        <pre className="text-sm overflow-x-auto">
                          {JSON.stringify(jd.analysisResults, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}