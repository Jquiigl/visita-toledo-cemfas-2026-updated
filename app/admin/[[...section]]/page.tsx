import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { session, COOKIE } from '../../../server/auth';
import Admin from '@/app/admin/ui';
export const dynamic='force-dynamic';
export default async function Page({params}:{params:Promise<{section?:string[]}>}) {
  const {section=[]}=await params;const area=section.join('/') || 'resumen';
  const jar=await cookies();const user=await session(`${COOKIE}=${jar.get(COOKIE)?.value || ''}`);
  if(area!=='login'&&!user)redirect('/admin/login');
  if(area==='login'&&user)redirect('/admin');
  return <Admin area={area} username={user?.username}/>;
}
