// Renders the "word of wisdom" hook onto the Capellán template (2250x2250)
// using next/og (Satori). Returns PNG bytes; the caller converts to JPEG
// (Instagram's Graph API only accepts JPEG for image publishing).
//
// The template + brand font are served as static assets and fetched at
// runtime by absolute URL (public/ files aren't on the serverless filesystem).

import { ImageResponse } from 'next/og';

const BASE = process.env.PUBLIC_BASE_URL || 'https://capellanservicio.com';

export async function renderWisdomPng(hook: string): Promise<Buffer> {
  const fontData = await fetch(`${BASE}/fonts/BarlowCondensed-Bold.ttf`).then((r) => {
    if (!r.ok) throw new Error('No se pudo cargar la fuente de marca');
    return r.arrayBuffer();
  });

  const templateUrl = `${BASE}/templates/wisdom.jpg`;

  const image = new ImageResponse(
    (
      <div style={{ width: '2250px', height: '2250px', display: 'flex', position: 'relative', fontFamily: 'Barlow' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={templateUrl} width={2250} height={2250} style={{ position: 'absolute', top: 0, left: 0 }} />
        {/* Text in the clean white zone: left/center, below the logo, beside the mascot */}
        {/* Compact dark card — hugs its content (no empty void) and stays narrow
            so its right edge clears the mascot on the right. */}
        <div
          style={{
            position: 'absolute',
            left: '110px',
            top: '870px',
            width: '1060px',
            backgroundColor: '#16181D',
            borderRadius: '28px',
            padding: '72px 64px',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div style={{ width: '200px', height: '16px', backgroundColor: '#C0200F', marginBottom: '42px' }} />
          <div
            style={{
              fontSize: '116px',
              fontWeight: 700,
              color: '#F5F5F5',
              lineHeight: 1.03,
              letterSpacing: '-2px',
              textTransform: 'uppercase',
            }}
          >
            {hook}
          </div>
          <div style={{ width: '100%', height: '3px', backgroundColor: '#2A2D34', marginTop: '58px', marginBottom: '40px' }} />
          <div style={{ fontSize: '46px', fontWeight: 700, color: '#D4A017', letterSpacing: '1px' }}>
            @capellanservicio
          </div>
          <div
            style={{
              marginTop: '10px',
              fontSize: '34px',
              fontWeight: 700,
              color: '#A0AEC0',
              letterSpacing: '2px',
              textTransform: 'uppercase',
            }}
          >
            Bonao · República Dominicana
          </div>
        </div>
      </div>
    ),
    {
      width: 2250,
      height: 2250,
      fonts: [{ name: 'Barlow', data: fontData, weight: 700, style: 'normal' }],
    }
  );

  return Buffer.from(await image.arrayBuffer());
}
