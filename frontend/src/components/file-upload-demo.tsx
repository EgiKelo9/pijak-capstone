"use client";
import { FileUpload } from "@/components/ui/file-upload";
import { X } from "lucide-react";
import { useState } from "react";

interface FileUploadDemoProps {
  isOpen?: boolean;
  onClose?: () => void;
  onUploadConfirm?: (file: File) => Promise<void>;
}

export function FileUploadDemo({ isOpen, onClose, onUploadConfirm }: FileUploadDemoProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileUpload = (files: File[]) => {
    setFiles(files);
  };

  const handleUploadSubmit = async () => {
    if (files.length === 0 || !onUploadConfirm) return;

    setIsUploading(true);

    try {
      // Delegate the actual upload logic to the parent component
      await onUploadConfirm(files[0]);
      
      // If successful (no error thrown), clear files and close
      setFiles([]);
      onClose?.();
    } catch (error) {
      console.error("Error during file upload:", error);
      alert(error instanceof Error ? error.message : "Terjadi kesalahan saat mengunggah.");
    } finally {
      setIsUploading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm transition-all p-4">
      <div className="relative flex flex-col w-full max-w-4xl mx-auto bg-white dark:bg-black border border-dashed border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-2xl overflow-hidden">
        
        {onClose && (
          <button 
            onClick={() => {
              setFiles([]); // clear state on close
              onClose();
            }}
            className="absolute right-4 top-4 z-50 rounded-full p-2 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-400 transition-colors"
          >
            <X className="size-4" />
          </button>
        )}

        <div className="flex-1 p-2">
          <FileUpload onChange={handleFileUpload} />
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 border-t border-neutral-200 dark:border-neutral-800 p-4 bg-neutral-50 dark:bg-neutral-900/50">
          <button 
            onClick={() => {
              setFiles([]);
              onClose?.();
            }} 
            className="px-4 py-2 text-sm font-medium text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded-lg transition-colors"
          >
            Batal
          </button>
          
          <button 
            onClick={handleUploadSubmit}
            disabled={files.length === 0 || isUploading}
            className="px-4 py-2 text-sm font-medium text-white bg-[#2BBAEE] hover:bg-[#1a9fd4] disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors shadow-sm"
          >
            {isUploading ? "Mengunggah..." : "Kirim & Unggah"}
          </button>
        </div>

      </div>
    </div>
  );
}
