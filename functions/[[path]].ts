import {handle} from '../server/pages/handler';
import type {PagesEnv} from '../server/pages/supabase';
type Env=PagesEnv&{ASSETS:Fetcher};
// Only /admin* and /api/* invoke this function, via dist-pages/_routes.json.
export const onRequest:PagesFunction<Env>=async context=>handle(context.request,context.env,()=>{
  const url=new URL(context.request.url);url.pathname='/index.html';url.search='';
  return context.env.ASSETS.fetch(new Request(url,{method:context.request.method==='HEAD'?'HEAD':'GET'}));
});
