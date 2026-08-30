import {clearCookie,digest,tokenFrom} from '../../../../server/auth';
import {db} from '../../../../server/db';
import {sameOrigin,json} from '../../../../server/http';
export async function POST(request:Request){if(!sameOrigin(request))return json({error:'Origen no permitido.'},403);await db().prepare('DELETE FROM sessions WHERE token=?').bind(await digest(tokenFrom(request.headers.get('cookie')||''))).run();return Response.json({ok:true},{headers:{'Set-Cookie':clearCookie(),'Cache-Control':'no-store'}});}
