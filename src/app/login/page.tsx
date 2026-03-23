"use client";

import { loginWithGoogle } from "@/lib/auth";

export default function LoginPage() {
  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 32px",
        gap: "28px",
      }}
    >
      <div style={{ textAlign: "center" }}>
        <h1
          style={{
            fontFamily: "'Caveat', cursive",
            fontSize: "52px",
            color: "var(--ink)",
          }}
        >
          100 lajia
        </h1>
        <p
          style={{
            fontFamily: "'Crimson Pro', serif",
            fontStyle: "italic",
            fontSize: "18px",
            color: "var(--inkm)",
            marginTop: "6px",
          }}
        >
          Havaintopäiväkirja
        </p>
        <small
          style={{
            display: "block",
            fontSize: "10px",
            color: "var(--inkl)",
            letterSpacing: ".07em",
            textTransform: "uppercase",
            marginTop: "4px",
          }}
        >
          Kilpailukausi 2025
        </small>
      </div>

      <div
        style={{
          width: "40px",
          height: "0.5px",
          background: "var(--border)",
        }}
      />

      <button
        onClick={loginWithGoogle}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          padding: "14px 24px",
          border: "0.5px solid var(--border)",
          borderRadius: "10px",
          background: "var(--card)",
          cursor: "pointer",
          fontSize: "15px",
          color: "var(--ink)",
          width: "100%",
          fontFamily: "system-ui",
        }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24">
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          />
        </svg>
        Kirjaudu Google-tilillä
      </button>

      <div
        style={{
          fontSize: "11px",
          color: "var(--inkl)",
          textAlign: "center",
          lineHeight: 1.6,
        }}
      >
        Kirjautuminen yhdistää sinut joukkueeseesi
        <br />
        ja tallentaa havaintosi kilpailuun.
      </div>
    </div>
  );
}
