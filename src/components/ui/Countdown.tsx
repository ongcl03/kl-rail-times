"use client";
import { useState, useEffect } from "react";

export function Countdown({ minutesAway, status }: { minutesAway: number; status: string }) {
  const [seconds, setSeconds] = useState(minutesAway * 60);

  useEffect(() => {
    setSeconds(minutesAway * 60);
  }, [minutesAway]);

  useEffect(() => {
    const interval = setInterval(() => {
      setSeconds((s) => Math.max(0, s - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

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
