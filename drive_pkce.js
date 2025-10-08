/* drive_pkce.js - OAuth2 PKCE Google Drive integration */
const DrivePKCE = (function(){
  const CONFIG = {
    client_id: "253249814475-79vie8d9ovh5evmh6ra69q01ot8g5rd6.apps.googleusercontent.com",
    redirect_uri: "https://webintoapp.com",
    scope: "https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/drive.metadata.readonly",
    auth_endpoint: "https://accounts.google.com/o/oauth2/v2/auth",
    token_endpoint: "https://oauth2.googleapis.com/token",
    backupFolderName: "KelulutApp_Backup"
  };
  function base64urlencode(str){ return btoa(String.fromCharCode.apply(null, new Uint8Array(str))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,''); }
  async function sha256(buf){ return crypto.subtle.digest("SHA-256", new TextEncoder().encode(buf)); }
  let code_verifier = null;
  function saveTokens(obj){ localStorage.setItem("kelulut_drive_tokens", JSON.stringify(obj)); }
  function loadTokens(){ const s = localStorage.getItem("kelulut_drive_tokens"); return s?JSON.parse(s):null; }
  async function initiateAuth(){
    code_verifier = Array.from(crypto.getRandomValues(new Uint8Array(32))).map(x=>('0'+x.toString(16)).slice(-2)).join('');
    const challenge = base64urlencode(await sha256(code_verifier));
    const url = new URL(CONFIG.auth_endpoint);
    url.searchParams.set("client_id", CONFIG.client_id);
    url.searchParams.set("redirect_uri", CONFIG.redirect_uri);
    url.searchParams.set("response_type", "code");
    url.searchParams.set("scope", CONFIG.scope);
    url.searchParams.set("access_type","offline");
    url.searchParams.set("prompt","consent");
    url.searchParams.set("code_challenge", challenge);
    url.searchParams.set("code_challenge_method","S256");
    window.location.href = url.toString();
  }
  async function handleAuthCallback(){
    const params = new URLSearchParams(window.location.search);
    if(params.has("code")){
      const code = params.get("code");
      try{
        const body = new URLSearchParams();
        body.set("code", code);
        body.set("client_id", CONFIG.client_id);
        body.set("redirect_uri", CONFIG.redirect_uri);
        body.set("grant_type", "authorization_code");
        body.set("code_verifier", code_verifier);
        const resp = await fetch(CONFIG.token_endpoint, {
          method:"POST", headers:{"Content-Type":"application/x-www-form-urlencoded"}, body: body.toString()
        });
        const data = await resp.json();
        if(data.access_token){
          saveTokens(data);
          window.history.replaceState({}, document.title, window.location.pathname);
          showBackupButton();
          alert("Google Drive connected successfully.");
        } else {
          console.error("Token exchange failed", data);
          alert("Token exchange failed. See console.");
        }
      }catch(err){ console.error(err); alert("Error exchanging token. See console."); }
    } else { if(loadTokens()) showBackupButton(); }
  }
  function showBackupButton(){ const b=document.getElementById("btnBackupNow"); const c=document.getElementById("btnConnectDrive"); if(b) b.style.display="inline-block"; if(c) c.style.display="none"; }
  async function ensureBackupFolder(){
    const tokens=loadTokens(); if(!tokens) throw new Error("Not connected");
    const q=encodeURIComponent(`name='${CONFIG.backupFolderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`);
    const url=`https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id,name)`;
    const resp=await fetch(url,{headers:{"Authorization":"Bearer "+tokens.access_token}});
    const j=await resp.json();
    if(j.files && j.files.length>0) return j.files[0].id;
    const create=await fetch("https://www.googleapis.com/drive/v3/files",{method:"POST",headers:{"Authorization":"Bearer "+tokens.access_token,"Content-Type":"application/json"},body:JSON.stringify({name:CONFIG.backupFolderName,mimeType:"application/vnd.google-apps.folder"})});
    const created=await create.json();
    return created.id;
  }
  async function fetchFileAsBlob(path){ try{ const resp=await fetch(path); if(!resp.ok) throw new Error("fetch fail "+path); return await resp.blob(); }catch(e){ console.warn("skip",path,e); return null; } }
  const backupPaths=["data/database.xlsx","data/database.csv","data/images/","storage/"];
  async function enumerateFiles(){ const out=[]; for(const p of backupPaths){ if(p.endsWith("/")){const common=["database.xlsx","database.csv","export.csv"]; for(const c of common){ const b=await fetchFileAsBlob(p+c); if(b) out.push({path:p+c,name:c}); }} else { const b=await fetchFileAsBlob(p); if(b) out.push({path:p,name:p.split('/').pop()}); }} return out; }
  async function uploadFile(filename,blob,folderId){ const tokens=loadTokens(); if(!tokens) throw new Error("Not connected"); const metadata={name:filename,parents:[folderId]}; const form=new FormData(); form.append("metadata", new Blob([JSON.stringify(metadata)],{type:"application/json"})); form.append("file", blob); const resp=await fetch("https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id",{method:"POST",headers:{"Authorization":"Bearer "+tokens.access_token},body:form}); return await resp.json(); }
  async function backupAllFiles(){ try{ document.getElementById("btnBackupNow").innerText="Backing..."; const folderId=await ensureBackupFolder(); const files=await enumerateFiles(); for(const f of files){ const b=await fetchFileAsBlob(f.path); if(b) await uploadFile(f.name,b,folderId);} alert("Backup complete to "+CONFIG.backupFolderName); }catch(e){console.error(e);alert("Backup fail "+e.message);} finally{document.getElementById("btnBackupNow").innerText="Backup Now";} }
  return {initiateAuth,handleAuthCallback,backupAllFiles};
})(); window.addEventListener("DOMContentLoaded",()=>DrivePKCE.handleAuthCallback());
