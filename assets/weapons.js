// Danh mục vũ khí CAMPUS STRIKE.
// Tên, giá, phe và ô mua theo menu Counter-Strike 1.6 — đúng bộ súng được liệt kê
// trong các weapon pack trên https://en.ds-servers.com/ (v_ / p_ / w_ ak47, m4a1, awp…).
// mesh và snd trỏ tới model procedural và tiếng local của dự án này.
// Không thay các mục này bằng file .mdl, .wad hay .wav của Valve.

const rifle = { cat: "rifles", cls: "rifle", snd: "rifle", mesh: "rifle", slot: 1, auto: true, pellets: 1, reload: 2.4, head: 3.6, clipCost: 80,
  spread: { base: .0016, inc: .0021, move: .028, air: .06 }, recoil: { v: .0165, h: .0085, max: .17, rec: 7 }, kick: { z: .045, rx: .075, bolt: .05 }, hip: [.125, -.15, -.33], tracer: .7 };
const smg = { cat: "smgs", cls: "rifle", snd: "smg", mesh: "smg", slot: 1, auto: true, pellets: 1, reload: 2.1, head: 3.2, clipCost: 40,
  spread: { base: .003, inc: .0016, move: .014, air: .04 }, recoil: { v: .0095, h: .006, max: .12, rec: 9 }, kick: { z: .03, rx: .05, bolt: .03 }, hip: [.12, -.135, -.3], tracer: .5 };
const pistol = { cat: "pistols", cls: "pistol", snd: "pistol", mesh: "pistol", slot: 2, auto: false, pellets: 1, reload: 1.7, head: 3.2, clipCost: 20,
  spread: { base: .0035, inc: .006, move: .016, air: .05 }, recoil: { v: .03, h: .006, max: .14, rec: 11 }, kick: { z: .03, rx: .22, bolt: .035 }, hip: [.085, -.095, -.33], tracer: .4 };
const deagle = { cat: "pistols", cls: "pistol", snd: "deagle", mesh: "deagle", slot: 2, auto: false, pellets: 1, reload: 2, head: 3.4, clipCost: 40,
  spread: { base: .004, inc: .012, move: .03, air: .07 }, recoil: { v: .055, h: .012, max: .2, rec: 8 }, kick: { z: .05, rx: .34, bolt: .04 }, hip: [.085, -.095, -.33], tracer: .5 };
const shot = { cat: "shotguns", cls: "shotgun", snd: "shotgun", mesh: "shotgun", slot: 1, auto: false, reload: 2.8, head: 1.8, clipCost: 65,
  spread: { base: .042, inc: 0, move: .01, air: .02 }, recoil: { v: .085, h: .02, max: .25, rec: 5.5 }, kick: { z: .09, rx: .2, bolt: .075 }, hip: [.125, -.14, -.33], tracer: .35 };
const snip = { cat: "rifles", cls: "rifle", snd: "sniper", mesh: "sniper", slot: 1, auto: false, pellets: 1, reload: 3, head: 4, clipCost: 125,
  spread: { base: .03, inc: 0, move: .06, air: .1 }, adsSpread: .01, adsFov: 16, adsSens: .25, recoil: { v: .09, h: .01, max: .3, rec: 4 }, kick: { z: .1, rx: .16, bolt: 0 }, hip: [.125, -.15, -.33], tracer: 1 };
const nade = { cat: "equip", cls: "nade", snd: "rifle", mesh: "grenade", slot: 4, auto: false, pellets: 0, clip: 1, reserve: 0, reload: 1, canAds: false, delay: .8, dmg: 0, head: 1,
  spread: { base: .001, inc: 0, move: 0, air: 0 }, recoil: { v: 0, h: 0, max: 1, rec: 9 }, kick: { z: 0, rx: 0, bolt: 0 }, hip: [.14, -.1, -.3], tracer: 0 };

const copy = (base, over) => Object.assign({}, base, over);

