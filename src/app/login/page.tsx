import { Suspense } from "react";
import LoginForm from "./LoginForm";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <Suspense
        fallback={
          <div className="w-full max-w-sm rounded-lg bg-white p-8 shadow">
            <h1 className="mb-6 text-center text-2xl font-bold text-gray-900">
              K2 Weighbridge
            </h1>
            <p className="text-center text-sm text-gray-500">Loading...</p>
          </div>
        }
      >
        <LoginForm />
      </Suspense>
    </div>
  );
}
