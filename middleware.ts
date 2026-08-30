import {NextResponse, type NextRequest} from 'next/server';
export function middleware(request:NextRequest){
  const url=request.nextUrl;
  if(url.protocol==='http:'&&!['localhost','127.0.0.1','[::1]'].includes(url.hostname)){url.protocol='https:';return NextResponse.redirect(url);}
  const response=NextResponse.next();
  response.headers.set('X-Content-Type-Options','nosniff');
  response.headers.set('Referrer-Policy','strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy','camera=(), microphone=()');
  response.headers.set('Strict-Transport-Security','max-age=31536000');
  if(url.pathname.startsWith('/admin')||url.pathname.startsWith('/api')){response.headers.set('Cache-Control','no-store');response.headers.set('X-Robots-Tag','noindex, nofollow');}
  return response;
}
