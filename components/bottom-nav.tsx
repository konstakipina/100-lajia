'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_ITEMS = [
  { href: '/', label: 'Field log', sublabel: 'Record a sighting' },
  { href: '/logbook', label: 'Logbook', sublabel: 'Recent sightings' },
  { href: '/standings', label: 'Standings', sublabel: 'Teams & individuals' },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="bottom-nav">
      {NAV_ITEMS.map((item) => {
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`nav-item${active ? ' active' : ''}`}
          >
            <div>
              <div className="nav-label">{item.label}</div>
              <div className="nav-sublabel">{item.sublabel}</div>
            </div>
            <span className="nav-arrow">&rsaquo;</span>
          </Link>
        );
      })}
    </nav>
  );
}
