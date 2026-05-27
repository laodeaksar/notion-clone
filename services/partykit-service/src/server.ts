import type * as Party from "partykit/server";
import { onConnect } from "y-partykit";

const AUTH_SERVICE_URL =
  (process.env.AUTH_SERVICE_URL as string | undefined) ?? "http://localhost:8083";
const AUTH_REQUIRED =
  (process.env.AUTH_REQUIRED as string | undefined) !== "false";

export default class DocumentServer implements Party.Server {
  constructor(readonly room: Party.Room) {}

  static async onBeforeConnect(request: Party.Request): Promise<Party.Request | Response> {
    if (!AUTH_REQUIRED) return request;

    const token = new URL(request.url).searchParams.get("token");
    if (!token) {
      return new Response(
        JSON.stringify({ error: "Unauthorized — no token" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    try {
      const res = await fetch(`${AUTH_SERVICE_URL}/api/auth/get-session`, {
        headers: { Authorization: `Bearer ${token}` },
        signal: AbortSignal.timeout(5000)
      });

      if (!res.ok) {
        return new Response(
          JSON.stringify({ error: "Unauthorized — invalid session" }),
          { status: 401, headers: { "Content-Type": "application/json" } }
        );
      }

      const data = (await res.json()) as {
        user?: { id: string; email: string };
        session?: { id: string };
      };

      if (!data.user || !data.session) {
        return new Response(
          JSON.stringify({ error: "Unauthorized — no active session" }),
          { status: 401, headers: { "Content-Type": "application/json" } }
        );
      }
      return request;
    } catch {
      return new Response(
        JSON.stringify({ error: "Unauthorized — auth service unreachable" }),
        { status: 503, headers: { "Content-Type": "application/json" } }
      );
    }
  }

  onConnect(conn: Party.Connection, ctx: Party.ConnectionContext) {
    return onConnect(conn, this.room);
  }
}

DocumentServer satisfies Party.Worker;
