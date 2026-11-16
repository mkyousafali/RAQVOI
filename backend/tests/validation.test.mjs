import { test } from 'node:test';
import assert from 'node:assert/strict';
import { profileInput, emailInput } from '../validation.mjs';
const now=new Date('2026-11-16T12:00:00Z');
const good={name:'Test Customer',whatsapp:'+919876543210',dateOfBirth:'2000-01-01'};
test('valid profile and email normalize',()=>{assert.equal(profileInput({...good,name:' Test Customer '},now).name,'Test Customer');assert.equal(emailInput(' Test@example.com '),'test@example.com');});
test('birthday boundary allows exactly ten, not one day younger',()=>{assert.doesNotThrow(()=>profileInput({...good,dateOfBirth:'2016-11-16'},now));assert.throws(()=>profileInput({...good,dateOfBirth:'2016-11-17'},now));});
test('reject calendar rollover, future, missing fields, controls and role injection',()=>{for(const value of [{...good,dateOfBirth:'2000-02-30'},{...good,dateOfBirth:'2030-01-01'},{...good,name:'a\u0000b'},{...good,whatsapp:'9876543210'},{...good,role:'admin'},{...good,user_id:'forged'},{name:'Only name'}])assert.throws(()=>profileInput(value,now));});
