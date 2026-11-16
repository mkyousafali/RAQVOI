import { randomBytes,createHash } from 'node:crypto';
const digest=value=>createHash('sha256').update(value).digest('hex');
export class GoogleFlows {
 constructor(clock=Date.now){this.clock=clock;this.pending=new Map();}
 begin(){
  this.prune();if(this.pending.size>=5000)throw new Error('Too many pending sign-ins');
  const browser=randomBytes(32).toString('base64url'),verifier=randomBytes(48).toString('base64url');
  this.pending.set(digest(browser),{verifier,until:this.clock()+600000});
  return {browser,challenge:createHash('sha256').update(verifier).digest('base64url')};
 }
 take(browser){const key=digest(browser||'');const flow=this.pending.get(key);this.pending.delete(key);return flow&&flow.until>this.clock()?flow:null;}
 prune(){for(const [k,v] of this.pending)if(v.until<=this.clock())this.pending.delete(k);}
}
