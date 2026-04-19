import { requireAuth } from "@/lib/rbac";
import SignOutButton from "./signout-button";
import PdfUploadWrapper from "./pdf-upload-wrapper";

export default async function AITestPage() {
  const user = await requireAuth();

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">AI Test Page</h1>
          <SignOutButton />
        </div>

        <div className="mb-8 rounded-lg bg-white p-6 shadow-md">
          <h2 className="mb-4 text-xl font-semibold text-gray-800">
            Authenticated User Data
          </h2>
          <div className="overflow-auto rounded-md bg-gray-900 p-4">
            <pre className="text-sm text-green-400">
              {JSON.stringify(user, null, 2)}
            </pre>
          </div>
        </div>

        {/* PDF Upload and Quiz Generator */}
        <PdfUploadWrapper />
      </div>
    </div>
  );
}
