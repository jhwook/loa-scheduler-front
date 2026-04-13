import { LoginForm } from "@/components/features/auth/LoginForm";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col bg-base-100 text-base-content">
      <main className="flex flex-1 items-center justify-center px-4 py-10">
        <LoginForm />
      </main>
    </div>
  );
}
