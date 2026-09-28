"use client";

import { RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/panel/form-parts";
import { ErrorPanel } from "@/components/shared/error-panel";

interface ServiceUnavailableProps {
  onRetry: () => void;
  retryInSeconds?: number;
}

export function ServiceUnavailable({ onRetry, retryInSeconds = 60 }: ServiceUnavailableProps) {
  const [seconds, setSeconds] = useState(retryInSeconds);

  useEffect(() => {
    setSeconds(retryInSeconds);
    const timer = window.setInterval(() => {
      setSeconds((current) => (current <= 1 ? retryInSeconds : current - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [retryInSeconds]);

  return (
    <ErrorPanel
      tone="warning"
      title="We couldn’t load this server"
      actions={
        <>
          <Button variant="primary" onClick={onRetry} icon={<RefreshCw className="size-3.5" aria-hidden="true" />}>
            Try again now
          </Button>
          <span className="text-xs text-fg-muted">Retrying automatically in {seconds}s</span>
        </>
      }
    >
      The database service is unavailable right now, so this page couldn’t load correctly. Try again, and if the problem continues, reopen the dashboard.
    </ErrorPanel>
  );
}
