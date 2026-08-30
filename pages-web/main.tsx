import {createRoot} from 'react-dom/client';
import {lazy,Suspense} from 'react';
import PublicGuide from '../app/public-guide';
import {normalizeLanguage} from '../data/language';
import '../app/globals.css';

const Admin=lazy(()=>import('../app/admin/ui'));
const path=window.location.pathname.replace(/\/$/,'');
const admin=path==='/admin'||path.startsWith('/admin/');
createRoot(document.getElementById('root')!).render(admin
  ? <Suspense fallback={<p role="status">Cargando acceso seguro…</p>}><Admin area={path.split('/')[2]||'resumen'}/></Suspense>
  : <PublicGuide initialLanguage={normalizeLanguage(new URLSearchParams(window.location.search).get('lang'))}/>);
