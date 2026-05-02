import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { pin } = await req.json();
  const adminPin = process.env.ADMIN_PIN || '1234';

  if (pin !== adminPin) {
    return NextResponse.json({ error: 'Invalid PIN' }, { status: 401 });
  }

  const res = NextResponse.json({ success: true });
  res.cookies.set('admin_session', 'true', {
    httpOnly: true,
    path: '/',
    maxAge: 60 * 60 * 8,
    sameSite: 'lax',
  });
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ success: true });
  res.cookies.set('admin_session', '', { maxAge: 0, path: '/' });
  return res;
}
