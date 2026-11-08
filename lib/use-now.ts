"use client";

// Живое «сейчас»: тикающий таймер для подсветки пар и таймера до конца пары

import { useEffect, useState } from "react";
import { getNowStatus, type NowStatus } from "./bells";

export function useNow(tickMs = 15000): { status: NowStatus; todayWeekday: number } {
  const [state, setState] = useState(() => compute());
  useEffect(() => {
    const id = setInterval(() => setState(compute()), tickMs);
    return () => clearInterval(id);
  }, [tickMs]);
  return state;
}

function compute() {
  const now = new Date();
  const dow = now.getDay() === 0 ? 7 : now.getDay();
  const minutes = now.getHours() * 60 + now.getMinutes();
  return { status: getNowStatus(dow, minutes) as NowStatus, todayWeekday: dow };
}
