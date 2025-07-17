import { useState } from 'react'
import { ArrowLeft, Download, FileText, Filter, Search } from 'lucide-react'
import { Button } from './ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table'
import { Input } from './ui/input'
import { Badge } from './ui/badge'
import { ScrollArea } from './ui/scroll-area'

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

interface ResultsPageProps {
  jobDescriptions: JobDescription[]
  onBack: () => void
}

// Table columns as specified
const columnNames = [
  "FileName",
  "Job Title / Position Name",
  "Reports To / Supervisor",
  "Company",
  "Grade",
  "Job Code",
  "FLSA Status",
  "Department",
  "Date Reviewed",
  "Job Summary / Scope of Position",
  "Position Summary of Major Accountabilities / Essential Functions",
  "Duties",
  "Duties - Weight",
  "Acquisition & Deployment",
  "Operational Management",
  "MARGINAL FUNCTIONS",
  "Supervision",
  "SUPERVISION - Received",
  "Minimum Experience / EDUCATION & EXPERIENCE:",
  "Requirements, Certifications and Licensure",
  "Patient Population Served",
  "Patient Population Served - Selection",
  "Carolina Org - Phy Req",
  "Carolina Org - Phy Req - Selection",
  "Carolina Org - Phy Demands",
  "Carolina Org - Phy Demands - Selection",
  "Carolina Org - Phy Env.Environment",
  "Carolina Org - Phy Env.Environment - Selection",
  "KNOWLEDGE, SKILLS & ABILITIES / Additonal Skills/Abilities",
  "Mental Demands",
  "Mental Demands - Frequency",
  "Physical Activity - Activity",
  "Physical Activity - Frequency",
  "Physical Demands.Activity",
  "Physical Demands.Frequency",
  "PHYSICAL REQUIREMENTS:",
  "Work Environment",
  "Working Environment.Activity",
  "Working Environment.Frequency"
]

