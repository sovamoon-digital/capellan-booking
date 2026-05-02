import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';

export async function isAdminAuthed(req: NextRequest): Promise<boolean> {
  const cookie = req.cookies.get('admin_session');
  return cookie?.value === 'true';
}

export async function isAdminAuthedServer(): Promise<boolean> {
  const cookieStore = await cookies();
  return cookieStore.get('admin_session')?.value === 'true';
}
