import { Suspense } from "react";
import LoginForm from "./login-form";

function LoginFormFallback() {
  return (
    <div className="rounded-lg bg-white p-8 shadow-md">
      <h1 className="mb-6 text-center text-2xl font-bold text-gray-900">
        Sign In
      </h1>
      <div className="space-y-4">
        <div className="h-20 animate-pulse rounded-md bg-gray-200"></div>
        <div className="h-20 animate-pulse rounded-md bg-gray-200"></div>
        <div className="h-12 animate-pulse rounded-md bg-gray-200"></div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <Suspense fallback={<LoginFormFallback />}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
