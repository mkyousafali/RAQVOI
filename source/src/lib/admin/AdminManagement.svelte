<script lang="ts">
 import { onMount } from 'svelte';
 import { MailPlus, UsersRound, X } from 'lucide-svelte';
 import { adminApi } from '../admin';

 type Member = { id: string; email: string; status: 'invited'|'pending'|'active'|'disabled'|'expired'|'cancelled'; kind: 'member'|'invitation'; self: boolean; createdAt: string; expiresAt?: string; lastLoginAt?: string | null; isOwner?:boolean; permissions?:{admins:boolean;customers:boolean} };
 let members = $state<Member[]>([]);
 let email = $state('');
 let loading = $state(true);
 let busy = $state(false);
 let error = $state('');
 let message = $state('');
 let confirmation = $state<Member | null>(null);
 let isOwner = $state(false);
 let filter = $state('');
 let tab = $state<'invite' | 'manage'>('invite');
 const dateTime = (value?: string | null) => value ? new Date(value).toLocaleString('en-IN', {dateStyle:'medium',timeStyle:'short'}) : 'Not recorded';
 const visible = $derived(members.filter(member => member.email.toLowerCase().includes(filter.toLowerCase())));

 async function refresh() {
  loading = true;
  try { const result=await adminApi<{members:Member[];isOwner:boolean}>('members'); members=result.members; isOwner=result.isOwner; }
  catch(e) { error = e instanceof Error ? e.message : 'Could not load Admins.'; }
  finally { loading = false; }
 }
 onMount(() => { void refresh(); });
 async function invite(event?: SubmitEvent, address = email) {
  event?.preventDefault();
  if (busy) return;
  busy = true; error = ''; message = '';
  try {
   const result = await adminApi<{emailSent:boolean}>('invitations','POST',{email:address});
   message = result.emailSent
    ? 'Invitation sent. They can sign in with this email and set up their Admin access.'
    : 'Invitation saved, but the email could not be sent. Ask them to sign in with this email and select Set up Admin access, or resend the invitation.';
   email = '';
   await refresh();
  } catch(e) { error = e instanceof Error ? e.message : 'Could not invite this Admin.'; }
  finally { busy = false; }
 }
 async function changeAccess() {
  if (!confirmation || busy) return;
  const member = confirmation;
  busy = true; error = ''; message = '';
  try {
   await adminApi('members/action','POST',{id:member.id,action:member.kind==='invitation'?'cancel':member.status==='disabled'?'enable':'disable'});
   confirmation = null;
   message = member.kind === 'invitation' ? 'Invitation cancelled.' : member.status==='disabled'?'Admin access enabled.':'Admin access disabled.';
   await refresh();
  } catch(e) { error = e instanceof Error ? e.message : 'Could not update Admin access.'; }
  finally { busy = false; }
 }
 async function updatePermissions(member:Member, key:'admins'|'customers', value:boolean) {
  if(busy || !isOwner || member.isOwner) return;
  busy=true; error=''; message='';
  const next={admins:!!member.permissions?.admins,customers:!!member.permissions?.customers,[key]:value};
  try {
   await adminApi('members/action','POST',{id:member.id,action:'permissions',...next});
   message='Admin permissions updated.';
   await refresh();
  } catch(e) { error=e instanceof Error?e.message:'Could not update permissions.'; }
  finally { busy=false; }
 }
 const statusLabel = (status: Member['status']) => status === 'pending' ? 'Setup pending' : status.charAt(0).toUpperCase()+status.slice(1);
</script>

