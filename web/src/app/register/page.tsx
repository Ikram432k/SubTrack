"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import RegisterForm from "@/components/RegisterForm";
import { saveToken } from "@/lib/auth";

export default function RegisterPage() {
  const router = useRouter();

  return (
    <main className="p-8">
      <h1 className="mb-4 text-2xl">Create your account</h1>
      <RegisterForm
        onSuccess={(token) => {
          saveToken(token);
          router.push("/dashboard");
        }}
      />
      <p className="mt-4">
        Already have an account?{" "}
        <Link href="/login" className="underline">
          Log in
        </Link>
      </p>
    </main>
  );
}