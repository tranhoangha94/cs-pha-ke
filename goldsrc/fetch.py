# Tải tài nguyên GoldSrc gốc của Counter-Strike 1.6 từ https://en.ds-servers.com/goldsrc-res/
# vào thư mục này (đã gitignore — không commit, không đưa vào assets/).
#   python goldsrc/fetch.py
import json, os, re, struct, sys, time, urllib.parse, urllib.request

ROOT = os.path.dirname(os.path.abspath(__file__))
SITE = "https://en.ds-servers.com"
UA = {"User-Agent": "Mozilla/5.0", "X-Requested-With": "XMLHttpRequest"}

WEAPONS = ["glock18", "usp", "p228", "deagle", "elite", "fiveseven", "m3", "xm1014", "mac10", "tmp", "mp5", "ump45", "p90",
           "galil", "famas", "ak47", "scout", "m4a1", "sg552", "aug", "awp", "sg550", "g3sg1", "m249", "knife", "hegrenade",
           "flashbang", "smokegrenade"]
WORLD = ["glock18", "usp", "p228", "deagle", "elite", "fiveseven", "m3", "xm1014", "mac10", "tmp", "mp5", "ump45", "p90",
         "galil", "famas", "ak47", "scout", "m4a1", "sg552", "aug", "awp", "sg550", "g3sg1", "m249", "hegrenade", "flashbang", "smokegrenade"]
FIRE = ["glock18-1", "glock18-2", "usp_unsil-1", "p228-1", "deagle-1", "deagle-2", "elite_fire", "fiveseven-1", "m3-1", "xm1014-1",
        "mac10-1", "tmp-1", "tmp-2", "mp5-1", "mp5-2", "ump45-1", "p90-1", "galil-1", "galil-2", "famas-1", "famas-2", "ak47-1", "ak47-2",
        "scout_fire-1", "m4a1_unsil-1", "m4a1_unsil-2", "sg552-1", "sg552-2", "aug-1", "awp1", "sg550-1", "g3sg1-1", "m249-1", "m249-2",
        "knife_slash1", "knife_slash2", "knife_hit1", "knife_hit2", "knife_hit3", "knife_hit4", "knife_hitwall1", "knife_deploy1",
        "hegrenade-1", "hegrenade-2", "he_bounce-1", "flashbang-1", "flashbang-2", "sg_explode", "pinpull", "dryfire_pistol", "dryfire_rifle",
        "ric_conc-1", "ric_conc-2", "c4_explode1", "c4_plant", "c4_disarmed", "c4_beep1", "c4_beep3", "c4_beep5", "zoom", "generic_reload"]
EXTRA = ["player/pl_step1.wav", "player/pl_step2.wav", "player/pl_step3.wav", "player/pl_step4.wav", "player/pl_tile1.wav",
         "player/pl_tile2.wav", "player/pl_tile3.wav", "player/pl_tile4.wav", "player/pl_pain2.wav", "player/pl_pain4.wav",
         "player/pl_pain5.wav", "player/pl_pain6.wav", "player/headshot1.wav", "player/headshot2.wav", "player/headshot3.wav",
         "player/bhit_flesh-1.wav", "player/bhit_flesh-2.wav", "player/bhit_flesh-3.wav", "player/bhit_kevlar-1.wav",
         "player/bhit_helmet-1.wav", "player/die1.wav", "player/die2.wav", "player/die3.wav", "items/gunpickup2.wav", "items/9mmclip1.wav",
         "items/kevlar.wav", "items/ammopickup2.wav", "common/wpn_select.wav", "common/wpn_denyselect.wav"]


def get(url, tries=4):
    for i in range(tries):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=60) as r:
                return r.read()
        except Exception as e:
            if i == tries - 1:
                raise
            time.sleep(2 + i * 2)


def find(cat, full):
    q = urllib.parse.urlencode({"sortby": "basename", "sortdir": "asc", "start": 0, "end": 80, "cat": cat,
                                "search": os.path.splitext(os.path.basename(full))[0], "page": "goldsrcres", "request": 1})
    data = json.loads(get(f"{SITE}/?{q}")).get("data") or []
    return next((r for r in data if r["fullname"].lower() == full.lower()), None)


# Kho GoldSrc không đủ mọi file gốc; phần còn thiếu lấy từ bản "Counter-Strike 1.6 clean 2018" của cùng trang
# (https://en.ds-servers.com/games/goldsrc/counter-strike-1-6-clean-2018-2.html) nếu đã giải nén vào Material/.
CLEAN = os.path.join(os.path.dirname(ROOT), "Material", "Counter-Strike 1.6", "cstrike")
SOURCES = []


def fetch(cat, full):
    dst = os.path.join(ROOT, *full.split("/"))
    if os.path.exists(dst) and os.path.getsize(dst) > 0:
        return dst
    hit = find(cat, full)
    if not hit:
        src = os.path.join(CLEAN, *full.split("/"))
        if os.path.exists(src):
            os.makedirs(os.path.dirname(dst), exist_ok=True)
            with open(src, "rb") as a, open(dst, "wb") as b:
                b.write(a.read())
            SOURCES.append(("clean2018", full))
            print("  clean 2018:", full)
            return dst
        print("  không có:", full)
        return None
    SOURCES.append(("goldsrc", full))
    page = get(f"{SITE}/goldsrc-res/r{hit['id']}/{urllib.parse.quote(hit['basename'])}").decode("utf8", "replace")
    m = re.search(r"https://store[^'\"]+", page)
    if not m:
        print("  không thấy link tải:", full)
        return None
    blob = get(m.group(0))
    magic = {"models": b"IDST", "sound": b"RIFF"}.get(cat)
    if magic and not (blob[:4] == magic or (cat == "models" and blob[:4] == b"IDSQ")):
        print("  file lạ (sai định dạng):", full)
        return None
    os.makedirs(os.path.dirname(dst), exist_ok=True)
    with open(dst, "wb") as f:
        f.write(blob)
    print("  ok", full, len(blob))
    return dst


def mdl_sounds(path):
    b = open(path, "rb").read()
    numseq, seqindex = struct.unpack_from("<ii", b, 164)
    out = set()
    for s in range(numseq):
        o = seqindex + s * 176
        nev, evi = struct.unpack_from("<ii", b, o + 48)
        for e in range(nev):
            frame, ev, typ = struct.unpack_from("<iii", b, evi + e * 76)
            opt = b[evi + e * 76 + 12: evi + e * 76 + 76].split(b"\0")[0].decode("latin1").strip()
            if ev == 5004 and opt.lower().endswith(".wav"):
                out.add(opt.replace("\\", "/").lower())
    return out


def main():
    snd = set(f"weapons/{n}.wav" for n in FIRE) | set(EXTRA)
    print("models/v_*")
    for n in WEAPONS:
        p = fetch("models", f"models/v_{n}.mdl")
        if p:
            snd |= mdl_sounds(p)
    print("models/w_*")
    for n in WORLD:
        fetch("models", f"models/w_{n}.mdl")
    print("sound/*", len(snd))
    for s in sorted(snd):
        fetch("sound", f"sound/{s}")
    with open(os.path.join(ROOT, "sources.txt"), "a", encoding="utf8") as f:
        for src, full in SOURCES:
            f.write(f"{src}\t{full}\n")


if __name__ == "__main__":
    sys.exit(main())
