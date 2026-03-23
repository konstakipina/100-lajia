type TopBarProps = {
  title: string;
  eyebrow?: string;
  meta?: string;
};

export function TopBar({ title, eyebrow, meta }: TopBarProps) {
  return (
    <div className="topbar">
      {eyebrow && <div className="topbar-eyebrow">{eyebrow}</div>}
      <div className="topbar-title">{title}</div>
      {meta && <div className="topbar-meta">{meta}</div>}
    </div>
  );
}
