export type AdminAccess = { isOwner: boolean; permissions: { admins: boolean; customers: boolean } };

export async function adminApi<T>(path: string, method = 'GET', data?: unknown): Promise<T> {
 const response = await fetch('/api/admin/' + path, {
  method,
  credentials: 'same-origin',
  cache: 'no-store',
  headers: { 'Content-Type': 'application/json', 'X-RAQVOI-Request': '1' },
  body: data === undefined ? undefined : JSON.stringify(data)
 });
 const result = await response.json().catch(() => ({ error: 'Admin service is unavailable. Please try again.' }));
 if (!response.ok) throw new Error(result.error || 'Please try again.');
 return result;
}