export const WEAPON_CATALOG = [
  copy(pistol, { id: "glock", name: "Glock 18", price: 400, delay: .13, dmg: 25, clip: 20, reserve: 120 }),
  copy(pistol, { id: "usp", name: "USP", mesh: "usp", price: 500, delay: .14, dmg: 30, clip: 12, reserve: 100 }),
  copy(pistol, { id: "p228", name: "P228", mesh: "p228", price: 600, delay: .15, dmg: 32, clip: 13, reserve: 52 }),
  copy(deagle, { id: "deagle", name: "Desert Eagle", price: 650, delay: .26, dmg: 54, clip: 7, reserve: 35 }),
  copy(pistol, { id: "elite", name: "Dual Berettas", mesh: "elite", price: 800, team: 1, delay: .09, dmg: 22, clip: 30, reserve: 120 }),
  copy(pistol, { id: "fiveseven", name: "Five-SeveN", mesh: "fiveseven", price: 750, team: 0, delay: .14, dmg: 28, clip: 20, reserve: 100 }),

  copy(shot, { id: "m3", name: "M3", price: 1700, delay: .85, dmg: 15, pellets: 8, clip: 7, reserve: 28 }),
  copy(shot, { id: "xm1014", name: "XM1014", mesh: "xm1014", price: 3000, cls: "rifle", delay: .28, dmg: 12, pellets: 6, clip: 7, reserve: 32, reload: 2.4 }),

  copy(smg, { id: "mac10", name: "MAC-10", mesh: "mac10", price: 1400, team: 1, delay: .068, dmg: 18, clip: 30, reserve: 100 }),
  copy(smg, { id: "tmp", name: "TMP", mesh: "tmp", price: 1250, team: 0, delay: .06, dmg: 16, clip: 30, reserve: 120 }),
  copy(smg, { id: "mp5", name: "MP5", price: 1500, delay: .075, dmg: 22, clip: 30, reserve: 120 }),
  copy(smg, { id: "ump45", name: "UMP45", mesh: "ump45", price: 1700, delay: .1, dmg: 28, clip: 25, reserve: 100 }),
  copy(smg, { id: "p90", name: "P90", mesh: "p90", price: 2350, delay: .068, dmg: 18, clip: 50, reserve: 100 }),

  copy(rifle, { id: "galil", name: "Galil", mesh: "galil", price: 2000, team: 1, delay: .09, dmg: 26, clip: 35, reserve: 90 }),
  copy(rifle, { id: "famas", name: "FAMAS", mesh: "famas", price: 2250, team: 0, delay: .082, dmg: 24, clip: 25, reserve: 90 }),
  copy(rifle, { id: "ak47", name: "AK-47", price: 2500, team: 1, delay: .098, dmg: 31, clip: 30, reserve: 90 }),
  copy(snip, { id: "scout", name: "Scout", mesh: "scout", price: 2750, delay: .9, dmg: 75, clip: 10, reserve: 30, adsFov: 18 }),
  copy(rifle, { id: "m4a1", name: "M4A1", mesh: "m4", price: 3100, team: 0, delay: .09, dmg: 28, clip: 30, reserve: 90 }),
  copy(rifle, { id: "sg552", name: "SG 552", mesh: "sg552", price: 3500, team: 1, delay: .09, dmg: 29, clip: 30, reserve: 90, adsFov: 42, adsSpread: .55, adsSens: .7 }),
  copy(rifle, { id: "aug", name: "AUG", mesh: "aug", price: 3500, team: 0, delay: .09, dmg: 28, clip: 30, reserve: 90, adsFov: 42, adsSpread: .55, adsSens: .7 }),
  copy(snip, { id: "awp", name: "AWP", price: 4750, delay: 1.35, dmg: 115, clip: 10, reserve: 30 }),
  copy(snip, { id: "sg550", name: "SG 550", mesh: "sg550", price: 4200, team: 0, auto: true, delay: .25, dmg: 60, clip: 30, reserve: 90, adsFov: 18 }),
  copy(snip, { id: "g3sg1", name: "G3SG1", mesh: "g3sg1", price: 5000, team: 1, auto: true, delay: .25, dmg: 70, clip: 20, reserve: 60, adsFov: 18 }),

  copy(rifle, { id: "m249", name: "M249", mesh: "m249", cat: "mgs", price: 5750, snd: "rifle", delay: .08, dmg: 28, clip: 100, reserve: 200, clipCost: 100, reload: 4.2,
    spread: { base: .006, inc: .0024, move: .03, air: .07 } }),

  { id: "knife", name: "Knife", cls: "knife", cat: "melee", mesh: "knife", slot: 3, auto: false, delay: .5, dmg: 55, head: 2, pellets: 0, clip: 1, reserve: 0, reload: 1, canAds: false,
    spread: { base: .001, inc: 0, move: 0, air: 0 }, recoil: { v: 0, h: 0, max: 1, rec: 9 }, kick: { z: 0, rx: 0, bolt: 0 }, hip: [.15, -.08, -.32], tracer: 0 },

  copy(nade, { id: "he", name: "HE Grenade", kind: "he", price: 300, max: 1, dmg: 130 }),
  copy(nade, { id: "flash", name: "Flashbang", kind: "flash", price: 200, max: 2 }),
  copy(nade, { id: "smoke", name: "Smoke Grenade", kind: "smoke", price: 300, max: 1 }),
];

// Mục trang bị không phải một khẩu súng trong tay.
export const EQUIP = [
  { id: "armor", name: "Kevlar", price: 650 },
  { id: "helmet", name: "Kevlar + Helmet", price: 1000 },
  { id: "defuse", name: "Defuse Kit", price: 200, team: 0, mode: "bomb" },
  { id: "nvg", name: "Nightvision", price: 1250 },
];
