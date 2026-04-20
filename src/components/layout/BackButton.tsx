"use client";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

export function BackButton({ variant = "default" }: { variant?: "default" | "light" }) {
  const router = useRouter();
  const styles =
    variant === "light"
      ? "text-white/70 hover:text-white hover:bg-white/10"
      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800";

  return (
    <button
      onClick={() => router.back()}
      className={`inline-flex items-center gap-2 px-3 py-2 -ml-3 rounded-lg text-sm font-medium transition-all ${styles}`}
    >
      <ArrowLeft className="w-5 h-5" />
      Back
    </button>
  );
}
