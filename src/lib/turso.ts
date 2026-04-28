/**
 * Turso HTTP API client for browser.
 * Talks directly to Turso's HTTP pipeline endpoint — no backend server needed.
 */

const DB_URL = import.meta.env.VITE_TURSO_DATABASE_URL?.replace('libsql://', 'https://') || '';
const AUTH_TOKEN = import.meta.env.VITE_TURSO_AUTH_TOKEN || '';

interface TursoCol {
  name: string;
  decltype?: string;
}

interface TursoValue {
  type: string;
  value?: string;
}

interface TursoResult {
  cols: TursoCol[];
  rows: TursoValue[][];
}

interface TursoResponse {
  results: { type: string; response?: { type: string; result?: TursoResult } }[];
}

/** Unwrap a Turso wire value to a JS primitive */
function unwrapValue(v: TursoValue): any {
  if (v.type === 'null') return null;
  if (v.type === 'integer') return Number(v.value);
  if (v.type === 'float') return Number(v.value);
  return v.value ?? null;
}

/** Convert cols + rows into plain objects */
function toObjects(result: TursoResult): Record<string, any>[] {
  return result.rows.map((row) => {
    const obj: Record<string, any> = {};
    result.cols.forEach((col, i) => {
      obj[col.name] = unwrapValue(row[i]);
    });
    return obj;
  });
}

/** Execute a single SQL statement */
export async function execute(sql: string, args: any[] = []): Promise<Record<string, any>[]> {
  const res = await fetch(`${DB_URL}/v3/pipeline`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${AUTH_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      requests: [
        { type: 'execute', stmt: { sql, args: args.map(toValue) } },
        { type: 'close' },
      ],
    }),
  });
  if (!res.ok) throw new Error(`Turso ${res.status}: ${await res.text()}`);
  const data: TursoResponse = await res.json();
  const result = data.results?.[0]?.response?.result;
  if (!result) return [];
  return toObjects(result);
}

/** Execute multiple statements in a batch */
export async function batch(statements: { sql: string; args?: any[] }[]): Promise<Record<string, any>[][]> {
  const requests: any[] = statements.map((s) => ({
    type: 'execute',
    stmt: { sql: s.sql, args: (s.args || []).map(toValue) },
  }));
  requests.push({ type: 'close' });

  const res = await fetch(`${DB_URL}/v3/pipeline`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${AUTH_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ requests }),
  });
  if (!res.ok) throw new Error(`Turso batch ${res.status}: ${await res.text()}`);
  const data: TursoResponse = await res.json();
  return data.results
    .filter((r) => r.type === 'ok' && r.response?.result)
    .map((r) => toObjects(r.response!.result!));
}

/** Convert JS values to Turso wire format */
function toValue(v: any): { type: string; value?: string } {
  if (v === null || v === undefined) return { type: 'null' };
  if (typeof v === 'number') {
    return Number.isInteger(v)
      ? { type: 'integer', value: String(v) }
      : { type: 'float', value: String(v) };
  }
  return { type: 'text', value: String(v) };
}
