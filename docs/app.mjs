import {suggestPlatform, installationRoute, latestPublishedDownloads, RELEASE_API} from './routes.mjs?v=af204184dcbd0b56';
const byId=id=>document.getElementById(id);
const suggestion=suggestPlatform(navigator.userAgent);
if (suggestion) byId('suggest-'+suggestion).hidden=false;
let metadata;
function display(choice) {
  if (!metadata || !['windows','chromeos'].includes(choice)) return;
  const edition=metadata[choice];
  byId('edition-title').textContent=edition.title;
  byId('edition-version').textContent=edition.version ? 'Version '+edition.version : '';
  byId('edition-status').textContent=edition.preview?'Latest personal preview':'Published edition';
  byId('edition-features').textContent=edition.features||'';
  byId('edition-features').hidden=!edition.features;
  byId('edition-requirements').textContent=edition.requirements;
  byId('edition-notice').textContent=edition.notice;
  byId('edition-steps').replaceChildren(...edition.steps.map(text=>{
    const item=document.createElement('li');item.textContent=text;return item;
  }));
  byId('edition-steps').hidden=edition.steps.length===0;
  byId('edition-verification').textContent=edition.verification;
  const link=byId('install-link'), route=installationRoute(metadata,choice);
  link.removeAttribute('href');link.hidden=!route;
  if (route) {link.href=route;link.textContent=edition.button;}
  const manual=!!route&&['manual-unpacked','manual-unpacked-preview'].includes(edition.route);
  byId('folder-help').hidden=!manual;
  byId('folder-path').textContent=manual ? `My files → Downloads → Ocular-ChromeOS-${edition.version} → Ocular` : '';
  byId('manual-links').hidden=!(route&&edition.guide_url);
  const packageName=choice==='windows'?'OcularSetup.exe':`Ocular-ChromeOS-${edition.version}.zip`;
  for(const [id,field,name]of [['guide-link','guide_url',choice==='windows'?'Read-me.txt':'Install-Ocular-ChromeOS.txt'],['checksums-link','checksums_url',choice==='windows'?'checksums.txt':'SHA256SUMS.txt']]){
    const target=byId(id);target.removeAttribute('href');
    if(route&&edition[field]===route.replace(packageName,name))target.href=edition[field];
  }
  byId('previous-downloads').href='https://github.com/Junjian-Working/Ocular-releases/releases';
  byId('unavailable').hidden=!!route;
  byId('installation').hidden=false;
  byId('choice-help').textContent='You can change your choice above.';
}
document.querySelectorAll('input[name=platform]').forEach(input=>input.addEventListener('change',()=>display(input.value)));
try {
  const response=await fetch('release.json',{cache:'no-store'});
  if (!response.ok) throw new Error('Release metadata unavailable');
  metadata=await response.json();
  if (metadata.schema!==1 || !metadata.windows || !metadata.chromeos) throw new Error('Invalid release metadata');
  const selected=document.querySelector('input[name=platform]:checked');
  if (selected) display(selected.value);
} catch {
  byId('loading-error').hidden=false;
  document.querySelectorAll('input[name=platform]').forEach(input=>input.disabled=true);
}
async function refreshLatest(){
  if(!metadata)return;
  try{
    const response=await fetch(RELEASE_API,{cache:'no-store',credentials:'omit',signal:AbortSignal.timeout(8000),headers:{Accept:'application/vnd.github+json'}});
    if(!response.ok)throw Error('Latest releases unavailable');
    metadata=latestPublishedDownloads(metadata,await response.json());
    byId('release-status').textContent='Showing the newest published builds for each edition.';
    const selected=document.querySelector('input[name=platform]:checked');if(selected)display(selected.value);
  }catch{byId('release-status').textContent='Showing the latest saved downloads. A live version check is temporarily unavailable.';}
}
await refreshLatest();
let lastCheck=Date.now();
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&Date.now()-lastCheck>60000){lastCheck=Date.now();refreshLatest();}});
