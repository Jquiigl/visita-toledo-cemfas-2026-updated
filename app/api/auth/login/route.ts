import {login,sessionCookie} from '../../../../server/auth';
import {sameOrigin,body,json} from '../../../../server/http';
export async function POST(request:Request){
  if(!sameOrigin(request))return json({error:'Origen no permitido.'},403);
  let data;try{data=await body(request);}catch{return json({error:'Solicitud no válida.'},400);}
  if(typeof data.username!=='string'||typeof data.password!=='string'||!data.username||data.username.length>80||new TextEncoder().encode(data.password).length>72)return json({error:'Credenciales no válidas.'},400);
  const result=await login(data.username,data.password);
  return Response.json(result.token?{ok:true}:{error:result.error},{status:result.status,headers:{'Cache-Control':'no-store',...(result.token?{'Set-Cookie':sessionCookie(result.token)}:{})}});
}
