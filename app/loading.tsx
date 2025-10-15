import { SimpleLoader } from "@/components/simpleLoader";

export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <SimpleLoader size="lg" />
    </div>
  );
}
