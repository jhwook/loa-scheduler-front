import { SignupForm } from "@/components/features/auth/SignupForm";

export default function SignupPage() {
  return (
    <div className="flex min-h-screen flex-col bg-base-100 text-base-content">
      <main className="flex flex-1 items-center justify-center px-4 py-10">
        <SignupForm />
      </main>
    </div>
  );
}
