import { getFragmentBlob } from '@cosmoslock/server';
export async function GET(_: Request, event: any) {
  return Response.json(await getFragmentBlob(event.params.contentId));
}
