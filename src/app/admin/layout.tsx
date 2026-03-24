"use client";

import { useRouter } from "next/navigation";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
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
          100 lajia · Ylläpito
        </div>
        <div style={{ display: "flex", gap: "16px", marginTop: "8px" }}>
          <span
            onClick={() => router.push("/admin/species")}
            style={{
              fontFamily: "'Caveat', cursive",
              fontSize: "18px",
              color: "var(--inkm)",
              cursor: "pointer",
            }}
          >
            Lajilista
          </span>
          <span
            onClick={() => router.push("/admin/teams")}
            style={{
              fontFamily: "'Caveat', cursive",
              fontSize: "18px",
              color: "var(--inkm)",
              cursor: "pointer",
            }}
          >
            Joukkueet
          </span>
          <span
            onClick={() => router.push("/")}
            style={{
              fontFamily: "system-ui, sans-serif",
              fontSize: "13px",
              color: "var(--inkl)",
              cursor: "pointer",
              marginLeft: "auto",
              alignSelf: "center",
            }}
          >
            ← Takaisin
          </span>
        </div>
      </div>
      {children}
    </div>
  );
}
