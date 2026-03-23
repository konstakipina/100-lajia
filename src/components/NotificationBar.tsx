"use client";

import { useEffect } from "react";

interface NotificationBarProps {
  message: string;
  sub: string;
  visible: boolean;
  onDismiss: () => void;
}

export default function NotificationBar({
  message,
  sub,
  visible,
  onDismiss,
}: NotificationBarProps) {
  useEffect(() => {
    if (!visible) return;
    const timer = setTimeout(onDismiss, 3500);
    return () => clearTimeout(timer);
  }, [visible, onDismiss]);

  if (!visible) return null;

  return (
    <div
      style={{
        background: "var(--accl)",
        borderBottom: "0.5px solid var(--accb)",
        padding: "10px 20px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <div
          style={{
            width: "6px",
            height: "6px",
            borderRadius: "50%",
            background: "var(--acc)",
            flexShrink: 0,
          }}
        />
        <div
          style={{
            fontSize: "13px",
            color: "var(--acct)",
            fontWeight: 500,
          }}
        >
          {message}
        </div>
        <div
          style={{
            fontFamily: "'Crimson Pro', serif",
            fontStyle: "italic",
            fontSize: "12px",
            color: "var(--acc)",
            marginLeft: "auto",
          }}
        >
          {sub}
        </div>
      </div>
    </div>
  );
}