<div class="management" aria-busy={busy || loading}>
 <div class="tabs" role="group" aria-label="Admin management sections">
  <button class:chosen={tab==='invite'} aria-pressed={tab==='invite'} onclick={() => tab='invite'}><MailPlus size={16}/>Invite Admin</button>
  <button class:chosen={tab==='manage'} aria-pressed={tab==='manage'} onclick={() => tab='manage'}><UsersRound size={16}/>Manage Admins</button>
 </div>
 {#if error}<p class="notice error" role="alert">{error}</p>{/if}
 {#if message}<p class="notice success" role="status">{message}</p>{/if}
 {#if tab === 'invite'}
 <div class="invite-area">
 <form class="invite-form" onsubmit={invite}>
  <label for="admin-invite-email">Invite an Admin by email</label>
  <div class="invite-row"><input id="admin-invite-email" type="email" autocomplete="off" maxlength="254" required placeholder="name@example.com" bind:value={email} disabled={busy}/><button class="primary" disabled={busy}><MailPlus size={16}/>{busy ? 'Please wait…' : 'Send invitation'}</button></div>
  <p>Invitations last 7 days. New Admins set their own password and Google Authenticator. The Owner chooses which sections they can access.</p>
 </form>
 </div>
 {:else}
 {#if confirmation}
  <div class="confirm" role="alertdialog" aria-label="Confirm Admin access change"><strong>{confirmation.kind==='invitation'?'Cancel invitation?':confirmation.status==='disabled'?'Enable Admin access?':'Deactivate Admin access?'}</strong><p>{confirmation.email}{confirmation.kind==='invitation'?' will no longer be able to accept this invitation.':confirmation.status==='disabled'?' will regain Admin access with their assigned permissions.':' will lose access to the Admin panel. Their customer account will remain available.'}</p><div><button class="danger" onclick={changeAccess} disabled={busy}>Confirm</button><button class="secondary" onclick={() => confirmation=null} disabled={busy}>Cancel</button></div></div>
 {/if}
 <div class="search-toolbar"><input type="search" aria-label="Search Admin email" placeholder="Search email…" bind:value={filter}/></div>
 {#if loading}<p class="empty" role="status">Loading Admins…</p>
 {:else if !visible.length}<p class="empty">{filter ? 'No matching Admins.' : 'No Admins or invitations found.'}</p>
 {:else}
  <div class="table-scroll"><table>
   <thead><tr><th scope="col">No.</th><th scope="col">Admin email</th><th scope="col">Status</th><th scope="col">Added date &amp; time</th><th scope="col">Last Admin login</th>{#if isOwner}<th scope="col">Section access</th><th scope="col">Admin enabled</th>{/if}<th scope="col">Actions</th></tr></thead>
   <tbody>{#each visible as member, index (member.kind + member.id)}
    <tr><td>{index + 1}</td><td class="email-cell"><strong>{member.email}</strong>{#if member.isOwner}<span class="you owner-badge">Owner</span>{/if}{#if member.self}<span class="you">You</span>{/if}{#if member.status==='invited' && member.expiresAt}<small>Expires {dateTime(member.expiresAt)}</small>{/if}</td>
     <td><span class="status" class:active={member.status==='active'}>{statusLabel(member.status)}</span></td>
     <td class="date-cell">{dateTime(member.createdAt)}</td>
     <td class="date-cell">{member.kind==='invitation' ? 'Not signed in' : dateTime(member.lastLoginAt)}</td>
     {#if isOwner}
      <td>{#if member.isOwner}<span class="muted">All sections</span>{:else if member.kind==='member'}<div class="permissions"><label><input type="checkbox" checked={!!member.permissions?.admins} disabled={busy} aria-label={'Admin management access for '+member.email} onchange={(event)=>void updatePermissions(member,'admins',event.currentTarget.checked)}/>Admin management</label><label><input type="checkbox" checked={!!member.permissions?.customers} disabled={busy} aria-label={'Customers access for '+member.email} onchange={(event)=>void updatePermissions(member,'customers',event.currentTarget.checked)}/>Customers</label></div>{:else}<span class="muted">After acceptance</span>{/if}</td>
      <td>{#if member.isOwner}<span class="muted">Protected</span>{:else if member.kind==='member'}<button class="access-switch" class:enabled={member.status!=='disabled'} role="switch" aria-checked={member.status!=='disabled'} aria-label={'Admin access for '+member.email} title={member.status==='disabled'?'Enable Admin access':'Deactivate Admin access'} disabled={busy} onclick={()=>confirmation=member}><span></span></button>{/if}</td>
     {/if}
     <td><div class="member-actions">
      {#if member.kind==='invitation' && member.status!=='cancelled'}<button class="secondary small" disabled={busy} onclick={() => void invite(undefined,member.email)}><MailPlus size={13}/>Resend</button>{/if}
      {#if member.kind==='invitation' && member.status==='invited'}<button class="remove" aria-label={'Cancel invitation for '+member.email} title="Cancel invitation" disabled={busy} onclick={() => confirmation=member}><X size={16}/></button>{/if}
      {#if member.self}<span class="muted">Current account</span>{/if}
     </div></td>
    </tr>
   {/each}</tbody>
  </table></div>
 {/if}
 {/if}
</div>

<style>
 .management{padding:8px 22px 22px;color:#29483d;font-family:'DM Sans',Arial,sans-serif;font-size:12px}button{display:inline-flex;align-items:center;justify-content:center;gap:7px;cursor:pointer}button:disabled{opacity:.5;cursor:wait}.remove{width:33px;height:33px;border:1px solid #d6e1da;border-radius:7px;background:#fff;color:#446456;flex:none}.invite-form{padding:16px;border:1px solid #d8e4da;border-radius:10px;background:#f1f6f2}.invite-form label{display:block;margin-bottom:8px;font-size:12px;font-weight:700}.invite-row{display:flex;gap:8px}input{min-width:0;padding:9px 11px;border:1px solid #cbd9cd;border-radius:7px;background:#fff;color:#29483d;font:inherit}.invite-row input{flex:1}.primary,.secondary,.danger{min-height:35px;padding:8px 11px;border:1px solid transparent;border-radius:7px;font:600 11px/1.3 'DM Sans',Arial,sans-serif}.primary{background:#285441;color:#fff;white-space:nowrap}.secondary{border-color:#cad8ce;background:#fff;color:#3c5c4b}.danger{background:#7b2932;color:#fff}.invite-form p{margin:10px 0 0;color:#738274;font-size:10px;line-height:1.6}.notice{padding:12px;margin:14px 0;border-radius:7px;font-size:11px;line-height:1.6}.error{background:#fbeeed;color:#8b343a}.success{background:#eaf4ea;color:#315b3a}.confirm{margin:14px 0;padding:15px;border:1px solid #d8b8ae;border-radius:9px;background:#fcf4ef}.confirm p{margin:8px 0 12px;font-size:11px;line-height:1.5;overflow-wrap:anywhere}.confirm>div{display:flex;gap:8px}.you{display:inline-block;margin-left:6px;color:#6c8b72;font-size:9px}.status{padding:4px 7px;border-radius:20px;background:#f1eee5;color:#88774b;font-size:9px;white-space:nowrap}.status.active{background:#e6f2e7;color:#3b7148}.member-actions{display:flex;align-items:center;gap:5px}.small{min-height:28px;padding:5px 7px;font-size:9px}.remove{width:28px;height:28px;color:#94505a}.empty{padding:20px 0;color:#839184;font-size:12px}@media(max-width:550px){.management{padding:8px 15px 15px}.invite-row{flex-direction:column}.member-actions{margin-left:auto}}


 .tabs{display:flex;justify-content:flex-start;gap:6px;width:max-content;max-width:100%;margin:0 0 16px;padding:5px;border:1px solid #d8e4da;border-radius:11px;background:#edf3ee}.tabs button{min-height:38px;padding:9px 16px;border:1px solid transparent;border-radius:7px;background:transparent;color:#668070;font:600 12px/1.3 'DM Sans',Arial,sans-serif}.tabs button.chosen{border-color:#285441;background:#285441;color:#fff;box-shadow:0 3px 8px #28544125}
 .invite-area{display:flex;justify-content:center;padding:clamp(15px,5vh,50px) 0 25px}.invite-form{width:100%;max-width:480px;padding:26px;border-radius:13px}.invite-form label{font-size:15px;margin-bottom:15px}.invite-row{flex-direction:column;gap:12px}.invite-form p{margin-top:15px}.table-scroll{overflow:auto;border:1px solid #dce5df;border-radius:10px}table{margin:0;width:100%;min-width:680px;border-collapse:collapse;text-align:left;font-size:11px}th{padding:13px 14px;background:#edf4ef;color:#5b7664;font-size:10px;font-weight:700;white-space:nowrap}td{padding:15px 14px;border-top:1px solid #e1e9e2;vertical-align:middle}tbody tr:hover{background:#f6faf6}.email-cell{min-width:180px}.email-cell strong{overflow-wrap:anywhere}.email-cell small{display:block;margin-top:6px;color:#879488;font-size:9px}.date-cell{color:#647c6c;white-space:nowrap;font-size:10px}.muted{color:#93a095;font-size:9px;white-space:nowrap}

 .search-toolbar{display:flex;justify-content:flex-start;margin:16px 0;padding:0}
 .search-toolbar input{width:420px;max-width:100%;font-size:11px}
 @media(max-width:550px){.search-toolbar input{width:100%}}
 .permissions{display:grid;gap:8px;white-space:nowrap}.permissions label{display:flex;align-items:center;gap:7px;font-size:10px;color:#56705e}.permissions input{width:14px;height:14px;margin:0;padding:0;accent-color:#285441}.owner-badge{padding:3px 6px;border-radius:5px;background:#f1e7c9;color:#80631d;font-weight:700}.access-switch{display:flex;justify-content:flex-start;align-items:center;width:38px;height:22px;padding:3px;border:1px solid #c6cfca;border-radius:20px;background:#cfd7d1}.access-switch span{display:block;width:14px;height:14px;border-radius:50%;background:#fff;box-shadow:0 1px 3px #0002}.access-switch.enabled{justify-content:flex-end;border-color:#47775c;background:#47775c}
</style>
