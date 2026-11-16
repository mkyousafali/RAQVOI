import { writable } from 'svelte/store';
export type Profile = { name: string; whatsapp: string; dateOfBirth: string };
export type CustomerSession = { email: string | null; profile: Profile | null; adminState: 'pending' | 'active' | null };
export const customerSession = writable<CustomerSession>({ email: null, profile: null, adminState: null });
export async function customerApi<T>(path: string, method = 'GET', data?: unknown): Promise<T> {
 const response = await fetch('/api/customer/' + path, {method,credentials:'same-origin',cache:'no-store',headers:{'Content-Type':'application/json','X-RAQVOI-Request':'1'},body:data===undefined?undefined:JSON.stringify(data)});
 const result=await response.json().catch(()=>({error:'Account service is unavailable. Please try again.'}));
 if(!response.ok)throw new Error(result.error||'Please try again.');return result;
}
