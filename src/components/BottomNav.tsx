"use client";

import { usePathname, useRouter } from "next/navigation";

const NAV_ITEMS = [
  { path: "/", label: "Omat havainnot", sub: "Kirjaa havainto" },
  { path: "/logbook", label: "Havaintokirja", sub: "Muiden havainnot" },
  { path: "/standings", label: "Kilpailutilanne", sub: "Joukkueet & yksilöt" },
];

export default function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <div
      style={{
        borderTop: "0.5px solid var(--border)",
        padding: "10px 20px 28px",
        background: "var(--p)",
        marginTop: "auto",
      }}
    >
      {NAV_ITEMS.map((item) => {
        const active = pathname === item.path;
        return (
          <div
            key={item.path}
            onClick={() => router.push(item.path)}
            style={{
              display: "flex",
              alignItems: "center",
              padding: "10px 0",
              borderBottom:
                item.path !== "/standings"
                  ? "0.5px solid var(--bf)"
                  : "none",
              cursor: "pointer",
            }}
          >
            <div>
              <div
                style={{
                  fontFamily: "'Caveat', cursive",
                  fontSize: "18px",
                  color: active ? "var(--ink)" : "var(--inkm)",
                }}
              >
                {item.label}
              </div>
              <div
                style={{
                  fontSize: "10px",
                  color: active ? "var(--inkm)" : "var(--inkl)",
                  marginTop: "1px",
                }}
              >
                {item.sub}
              </div>
            </div>
            <span
              style={{
                marginLeft: "auto",
                color: "var(--inkl)",
                fontSize: "14px",
              }}
            >
              ›
            </span>
          </div>
        );
      })}
    </div>
  );
}
