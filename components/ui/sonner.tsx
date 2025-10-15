"use client";

import { Toaster as Sonner } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="light"
      position="top-right"
      closeButton
      richColors
      toastOptions={{
        classNames: {
          icon: "self-start mt-1",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
