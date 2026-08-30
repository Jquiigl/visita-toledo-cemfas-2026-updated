import {getSetting} from '../../../../server/db';
export async function GET(){return Response.json({evaluationActive:await getSetting('evaluationActive','false')==='true'},{headers:{'Cache-Control':'no-store'}});}
