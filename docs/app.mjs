import {suggestPlatform, installationRoute} from './routes.mjs';
const byId=id=>document.getElementById(id);
const suggestion=suggestPlatform(navigator.userAgent);
if (suggestion) byId('suggest-'+suggestion).hidden=false;
let metadata;
function display(choice) {
  if (!metadata || !['windows','chromeos'].includes(choice)) return;
  const edition=metadata[choice];
  byId('edition-title').textContent=edition.title;
  byId('edition-version').textContent=edition.version ? 'Version '+edition.version : '';
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
