import { requireAuth } from "@/lib/rbac";
import SignOutButton from "./signout-button";

export default async function AITestPage() {
  const user = await requireAuth();

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">
            AI Test Page
          </h1>
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

        <div className="grid gap-6 md:grid-cols-3">
          <div className="rounded-lg border-2 border-dashed border-gray-300 bg-white p-6">
            <h3 className="mb-2 text-lg font-medium text-gray-800">
              1. Quiz Generator
            </h3>
            <p className="text-sm text-gray-600">
              Upload PDF to generate MCQ questions (Teacher only)
            </p>
          </div>

          <div className="rounded-lg border-2 border-dashed border-gray-300 bg-white p-6">
            <h3 className="mb-2 text-lg font-medium text-gray-800">
              2. Recommendations
            </h3>
            <p className="text-sm text-gray-600">
              Get AI-powered track recommendations (Student only)
            </p>
          </div>

          <div className="rounded-lg border-2 border-dashed border-gray-300 bg-white p-6">
            <h3 className="mb-2 text-lg font-medium text-gray-800">
              3. Tutor Quiz
            </h3>
            <p className="text-sm text-gray-600">
              Generate personalized practice quiz (Student only)
            </p>
          </div>
        </div>

        <div className="mt-8 rounded-lg bg-blue-50 p-4">
          <p className="text-sm text-blue-800">
            <strong>Role:</strong> {user.prismaUser?.role || "Unknown"} | 
            <strong> User:</strong> {user.firstName} {user.lastName}
          </p>
        </div>
      </div>
    </div>
  );
}
