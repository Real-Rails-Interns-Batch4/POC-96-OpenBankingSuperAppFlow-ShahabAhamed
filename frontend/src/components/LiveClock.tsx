"use client";

import { useEffect, useState } from "react";

export default function LiveClock() {
  const [time, setTime] = useState("");
  const [date, setDate] = useState("");

  useEffect(() => {
    const update = () => {
      const now = new Date();
      const utcTime = now.toUTCString().split(" ")[4];
      const utcDate = now.toUTCString().split(" ").slice(0, 4).join(" ");
      setTime(utcTime);
      setDate(utcDate);
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-end gap-1">
      {/* Sync badge */}
      <div className="flex items-center gap-2">
        <div className="relative flex items-center justify-center">
          <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
          <div
            className="absolute w-1.5 h-1.5 rounded-full bg-cyan-400 animate-gentle-pulse opacity-60"
          />
        </div>
        <span className="section-label text-cyan-500/80 tracking-widest">
          SYNC ACTIVE
        </span>
      </div>

      {/* UTC Time */}
      <p
        className="font-mono-data tabular-nums text-white font-semibold tracking-tight"
        style={{ fontSize: "15px", letterSpacing: "-0.01em" }}
      >
        {time}{" "}
        <span className="text-slate-500 font-normal text-xs">UTC</span>
      </p>

      {/* UTC Date */}
      <p className="font-mono-data text-[10px] text-slate-600 tracking-wider uppercase">
        {date}
      </p>
    </div>
  );
}