export function profileInput(input, now = new Date()) {
  if (!input || typeof input !== 'object' || Object.keys(input).some(k => !['name','whatsapp','dateOfBirth'].includes(k))) throw new Error('Only profile fields may be changed.');
  const { name, whatsapp, dateOfBirth } = input;
  if (typeof name !== 'string' || name.trim().length < 2 || name.trim().length > 80 || /[\p{Cc}\p{Cf}]/u.test(name)) throw new Error('Enter a name between 2 and 80 characters.');
  if (typeof whatsapp !== 'string' || !/^\+[1-9]\d{7,14}$/.test(whatsapp)) throw new Error('Enter your WhatsApp number with country code, for example +919876543210.');
  if (typeof dateOfBirth !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(dateOfBirth)) throw new Error('Enter a valid date of birth.');
  const birth = new Date(dateOfBirth + 'T00:00:00Z');
  if (!Number.isFinite(birth.getTime()) || birth.toISOString().slice(0,10) !== dateOfBirth) throw new Error('Enter a valid date of birth.');
  const today = now.toISOString().slice(0,10);
  const age = Number(today.slice(0,4)) - birth.getUTCFullYear() - (today.slice(5) < dateOfBirth.slice(5) ? 1 : 0);
  if (age < 10 || age > 120) throw new Error('You must be at least 10 years old. Check your date of birth.');
  return { name: name.trim(), whatsapp, dateOfBirth };
}
export function emailInput(value) {
  if (typeof value !== 'string' || value.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) throw new Error('Enter a valid email address.');
  return value.trim().toLowerCase();
}
