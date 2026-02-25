import { useState, useEffect } from "react";

interface SLATimerProps {
  createdAt: string;
  slaMinutes?: number;
}

const SLATimer = ({ createdAt, slaMinutes = 30 }: SLATimerProps) => {
  const [elapsed, setElapsed] = useState("");
  const [isBreached, setIsBreached] = useState(false);

  useEffect(() => {
    const update = () => {
      const now = Date.now();
      const created = new Date(createdAt).getTime();
      const diff = now - created;
      const totalSeconds = Math.floor(diff / 1000);
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;
      setElapsed(
        `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
      );
      setIsBreached(diff > slaMinutes * 60 * 1000);
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [createdAt, slaMinutes]);

  return (
    <span
      className={`font-mono text-xs font-bold ${
        isBreached ? "text-critical animate-pulse" : "text-warning"
      }`}
    >
      {elapsed}
      {isBreached && <span className="ml-1 text-[9px]">SLA BREACHED</span>}
    </span>
  );
};

export default SLATimer;
