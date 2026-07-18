import { docs } from "@/lib/docs";

export const dynamic = "force-static";

export async function GET() {
  return new Response(await docs.getLlmsText(), {
    headers: {
      "content-type": "text/plain; charset=utf-8",
    },
  });
}
