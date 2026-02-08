import { useEffect, useRef, useState } from "react";
import "./PerformanceMonitor.css";

const SPARKLINE_LEN = 60;
const LONG_TASK_THRESHOLD_MS = 50;

export default function PerformanceMonitor() {
  const [fps, setFps] = useState(0);
  const [sparkline, setSparkline] = useState<number[]>([]);
  const [longTaskWarning, setLongTaskWarning] = useState<string | null>(null);
  const frameCount = useRef(0);
  const lastTime = useRef(performance.now());
  const sparklineRef = useRef<number[]>([]);
  const rafId = useRef<number>(0);

  useEffect(() => {
    const measure = () => {
      frameCount.current += 1;
      const now = performance.now();
      const elapsed = now - lastTime.current;
      if (elapsed >= 1000) {
        const currentFps = Math.round((frameCount.current * 1000) / elapsed);
        setFps(currentFps);
        frameCount.current = 0;
        lastTime.current = now;
        sparklineRef.current = [...sparklineRef.current.slice(-(SPARKLINE_LEN - 1)), currentFps];
        setSparkline(sparklineRef.current);
      }
      rafId.current = requestAnimationFrame(measure);
    };
    rafId.current = requestAnimationFrame(measure);
    return () => cancelAnimationFrame(rafId.current);
  }, []);

  useEffect(() => {
    let observer: PerformanceObserver | null = null;
    try {
      observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const duration = entry.duration;
          if (duration >= LONG_TASK_THRESHOLD_MS) {
            setLongTaskWarning(`Main Thread Blocked for ${Math.round(duration)} ms!`);
            setTimeout(() => setLongTaskWarning(null), 4000);
          }
        }
      });
      observer.observe({ entryTypes: ["longtask"] });
    } catch {
      // longtask may not be supported in all browsers
    }
    return () => observer?.disconnect();
  }, []);

  const maxFps = Math.max(60, ...sparkline, 1);

  return (
    <div className="perf-monitor">
      <div className="perf-monitor-header">Performance Monitor</div>
      <div className="perf-monitor-fps">
        <span className="perf-monitor-fps-value" data-fps={fps >= 55 ? "good" : fps >= 30 ? "ok" : "bad"}>
          {fps} FPS
        </span>
        <div className="perf-monitor-sparkline">
          {sparkline.map((v, i) => (
            <div
              key={i}
              className="perf-monitor-sparkline-bar"
              style={{ height: `${Math.min(100, (v / maxFps) * 100)}%` }}
            />
          ))}
        </div>
      </div>
      {longTaskWarning && (
        <div className="perf-monitor-longtask" role="alert">
          {longTaskWarning}
        </div>
      )}
    </div>
  );
}
