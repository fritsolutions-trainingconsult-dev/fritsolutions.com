/* Shared helpers: Firebase (Firestore + Auth) loader and safe mini-Markdown renderer.
   Exposes a tiny query API used by index.html, blog.html and admin.html. */
(function(){
var c=window.FRIT_CONFIG||{},B='https://www.gstatic.com/firebasejs/10.14.1/';
window.FRIT_DB={client:null,ready:Promise.resolve(null)};
function load(u){return new Promise(function(res,rej){var s=document.createElement('script');s.src=u;s.onload=res;s.onerror=rej;document.head.appendChild(s)})}
function iso(v){return v&&typeof v.toDate==='function'?v.toDate().toISOString():v}
function err(e){var m=e&&e.code==='permission-denied'?'Permission denied. Make sure you are signed in as an admin and your Firestore rules are published.':(e&&e.message)||'Something went wrong.';return {data:null,error:{message:m}}}
function clean(o){var r={};Object.keys(o).forEach(function(k){if(o[k]!==undefined)r[k]=o[k]});return r}
function Q(fs,t){this.fs=fs;this.t=t;this.f=[];this.o=[];this.l=null;this.m='select'}
var P=Q.prototype;
P.select=function(){this.m='select';return this};
P.order=function(k,o){this.o.push([k,!(o&&o.ascending===false)]);return this};
P.eq=function(k,v){this.f.push([k,v]);return this};
P.limit=function(n){this.l=n;return this};
P.insert=function(r){this.m='insert';this.rows=r;return this};
P.update=function(v){this.m='update';this.val=v;return this};
P.delete=function(){this.m='delete';return this};
P.then=function(a,b){return this.run().then(a,b)};
P.run=function(){
  var self=this,col=this.fs.collection(this.t);
  try{
    if(this.m==='insert')return Promise.all(this.rows.map(function(r){var d=clean(r);
      if(self.t==='registrations'||self.t==='messages'){d.status=d.status||'new';d.source=d.source||'website'}
      d.created_at=firebase.firestore.FieldValue.serverTimestamp();return col.add(d)}))
      .then(function(refs){return {data:refs.map(function(x){return {id:x.id}}),error:null}},err);
    if(this.m==='update'||this.m==='delete'){
      var id=(this.f.filter(function(x){return x[0]==='id'})[0]||[])[1];
      if(!id)return Promise.resolve(err({message:'Missing item id.'}));
      var ref=col.doc(id);
      return (this.m==='update'?ref.update(clean(this.val)):ref.delete()).then(function(){return {data:null,error:null}},err);
    }
    var q=col;this.f.forEach(function(x){q=q.where(x[0],'==',x[1])});
    return q.get().then(function(s){
      var rows=s.docs.map(function(d){var o=d.data();Object.keys(o).forEach(function(k){o[k]=iso(o[k])});o.id=d.id;return o});
      rows.sort(function(a,b){for(var i=0;i<self.o.length;i++){var k=self.o[i][0],up=self.o[i][1],x=a[k],y=b[k];
        if(x==null&&y==null)continue;if(x==null)return 1;if(y==null)return -1;if(x<y)return up?-1:1;if(x>y)return up?1:-1}return 0});
      if(self.l)rows=rows.slice(0,self.l);
      return {data:rows,error:null}},err);
  }catch(e){return Promise.resolve(err(e))}
};
if(c.apiKey&&c.projectId&&!/YOUR_/.test(c.apiKey+c.projectId)){
  window.FRIT_DB.ready=load(B+'firebase-app-compat.js')
    .then(function(){return window.FRIT_AUTH?load(B+'firebase-auth-compat.js'):0})
    .then(function(){return load(B+'firebase-firestore-compat.js')})
    .then(function(){
      firebase.initializeApp(c);
      var fs=firebase.firestore(),au=window.FRIT_AUTH?firebase.auth():null;
      var db={
        from:function(t){return new Q(fs,t)},
        auth:au?{
          getSession:function(){return new Promise(function(res){var u=au.onAuthStateChanged(function(x){u();res({data:{session:x?{user:x}:null}})})})},
          signInWithPassword:function(o){return au.signInWithEmailAndPassword(o.email,o.password).then(function(){return {error:null}},function(e){
            var m=/invalid-credential|wrong-password|user-not-found|invalid-email/.test(e.code)?'Incorrect email or password.':/too-many/.test(e.code)?'Too many attempts. Please wait a few minutes and try again.':e.message;return {error:{message:m}}})},
          signOut:function(){return au.signOut()}
        }:null,
        listen:function(t,cb){
          return fs.collection(t).onSnapshot(function(s){
            var rows=s.docs.map(function(d){var o=d.data({serverTimestamps:'estimate'});Object.keys(o).forEach(function(k){o[k]=iso(o[k])});o.id=d.id;return o});
            rows.sort(function(a,b){return a.created_at<b.created_at?1:(a.created_at>b.created_at?-1:0)});
            cb(rows,null)},function(e){cb([],err(e).error)})},
        rpc:function(n){
          if(n!=='is_admin'||!au||!au.currentUser)return Promise.resolve({data:false,error:null});
          return fs.doc('admins/'+au.currentUser.uid).get().then(function(d){return {data:d.exists,error:null}},function(){return {data:false,error:null}})}
      };
      FRIT_DB.client=db;return db})
    .catch(function(){return null});
}
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(m){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]})}
function inl(s){
  s=esc(s);
  s=s.replace(/!\[([^\]]*)\]\((https?:\/\/[^\s)]+)\)/g,'<img src="$2" alt="$1" loading="lazy" referrerpolicy="no-referrer">');
  s=s.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,'<a href="$2" target="_blank" rel="noopener">$1</a>');
  s=s.replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>').replace(/\*(.+?)\*/g,'<em>$1</em>');
  return s;
}
/* Supports: ## headings, - lists, > quotes, **bold**, *italic*, [links](https://...), ![images](https://...) */
window.FRIT_MD=function(t){
  var out=[];
  String(t||'').split(/\n{2,}/).forEach(function(b){
    b=b.trim(); if(!b)return;
    var m=b.match(/^(#{1,3}) (.*)/);
    if(m){var lv=Math.max(2,m[1].length);out.push('<h'+lv+'>'+inl(m[2])+'</h'+lv+'>');}
    else if(/^(- |\* )/.test(b)){out.push('<ul>'+b.split('\n').map(function(l){return '<li>'+inl(l.replace(/^(- |\* )/,''))+'</li>'}).join('')+'</ul>');}
    else if(/^> /.test(b)){out.push('<blockquote>'+inl(b.replace(/^> ?/gm,''))+'</blockquote>');}
    else out.push('<p>'+inl(b).replace(/\n/g,'<br>')+'</p>');
  });
  return out.join('');
};
})();
