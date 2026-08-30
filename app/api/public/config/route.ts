// The survey is always visible, including before the event and if the database is unavailable.
export async function GET(){return Response.json({evaluationActive:true},{headers:{'Cache-Control':'no-store'}});}
