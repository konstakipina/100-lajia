"use client";

interface TopBarProps {
  title: string;
  meta: string;
}

export default function TopBar({ title, meta }: TopBarProps) {
  return (
    <div
      style={{
        padding: "16px 20px 14px",
        borderBottom: "0.5px solid var(--bf)",
      }}
    >
      <div
        style={{
          fontSize: "10px",
          fontWeight: 600,
          letterSpacing: ".08em",
          textTransform: "uppercase",
          color: "var(--inkl)",
          marginBottom: "4px",
        }}
      >
        100 lajia · 2025
      </div>
      <div
        style={{
          fontFamily: "'Caveat', cursive",
          fontSize: "26px",
          color: "var(--ink)",
        }}
      >
        {title}
      </div>
      <div
        style={{
          fontSize: "11px",
          color: "var(--inkm)",
          marginTop: "3px",
        }}
      >
        {meta}
      </div>
    </div>
  );
}
