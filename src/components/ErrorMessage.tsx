"use client";

interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
}

export default function ErrorMessage({ message, onRetry }: ErrorMessageProps) {
  return (
    <div
      style={{
        background: "var(--card)",
        border: "0.5px solid var(--border)",
        borderRadius: "10px",
        padding: "14px",
        textAlign: "center",
      }}
    >
      <div style={{ fontSize: "13px", color: "#993C1D", marginBottom: onRetry ? "10px" : 0 }}>
        {message}
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          style={{
            fontFamily: "system-ui, sans-serif",
            fontSize: "13px",
            fontWeight: 600,
            padding: "8px 14px",
            border: "none",
            borderRadius: "10px",
            background: "var(--ink)",
            color: "var(--p)",
            cursor: "pointer",
          }}
        >
          Yritä uudelleen
        </button>
      )}
    </div>
  );
}
