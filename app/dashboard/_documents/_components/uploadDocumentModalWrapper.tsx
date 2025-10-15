"use client";

import * as React from "react";
import { UploadDocumentModalOptimized as UploadDocumentModal } from "../../_components/uploadDocumentModal/uploadDocumentModalOptimized";

interface UploadDocumentModalWrapperProps {
  children: React.ReactNode;
  onUploadComplete?: () => void;
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
        onOpenChange={(open) => {
          setUploadModalOpen(open);
          if (!open && onUploadComplete) {
            // Call refresh when modal closes (upload completed)
            onUploadComplete();
          }
        }}
      />
    </>
  );
}
