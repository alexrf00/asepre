"use client"

import type React from "react"

import { useState, useRef } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2, Upload, FileText, X } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { uploadContractDocument } from "@/lib/api/contracts"
import type { ContractDocumentType } from "@/types/business"

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ACCEPTED_FILE_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]

const uploadFormSchema = z.object({
  documentType: z.enum(["EXECUTED", "AMENDMENT", "ADDENDUM", "ANNEX"]),
  notes: z.string().optional(),
  makeCurrent: z.boolean().default(true),
})

type UploadFormData = z.infer<typeof uploadFormSchema>

interface UploadDocumentDialogProps {
  contractId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function UploadDocumentDialog({ contractId, open, onOpenChange, onSuccess }: UploadDocumentDialogProps) {
  const [file, setFile] = useState<File | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const {
    watch,
    setValue,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UploadFormData>({
    resolver: zodResolver(uploadFormSchema),
    defaultValues: {
      documentType: "EXECUTED",
      notes: "",
      makeCurrent: true,
    },
  })

  const documentType = watch("documentType")
  const makeCurrent = watch("makeCurrent")

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0])
    }
  }

  const handleFileSelect = (selectedFile: File) => {
    if (!ACCEPTED_FILE_TYPES.includes(selectedFile.type)) {
      toast.error("Invalid file type. Please upload PDF, DOC, or DOCX files.")
      return
    }
    if (selectedFile.size > MAX_FILE_SIZE) {
      toast.error("File too large. Maximum size is 10MB.")
      return
    }
    setFile(selectedFile)
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0])
    }
  }

  const removeFile = () => {
    setFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const onSubmit = async (data: UploadFormData) => {
    if (!file) {
      toast.error("Please select a file to upload")
      return
    }

    setIsUploading(true)
    try {
      const response = await uploadContractDocument(
        contractId,
        file,
        data.documentType as ContractDocumentType,
        data.notes,
        data.makeCurrent,
      )
      if (response.success) {
        toast.success("Document uploaded successfully")
        reset()
        setFile(null)
        onOpenChange(false)
        onSuccess()
      } else {
        toast.error(response.message || "Failed to upload document")
      }
    } catch {
      toast.error("Failed to upload document")
    } finally {
      setIsUploading(false)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B"
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB"
    return (bytes / (1024 * 1024)).toFixed(1) + " MB"
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upload Contract Document</DialogTitle>
          <DialogDescription>Upload a PDF, DOC, or DOCX file (max 10MB)</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* File Drop Zone */}
          <div
            className={`relative border-2 border-dashed rounded-lg p-6 transition-colors ${
              dragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25"
            } ${file ? "bg-muted/50" : ""}`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={handleFileInputChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />

            {file ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText className="h-8 w-8 text-primary" />
                  <div>
                    <p className="font-medium text-sm">{file.name}</p>
                    <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.preventDefault()
                    removeFile()
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="text-center">
                <Upload className="mx-auto h-10 w-10 text-muted-foreground" />
                <p className="mt-2 text-sm text-muted-foreground">Drag and drop or click to select</p>
                <p className="text-xs text-muted-foreground mt-1">PDF, DOC, DOCX (max 10MB)</p>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="documentType">Document Type *</Label>
            <Select
              value={documentType}
              onValueChange={(value) => setValue("documentType", value as ContractDocumentType)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="EXECUTED">Executed Contract</SelectItem>
                <SelectItem value="AMENDMENT">Amendment</SelectItem>
                <SelectItem value="ADDENDUM">Addendum</SelectItem>
                <SelectItem value="ANNEX">Annex</SelectItem>
              </SelectContent>
            </Select>
            {errors.documentType && <p className="text-sm text-destructive">{errors.documentType.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              placeholder="Optional notes about this document..."
              rows={2}
              {...({} as any)}
              value={watch("notes") || ""}
              onChange={(e) => setValue("notes", e.target.value)}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="makeCurrent"
              checked={makeCurrent}
              onCheckedChange={(checked) => setValue("makeCurrent", checked === true)}
            />
            <Label htmlFor="makeCurrent" className="font-normal">
              Set as current document
            </Label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isUploading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isUploading || !file}>
              {isUploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Upload
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
