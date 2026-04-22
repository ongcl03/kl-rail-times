"use client";
import { useState, useEffect } from "react";
import { getCurrentSeconds } from "@/lib/utils";

export function Countdown({ arrivalSeconds, status }: { arrivalSeconds: number; status: string }) {
  const computeRemaining = () => {
    const now = getCurrentSeconds();
    // Overnight trains have arrivalSeconds > 86400 (e.g. 24:08 = 86880)
    // but getCurrentSeconds() returns 0-86399, so shift now into the same space
    const adjustedNow = arrivalSeconds >= 86400 && now < 43200 ? now + 86400 : now;
    return Math.max(0, arrivalSeconds - adjustedNow);
  };
  const [seconds, setSeconds] = useState(computeRemaining);

  useEffect(() => {
    setSeconds(computeRemaining());
    const interval = setInterval(() => {
      setSeconds(computeRemaining());
    }, 1000);
    return () => clearInterval(interval);
  }, [arrivalSeconds]);

  if (status === "arriving" || seconds <= 30) {
    return (
      <span className="text-2xl font-bold text-green-500 dark:text-green-400 animate-pulse">
        Arriving
      </span>
    );
  }

  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;

  if (mins === 0) {
    return (
      <span className="text-2xl font-bold text-amber-500 dark:text-amber-400">
        {secs}s
      </span>
    );
  }

  if (mins >= 60) {
    const hours = Math.floor(mins / 60);
    const remainMins = mins % 60;
    return (
      <div className="text-right">
        <span className="text-2xl font-bold text-slate-900 dark:text-white">{hours}</span>
        <span className="text-sm text-slate-500 dark:text-slate-400 ml-1">hr</span>
        {remainMins > 0 && (
          <>
            <span className="text-lg font-semibold text-slate-700 dark:text-slate-300 ml-1">{remainMins}</span>
            <span className="text-xs text-slate-500 dark:text-slate-400 ml-0.5">min</span>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="text-right">
      <span className="text-2xl font-bold text-slate-900 dark:text-white">{mins}</span>
      <span className="text-sm text-slate-500 dark:text-slate-400 ml-1">min</span>
      {mins <= 5 && (
        <>
          <span className="text-lg font-semibold text-slate-700 dark:text-slate-300 ml-1">
            {String(secs).padStart(2, "0")}
          </span>
          <span className="text-xs text-slate-500 dark:text-slate-400 ml-0.5">s</span>
        </>
      )}
    </div>
  );
}
