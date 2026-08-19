import React from 'react';
import Link from 'next/link';

export default function Custom404() {
  return (
    <div style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '2rem', fontFamily: 'system-ui, sans-serif' }}>
      <h1 style={{ fontSize: '2rem', fontWeight: 900, marginBottom: '0.5rem' }}>404 — Page Not Found</h1>
      <p style={{ fontSize: '0.875rem', color: '#666', marginBottom: '1.5rem' }}>The page or resource you requested could not be found.</p>
      <Link href="/" style={{ padding: '0.75rem 1.5rem', backgroundColor: '#000', color: '#fff', borderRadius: '0.75rem', textDecoration: 'none', fontWeight: 700, fontSize: '0.875rem' }}>
        Return to Home
      </Link>
    </div>
  );
}
