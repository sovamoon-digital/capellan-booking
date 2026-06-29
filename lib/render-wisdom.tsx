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
        <div
          style={{
            position: 'absolute',
            left: '150px',
            top: '860px',
            width: '1230px',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div style={{ width: '190px', height: '16px', backgroundColor: '#C0200F', marginBottom: '44px' }} />
          <div
            style={{
              fontSize: '122px',
              fontWeight: 700,
              color: '#1A1A1A',
              lineHeight: 1.03,
              letterSpacing: '-1px',
              textTransform: 'uppercase',
            }}
          >
            {hook}
          </div>
          <div
            style={{
              marginTop: '52px',
              fontSize: '42px',
              fontWeight: 700,
              color: '#C0200F',
              letterSpacing: '3px',
              textTransform: 'uppercase',
            }}
          >
            Capellán Auto Solution Express
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
