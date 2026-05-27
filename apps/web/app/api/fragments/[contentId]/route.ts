import { getFragmentBlob } from '@cosmoslock/server';
export async function GET(_: Request, { params }: { params: { contentId: string } }) { return Response.json(await getFragmentBlob(params.contentId)); }
