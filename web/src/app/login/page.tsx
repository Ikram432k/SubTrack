"use client";

import { useRouter } from "next/navigation";
import LoginForm from "@/components/LoginForm";
import { saveToken } from "@/lib/auth";
export default function LoginPage() {
  const router = useRouter();

  return (
    <main className="p-8">
      <h1 className="mb-4 text-2xl">Log in</h1>
      <LoginForm
        onSuccess={(token) => {
          // localStorage.setItem("token", token);
          saveToken(token);
          router.push("/dashboard");
        }}
      />
    </main>
  );
}