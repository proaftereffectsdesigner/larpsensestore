import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function proxy(request: NextRequest) {
  // Pass through
  return NextResponse.next();
}

export const config = {
  matcher: [],
};