export function ResultsPage({ jobDescriptions, onBack }: ResultsPageProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [filteredData, setFilteredData] = useState(jobDescriptions)

  const analyzedJobs = jobDescriptions.filter(jd => jd.status === 'analyzed')

  // Create placeholder data for the table
  const tableData = analyzedJobs.map(job => ({
    "FileName": job.filename,
    "Job Title / Position Name": "Software Engineer", // Placeholder
    "Reports To / Supervisor": "Engineering Manager", // Placeholder
    "Company": "Tech Corporation", // Placeholder
    "Grade": "L3", // Placeholder
    "Job Code": "ENG-001", // Placeholder
    "FLSA Status": "Exempt", // Placeholder
    "Department": "Engineering", // Placeholder
    "Date Reviewed": new Date().toLocaleDateString(), // Placeholder
    "Job Summary / Scope of Position": "Develop and maintain software applications", // Placeholder
    "Position Summary of Major Accountabilities / Essential Functions": "Write code, debug issues, collaborate with team", // Placeholder
    "Duties": "Code development, testing, documentation", // Placeholder
    "Duties - Weight": "80%", // Placeholder
    "Acquisition & Deployment": "Participate in CI/CD processes", // Placeholder
    "Operational Management": "Monitor system performance", // Placeholder
    "MARGINAL FUNCTIONS": "Attend meetings, training", // Placeholder
    "Supervision": "None", // Placeholder
    "SUPERVISION - Received": "Direct supervision", // Placeholder
    "Minimum Experience / EDUCATION & EXPERIENCE:": "Bachelor's degree, 3+ years", // Placeholder
    "Requirements, Certifications and Licensure": "None required", // Placeholder
    "Patient Population Served": "N/A", // Placeholder
    "Patient Population Served - Selection": "N/A", // Placeholder
    "Carolina Org - Phy Req": "N/A", // Placeholder
    "Carolina Org - Phy Req - Selection": "N/A", // Placeholder
    "Carolina Org - Phy Demands": "Sitting, typing", // Placeholder
    "Carolina Org - Phy Demands - Selection": "Frequent", // Placeholder
    "Carolina Org - Phy Env.Environment": "Office environment", // Placeholder
    "Carolina Org - Phy Env.Environment - Selection": "Indoor", // Placeholder
    "KNOWLEDGE, SKILLS & ABILITIES / Additonal Skills/Abilities": "Programming, problem-solving", // Placeholder
    "Mental Demands": "High concentration required", // Placeholder
    "Mental Demands - Frequency": "Constant", // Placeholder
    "Physical Activity - Activity": "Sitting, typing", // Placeholder
    "Physical Activity - Frequency": "Continuous", // Placeholder
    "Physical Demands.Activity": "Light physical activity", // Placeholder
    "Physical Demands.Frequency": "Occasional", // Placeholder
    "PHYSICAL REQUIREMENTS:": "Able to sit for extended periods", // Placeholder
    "Work Environment": "Office setting", // Placeholder
    "Working Environment.Activity": "Computer work", // Placeholder
    "Working Environment.Frequency": "Daily" // Placeholder
  }))

  const downloadCSV = () => {
    if (tableData.length === 0) return

    const headers = columnNames.join(',')
    const rows = tableData.map(row => 
      columnNames.map(col => `"${row[col as keyof typeof row] || ''}"`).join(',')
    ).join('\n')
    
    const csvContent = headers + '\n' + rows
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `job-analysis-results-${new Date().toISOString().split('T')[0]}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  const downloadJSON = () => {
    if (tableData.length === 0) return

    const blob = new Blob([JSON.stringify(tableData, null, 2)], { type: 'application/json' })
    const link = document.createElement('a')
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `job-analysis-results-${new Date().toISOString().split('T')[0]}.json`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-full">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onBack}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Analysis Results</h1>
              <p className="text-muted-foreground mt-1">
                Extracted data from {analyzedJobs.length} job description{analyzedJobs.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="flex items-center gap-1">
              <FileText className="h-3 w-3" />
              {analyzedJobs.length} Files Analyzed
            </Badge>
          </div>
        </div>
      </div>

      {/* Controls */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Table Controls
          </CardTitle>
          <CardDescription>
            Search and export your analysis results
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 max-w-sm">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search in results..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={downloadCSV}
                className="flex items-center gap-2"
                disabled={tableData.length === 0}
              >
                <Download className="h-4 w-4" />
                Export CSV
              </Button>
              <Button
                variant="outline"
                onClick={downloadJSON}
                className="flex items-center gap-2"
                disabled={tableData.length === 0}
              >
                <Download className="h-4 w-4" />
                Export JSON
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results Table */}
      <Card>
        <CardHeader>
          <CardTitle>Extracted Job Description Data</CardTitle>
          <CardDescription>
            Comprehensive breakdown of all analyzed job descriptions with placeholder data
          </CardDescription>
        </CardHeader>
        <CardContent>
          {tableData.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No Results Available</h3>
              <p className="text-muted-foreground">
                No analyzed job descriptions found. Please go back and analyze some files first.
              </p>
            </div>
          ) : (
            <ScrollArea className="h-[600px] w-full">
              <div className="relative overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {columnNames.map((column, index) => (
                        <TableHead key={index} className="min-w-[200px] font-medium">
                          {column}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tableData.map((row, rowIndex) => (
                      <TableRow key={rowIndex}>
                        {columnNames.map((column, colIndex) => (
                          <TableCell key={colIndex} className="max-w-[300px]">
                            <div className="truncate" title={row[column as keyof typeof row] || ''}>
                              {row[column as keyof typeof row] || '-'}
                            </div>
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Summary Stats */}
      {tableData.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Summary Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-primary/5 rounded-lg">
                <div className="text-2xl font-bold text-primary">{tableData.length}</div>
                <div className="text-sm text-muted-foreground">Total Records</div>
              </div>
              <div className="text-center p-4 bg-accent/5 rounded-lg">
                <div className="text-2xl font-bold text-accent">{columnNames.length}</div>
                <div className="text-sm text-muted-foreground">Data Points</div>
              </div>
              <div className="text-center p-4 bg-green-100 rounded-lg">
                <div className="text-2xl font-bold text-green-600">100%</div>
                <div className="text-sm text-muted-foreground">Success Rate</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}