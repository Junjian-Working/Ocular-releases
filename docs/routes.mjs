export const WINDOWS_URL='https://github.com/Junjian-Working/Ocular-releases/releases/latest/download/OcularSetup.exe';
export const RELEASE_API='https://api.github.com/repos/Junjian-Working/Ocular-releases/releases?per_page=100';
export const DOWNLOAD_ROOT='https://github.com/Junjian-Working/Ocular-releases/releases/download/';
export const METADATA_START='<!-- ocular-download-metadata\n';
export const METADATA_END='\n-->';
export function versionParts(version){
  if(typeof version!=='string'||!/^(0|[1-9]\d*)(\.(0|[1-9]\d*)){1,3}$/.test(version))return null;
  const parts=version.split('.').map(Number);
  return parts.every(n=>n<=65535)?[...parts,...Array(4-parts.length).fill(0)]:null;
}
export function newerVersion(a,b){
  const aa=versionParts(a),bb=versionParts(b);if(!aa)return false;if(!bb)return true;
  for(let i=0;i<4;i++){if(aa[i]!==bb[i])return aa[i]>bb[i];}return false;
}
export function suggestPlatform(userAgent='') {
  if (/CrOS/i.test(userAgent)) return 'chromeos';
  if (/Windows/i.test(userAgent)) return 'windows';
  return null;
}
export function installationRoute(metadata, choice) {
  if (!['windows','chromeos'].includes(choice) || metadata?.schema!==1) return null;
  const edition=metadata[choice];
  if (edition?.available!==true) return null;
  if (choice==='windows' && edition.url===WINDOWS_URL && edition.route==='windows-installer') return edition.url;
  const version=versionParts(edition.version);
  if(choice==='windows'&&version&&edition.route==='windows-installer'&&edition.qualification==='locally-tested-personal-preview'&&
     edition.preview===true&&edition.recipient_verified===false&&edition.url===`${DOWNLOAD_ROOT}v${edition.version}/OcularSetup.exe`)return edition.url;
  if(choice==='chromeos'&&version&&edition.route==='manual-unpacked-preview'&&edition.qualification==='locally-tested-personal-preview'&&
     edition.preview===true&&edition.chromeos_device_verified===false&&edition.automatic_updates===false&&
     (edition.translation_verified===false||(edition.translation_verified===true&&edition.translation_engine==='bundled-local-onnx'&&edition.translation_browser_verified===true))&&edition.extension_id==='knohkkldikfmlbncckoondlcppfcoiie'&&
     edition.url===`${DOWNLOAD_ROOT}extension-v${edition.version}-manual-preview/Ocular-ChromeOS-${edition.version}.zip`)return edition.url;
  if (choice==='chromeos' && edition.route==='manual-unpacked' &&
      edition.qualification==='desktop-browser-tested-manual-edition' &&
      edition.automatic_updates===false && edition.chromeos_device_verified===false &&
      edition.extension_id==='knohkkldikfmlbncckoondlcppfcoiie' &&
      /^\d+(?:\.\d+){0,3}$/.test(edition.version||'') &&
      edition.url===`https://github.com/Junjian-Working/Ocular-releases/releases/download/extension-v${edition.version}-manual/Ocular-ChromeOS-${edition.version}.zip`) return edition.url;
  if (choice==='chromeos' && edition.route==='verified-private-play' && edition.verified===true &&
      edition.url==='https://play.google.com/apps/testing/app.ocular.desktop') return edition.url;
  if(choice==='chromeos'&&edition.verified===true&&/^[a-p]{32}$/.test(edition.extension_id||'')){
    if(edition.route==='verified-chrome-web-store'&&edition.url==='https://chromewebstore.google.com/detail/ocular/'+edition.extension_id)return edition.url;
    if(edition.route==='verified-managed-chrome'&&edition.url?.startsWith('https://'))return edition.url;
  }
  return null;
}

export function latestPublishedDownloads(baseline,releases){
  // Data only, from the fixed public repository. No cookies, executable code,
  // arbitrary download origins, draft releases or cross-platform substitution.
  let result={...baseline};
  if(!Array.isArray(releases))throw Error('Invalid releases response');
  for(const release of releases){
    if(release.draft||typeof release.body!=='string')continue;
    const start=release.body.indexOf(METADATA_START);if(start<0)continue;
    const finish=release.body.indexOf(METADATA_END,start+METADATA_START.length);
    if(finish<0||finish-start>20000)continue;
    try{
      const data=JSON.parse(release.body.slice(start+METADATA_START.length,finish));
      const choice=data.edition,edition=data.metadata;
      if(data.schema!==1||!['windows','chromeos'].includes(choice)||!edition||!versionParts(edition.version))continue;
      const probe={schema:1,[choice]:edition};if(!installationRoute(probe,choice))continue;
      const tag=choice==='windows'?`v${edition.version}`:`extension-v${edition.version}-manual${edition.route==='manual-unpacked-preview'?'-preview':''}`;
      const name=choice==='windows'?'OcularSetup.exe':`Ocular-ChromeOS-${edition.version}.zip`;
      const asset=release.assets?.find(a=>a.name===name&&a.state==='uploaded');
      if(release.tag_name!==tag||!asset||asset.browser_download_url!==edition.url||
         !/^[a-f0-9]{64}$/.test(edition.sha256||'')||asset.digest!=='sha256:'+edition.sha256||asset.size!==edition.bytes)continue;
      if(!['title','button','requirements','notice','verification'].every(k=>typeof edition[k]==='string'&&edition[k].length<=5000)||
         !Array.isArray(edition.steps)||edition.steps.length>15||!edition.steps.every(s=>typeof s==='string'&&s.length<=2000))continue;
      if(newerVersion(edition.version,result[choice]?.version))result={...result,[choice]:edition};
    }catch{/* A malformed release cannot replace a known working download. */}
  }
  return result;
}
