<script lang="ts">
 let { code = $bindable(''), disabled = false, label = 'Six-digit code' }: {
  code?: string;
  disabled?: boolean;
  label?: string;
 } = $props();

 let group: HTMLDivElement;
 const digits = $derived(Array.from({ length: 6 }, (_, index) => /\d/.test(code[index] || '') ? code[index] : ''));

 function focus(index: number) {
  const input = group?.querySelectorAll('input')[Math.max(0, Math.min(5, index))];
  input?.focus();
  input?.select();
 }

 function insert(value: string, index: number) {
  const incoming = value.replace(/\D/g, '').slice(0, 6);
  if (!incoming) {
   const next = [...digits];
   next[index] = '';
   code = next.map(digit => digit || ' ').join('').trimEnd();
   return;
  }
  const start = incoming.length === 6 ? 0 : index;
  const next = [...digits];
  for (let offset = 0; offset < incoming.length && start + offset < 6; offset++) next[start + offset] = incoming[offset];
  code = next.map(digit => digit || ' ').join('').trimEnd();
  focus(Math.min(5, start + incoming.length));
 }

 function keydown(event: KeyboardEvent, index: number) {
  if (event.key === 'Backspace' && !digits[index] && index > 0) {
   event.preventDefault();
   insert('', index - 1);
   focus(index - 1);
  } else if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
   event.preventDefault();
   focus(index + (event.key === 'ArrowLeft' ? -1 : 1));
  }
 }
</script>

<fieldset class="code-field" {disabled}>
 <legend>{label}</legend>
 <div class="code-boxes" bind:this={group}>
  {#each digits as digit, index}
   <input
    type="password"
    aria-label={`${label}, digit ${index + 1} of 6`}
    inputmode="numeric"
    autocomplete={index === 0 ? 'one-time-code' : 'off'}
    pattern="[0-9]"
    maxlength="6"
    required
    value={digit}
    onfocus={(event) => event.currentTarget.select()}
    oninput={(event) => { insert(event.currentTarget.value, index); event.currentTarget.value = digits[index]; }}
    onkeydown={(event) => keydown(event, index)}
    onpaste={(event) => { event.preventDefault(); insert(event.clipboardData?.getData('text') || '', index); }}
   />
  {/each}
 </div>
</fieldset>

<style>
 .code-field{display:block;width:100%;min-width:0;margin:0;padding:0;border:0}
 .code-field legend{float:none;display:block;width:100%;margin-bottom:10px;padding:0;color:#344e40;font-size:12px;font-weight:700;text-align:center}
 .code-boxes{clear:both;display:grid;width:100%;grid-template-columns:repeat(6,minmax(0,1fr));gap:9px;max-width:360px;margin-inline:auto}
 .code-boxes input{display:block;width:100%;min-width:0;height:53px;padding:0;border:1px solid #cbbf9f;border-radius:9px;background:#fff;color:#244336;font:700 24px/1 'DM Sans',Arial,sans-serif;text-align:center;caret-color:#a57c22;font-variant-numeric:tabular-nums;box-shadow:0 2px 5px #38280806}
 .code-boxes input:focus{border-color:#b78b24;outline:2px solid #b78b2438;outline-offset:2px;box-shadow:0 3px 12px #b78b241a}
 .code-field:disabled{opacity:.65}
 @media(max-width:400px){.code-boxes{gap:6px}.code-boxes input{height:47px;font-size:21px;border-radius:7px}}
</style>
