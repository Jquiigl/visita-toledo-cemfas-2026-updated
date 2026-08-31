'use client';
import {useRef, useState} from 'react';
import Link from 'next/link';

export type Report = {title: string; headers: string[]; rows: string[][]};

export function AdminSidebar({sections, area, pending, username, logout}: {
  sections: string[][]; area: string; pending?: number; username?: string; logout: () => void;
}) {
  const [open, setOpen] = useState(false);
  const toggle = useRef<HTMLButtonElement>(null);
  const current = sections.find(([key]) => key === area)?.[1] || 'Administración';
  return <aside className="admin-sidebar" onKeyDown={event => {
    if (event.key === 'Escape' && open) {setOpen(false); toggle.current?.focus();}
  }}>
    <div className="admin-brand"><strong>TOLEDO</strong><p>Updated · Organización · V2</p></div>
    <button ref={toggle} type="button" className="admin-menu-toggle" aria-expanded={open}
      aria-controls="admin-navigation" onClick={() => setOpen(!open)}>
      <span aria-hidden="true">{open ? '×' : '☰'}</span>{open ? 'Cerrar menú' : 'Menú'}
    </button>
    <div className="admin-mobile-current">{current}</div>
    <div id="admin-navigation" className={`admin-navigation${open ? ' is-open' : ''}`}>
      <nav aria-label="Administración">{sections.map(([key, label, icon]) =>
        <Link key={key} href={key === 'resumen' ? '/admin' : `/admin/${key}`}
          aria-current={area === key ? 'page' : undefined} onClick={() => setOpen(false)}>
          <span aria-hidden="true">{icon}</span>{label}{key === 'revision' && pending !== undefined && <b>{pending}</b>}
        </Link>)}</nav>
      <div className="admin-aside-footer"><Link href="/">← Ver zona pública</Link>
        {username && <small>{username}</small>}<button type="button" onClick={logout}>Cerrar sesión</button>
      </div>
    </div>
  </aside>;
}

// Two presentations of the same report. Only one is exposed at each breakpoint;
// exports and print reports still use the complete, unmodified source data.
export function AdminReport({report}: {report: Report}) {
  if (!report.rows.length) return <p className="admin-empty" role="status">No hay resultados con estos filtros.</p>;
  return <>
    <div className="admin-table-wrap" role="region" aria-label={report.title} tabIndex={0}>
      <table><caption className="admin-sr-only">{report.title}</caption><thead><tr>
        {report.headers.map((header, index) => <th scope="col" key={index}>{header}</th>)}
      </tr></thead><tbody>{report.rows.map((row, index) => <tr key={index}>
        {row.map((cell, column) => <td key={column}>{cell}</td>)}
      </tr>)}</tbody></table>
    </div>
    <ul className="admin-mobile-records" aria-label={report.title}>{report.rows.map((row, index) =>
      <li key={index}><article><h2>{row[0]}</h2><dl>{report.headers.slice(1).map((header, column) =>
        <div key={column}><dt>{header}</dt><dd>{row[column + 1] || '—'}</dd></div>
      )}</dl></article></li>
    )}</ul>
  </>;
}
