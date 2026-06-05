"use client";

import { useEffect, useState } from "react";

export default function LiveClock() {

  const [time, setTime] = useState("");

  useEffect(() => {

    const updateClock = () => {

      const now = new Date();

      setTime(
        now.toUTCString().split(" ")[4] + " UTC"
      );
    };

    updateClock();

    const interval = setInterval(updateClock, 1000);

    return () => clearInterval(interval);

  }, []);

  return (

    <div className="flex flex-col items-end">

      <div className="flex items-center gap-2">

        <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></div>

        <span className="text-xs font-bold tracking-wider text-slate-300 uppercase">
          Live Data Feed
        </span>

      </div>

      <p className="text-sm text-cyan-400 mt-2 font-medium">
        {time}
      </p>

      <p className="text-[11px] text-slate-500 mt-1">
        Last Sync: Active
      </p>

    </div>
  );
}