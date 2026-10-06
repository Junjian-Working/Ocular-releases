export const WINDOWS_URL='https://github.com/Junjian-Working/Ocular-releases/releases/latest/download/OcularSetup.exe';
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
