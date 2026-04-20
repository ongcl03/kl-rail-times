import Link from "next/link";
import { Train } from "lucide-react";

export function Header() {
  return (
    <header className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg border-b border-slate-200 dark:border-slate-800">
      <div className="max-w-2xl mx-auto px-4 h-14 flex items-center">
        <Link href="/" className="flex items-center gap-2 text-slate-900 dark:text-white">
          <Train className="w-5 h-5" />
          <span className="font-bold text-lg">KL Rail Times</span>
        </Link>
      </div>
    </header>
  );
}
