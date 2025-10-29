"use client";

import * as React from "react";
import { UploadDocumentModalOptimized as UploadDocumentModal } from "../../_components/uploadDocumentModal/uploadDocumentModalOptimized";
import type { UploadedFileInfo } from "../../_components/uploadDocumentModal/types";

interface UploadDocumentModalWrapperProps {
  children: React.ReactNode;
  onUploadComplete?: (uploadedFiles?: UploadedFileInfo[]) => void;
}

export function UploadDocumentModalWrapper({
  children,
  onUploadComplete,
}: UploadDocumentModalWrapperProps) {
  const [uploadModalOpen, setUploadModalOpen] = React.useState(false);

  const handleClick = () => {
    setUploadModalOpen(true);
  };

  return (
    <>
      <div onClick={handleClick}>{children}</div>

      <UploadDocumentModal
        open={uploadModalOpen}
        onOpenChange={(open, uploadedFiles) => {
          setUploadModalOpen(open);
          if (!open && onUploadComplete) {
            // Call callback with uploaded files when modal closes
            onUploadComplete(uploadedFiles);
          }
        }}
      />
    </>
  );
}
