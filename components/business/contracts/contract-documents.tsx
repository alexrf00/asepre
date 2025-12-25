"use client"

import { useState, useEffect } from "react"
import { FileText, Download, Upload, Loader2, CheckCircle2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { PermissionGate } from "@/components/common/permission-gate"
import { UploadDocumentDialog } from "./upload-document-dialog"
import { listContractDocuments, downloadContractDocument, downloadCurrentDocument } from "@/lib/api/contracts"
import { formatDateTime } from "@/lib/utils/formatters"
import type { ContractDocumentDto, ContractDocumentType } from "@/types/business"

interface ContractDocumentsProps {
  contractId: string
  hasCurrentDocument: boolean
  readOnly?: boolean
}

const documentTypeLabels: Record<ContractDocumentType, string> = {
  EXECUTED: "Executed",
  AMENDMENT: "Amendment",
  ADDENDUM: "Addendum",
  ANNEX: "Annex",
}

export function ContractDocuments({ contractId, hasCurrentDocument, readOnly = false }: ContractDocumentsProps) {
  const [documents, setDocuments] = useState<ContractDocumentDto[]>([])
  const [loading, setLoading] = useState(true)
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)
  const [downloadingCurrent, setDownloadingCurrent] = useState(false)

  const fetchDocuments = async () => {
    try {
      const response = await listContractDocuments(contractId)
      if (response.success && response.data) {
        setDocuments(response.data)
      }
    } catch (error) {
      console.error("Failed to fetch documents:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDocuments()
  }, [contractId])

  const handleDownload = async (documentId: string, fileName: string) => {
    setDownloadingId(documentId)
    try {
      const blob = await downloadContractDocument(contractId, documentId)
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = fileName
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch {
      toast.error("Failed to download document")
    } finally {
      setDownloadingId(null)
    }
  }

  const handleDownloadCurrent = async () => {
    setDownloadingCurrent(true)
    try {
      const blob = await downloadCurrentDocument(contractId)
      const currentDoc = documents.find((d) => d.isCurrent)
      const fileName = currentDoc?.fileName || "contract-document.pdf"
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = fileName
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch {
      toast.error("Failed to download current document")
    } finally {
      setDownloadingCurrent(false)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B"
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB"
    return (bytes / (1024 * 1024)).toFixed(1) + " MB"
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Documents</CardTitle>
              <CardDescription>Contract documents and attachments</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {hasCurrentDocument && (
                <Button variant="outline" size="sm" onClick={handleDownloadCurrent} disabled={downloadingCurrent}>
                  {downloadingCurrent ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="mr-2 h-4 w-4" />
                  )}
                  Download Current
                </Button>
              )}
              {!readOnly && (
                <PermissionGate permission="CONTRACTS_WRITE">
                  <Button size="sm" onClick={() => setUploadDialogOpen(true)}>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload
                  </Button>
                </PermissionGate>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : documents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <FileText className="h-12 w-12 text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground">No documents uploaded yet</p>
              {!readOnly && (
                <PermissionGate permission="CONTRACTS_WRITE">
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-4 bg-transparent"
                    onClick={() => setUploadDialogOpen(true)}
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Upload Document
                  </Button>
                </PermissionGate>
              )}
            </div>
          ) : (
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>File Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Version</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead>Uploaded</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {documents.map((doc) => (
                    <TableRow key={doc.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{doc.fileName}</span>
                          {doc.isCurrent && (
                            <Badge variant="default" className="ml-1">
                              <CheckCircle2 className="mr-1 h-3 w-3" />
                              Current
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{documentTypeLabels[doc.documentType]}</Badge>
                      </TableCell>
                      <TableCell>v{doc.version}</TableCell>
                      <TableCell>{formatFileSize(doc.fileSize)}</TableCell>
                      <TableCell>{formatDateTime(doc.uploadedAt)}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDownload(doc.id, doc.fileName)}
                          disabled={downloadingId === doc.id}
                        >
                          {downloadingId === doc.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Download className="h-4 w-4" />
                          )}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <UploadDocumentDialog
        contractId={contractId}
        open={uploadDialogOpen}
        onOpenChange={setUploadDialogOpen}
        onSuccess={fetchDocuments}
      />
    </>
  )
}