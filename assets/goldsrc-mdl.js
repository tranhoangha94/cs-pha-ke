// Đọc model GoldSrc (.mdl phiên bản 10: Half-Life / Counter-Strike 1.6) thành SkinnedMesh của three.js.
// Hỗ trợ: xương, mọi sequence trong nhóm 0 (giải nén RLE), texture 8-bit + bảng màu (cờ masked),
// attachment và sự kiện 5004 (tiếng gắn trong hoạt cảnh). Không hỗ trợ bone controller, blend thứ hai, nhóm sequence ngoài.
import * as THREE from "three";

const FLAG_MASKED = 0x40;

export function parseMDL(buf, texBuf){
  const dv = new DataView(buf), u8 = new Uint8Array(buf);
  const i32 = o => dv.getInt32(o, true), f32 = o => dv.getFloat32(o, true), i16 = o => dv.getInt16(o, true), u16 = o => dv.getUint16(o, true);
  const str = (o, n) => { let s = ""; for (let i = 0; i < n && u8[o + i]; i++) s += String.fromCharCode(u8[o + i]); return s; };
  const id = str(0, 4), ver = i32(4);
  if (id !== "IDST" || ver !== 10) throw new Error(`MDL không hợp lệ (${id} v${ver})`);

  const bones = [];
  for (let b = 0, n = i32(140), base = i32(144); b < n; b++){
    const o = base + b * 112, value = [], scale = [];
    for (let k = 0; k < 6; k++){ value.push(f32(o + 64 + k * 4)); scale.push(f32(o + 88 + k * 4)); }
    bones.push({ name: str(o, 32), parent: i32(o + 32), value, scale });
  }
  const nb = bones.length;

  const animValue = (base, frame) => {
    let o = base, k = frame;
    for (let guard = 0; guard < 4096; guard++){
      const valid = u8[o], total = u8[o + 1];
      if (total > k || total === 0) break;
      k -= total; o += (valid + 1) * 2;
    }
    const valid = u8[o];
    return valid > k ? i16(o + (k + 1) * 2) : i16(o + valid * 2);
  };
  const q = new THREE.Quaternion();
  const angleQuat = (x, y, z, out) => {
    const sr = Math.sin(x * .5), cr = Math.cos(x * .5), sp = Math.sin(y * .5), cp = Math.cos(y * .5), sy = Math.sin(z * .5), cy = Math.cos(z * .5);
    out.set(sr * cp * cy - cr * sp * sy, cr * sp * cy + sr * cp * sy, cr * cp * sy - sr * sp * cy, cr * cp * cy + sr * sp * sy); return out;
  };

  const seqs = [];
  for (let s = 0, n = i32(164), base = i32(168); s < n; s++){
    const o = base + s * 176, nf = Math.max(1, i32(o + 56)), animindex = i32(o + 124), group = i32(o + 156);
    const events = [];
    for (let e = 0, ne = i32(o + 48), eb = i32(o + 52); e < ne; e++){ const eo = eb + e * 76; events.push({ frame: i32(eo), event: i32(eo + 4), options: str(eo + 12, 64) }); }
    const seq = { name: str(o, 32), fps: f32(o + 32) || 30, loop: !!(i32(o + 36) & 1), frames: nf, events, pose: null };
    if (group === 0){
      const pose = new Float32Array(nf * nb * 7), v = [0, 0, 0, 0, 0, 0];
      for (let b = 0; b < nb; b++){
        const ab = animindex + b * 12, bn = bones[b], offs = [0, 1, 2, 3, 4, 5].map(k => u16(ab + k * 2));
        for (let f = 0; f < nf; f++){
          for (let k = 0; k < 6; k++) v[k] = bn.value[k] + (offs[k] ? animValue(ab + offs[k], f) * bn.scale[k] : 0);
          const p = (f * nb + b) * 7; angleQuat(v[3], v[4], v[5], q);
          pose[p] = v[0]; pose[p + 1] = v[1]; pose[p + 2] = v[2]; pose[p + 3] = q.x; pose[p + 4] = q.y; pose[p + 5] = q.z; pose[p + 6] = q.w;
        }
      }
      seq.pose = pose;
    }
    seqs.push(seq);
  }

  const attachments = [];
  for (let a = 0, n = i32(212), base = i32(216); a < n; a++){ const o = base + a * 88; attachments.push({ bone: i32(o + 36), org: [f32(o + 40), f32(o + 44), f32(o + 48)] }); }

  // texture: nằm trong file chính hoặc file "…T.mdl" đi kèm
  let tdv = dv, tu8 = u8;
  if (!i32(180) && texBuf){ tdv = new DataView(texBuf); tu8 = new Uint8Array(texBuf); }
  const ti32 = o => tdv.getInt32(o, true), ti16 = o => tdv.getInt16(o, true);
  const tstr = (o, n) => { let s = ""; for (let i = 0; i < n && tu8[o + i]; i++) s += String.fromCharCode(tu8[o + i]); return s; };
  const textures = [];
  for (let t = 0, n = ti32(180), base = ti32(184); t < n; t++){
    const o = base + t * 80, flags = ti32(o + 64), w = ti32(o + 68), h = ti32(o + 72), idx = ti32(o + 76), pal = idx + w * h;
    const rgba = new Uint8Array(w * h * 4), masked = !!(flags & FLAG_MASKED);
    for (let i = 0; i < w * h; i++){ const c = tu8[idx + i], p = pal + c * 3; rgba[i * 4] = tu8[p]; rgba[i * 4 + 1] = tu8[p + 1]; rgba[i * 4 + 2] = tu8[p + 2]; rgba[i * 4 + 3] = masked && c === 255 ? 0 : 255; }
    textures.push({ name: tstr(o, 64), flags, w, h, rgba, masked });
  }
  const skinref = [];
  for (let r = 0, n = ti32(192), base = ti32(200); r < n; r++) skinref.push(ti16(base + r * 2));

  // lưới: mỗi bodypart lấy submodel 0, gom tam giác theo texture
  const byTex = new Map();
  for (let p = 0, np = i32(204), pb = i32(208); p < np; p++){
    const po = pb + p * 76; if (i32(po + 64) < 1) continue;
    const mo = i32(po + 72), nmesh = i32(mo + 72), meshindex = i32(mo + 76), vinfo = i32(mo + 84), vidx = i32(mo + 88), ninfo = i32(mo + 96), nidx = i32(mo + 100);
    for (let m = 0; m < nmesh; m++){
      const me = meshindex + m * 20, ti = skinref[i32(me + 8)] ?? i32(me + 8), tex = textures[ti];
      if (!byTex.has(ti)) byTex.set(ti, { pos: [], nor: [], uv: [], bone: [] });
      const acc = byTex.get(ti), tw = tex ? tex.w : 1, th = tex ? tex.h : 1;
      const vert = c => {
        const vi = i16(c), ni = i16(c + 2), s = i16(c + 4), t = i16(c + 6), vo = vidx + vi * 12, no = nidx + ni * 12;
        acc.pos.push(f32(vo), f32(vo + 4), f32(vo + 8)); acc.nor.push(f32(no), f32(no + 4), f32(no + 8));
        acc.uv.push((s + .5) / tw, (t + .5) / th); acc.bone.push(u8[vinfo + vi]);
      };
      let o = i32(me + 4);
      for (let guard = 0; guard < 1e6; guard++){
        let n = i16(o); o += 2; if (!n) break;
        const fan = n < 0; n = Math.abs(n); const cmds = []; for (let k = 0; k < n; k++){ cmds.push(o); o += 8; }
        for (let k = 2; k < n; k++){
          const tri = fan ? [cmds[0], cmds[k - 1], cmds[k]] : k & 1 ? [cmds[k - 1], cmds[k - 2], cmds[k]] : [cmds[k - 2], cmds[k - 1], cmds[k]];
          vert(tri[0]); vert(tri[2]); vert(tri[1]);
        }
      }
    }
  }
  return { name: str(8, 64), bones, seqs, attachments, textures, byTex };
}

const _q0 = new THREE.Quaternion(), _q1 = new THREE.Quaternion(), _v = new THREE.Vector3();
const texCache = new WeakMap();

// Một bản thể có thể hoạt cảnh. Gốc toạ độ GoldSrc (x tới trước, y sang trái, z lên trên) được quay về hệ của three
// (-z tới trước, x sang phải, y lên trên) và nhân scale (inch → mét).
export class MDLModel {
  // mirror: lật trái ↔ phải (view-model CS 1.6 được dựng cho tay trái, game lật lại khi cl_righthand 1)
  constructor(data, { scale = .0254, material, mirror = false } = {}){
    this.data = data;
    this.root = new THREE.Group();
    const conv = new THREE.Group(); conv.matrixAutoUpdate = false;
    conv.matrix.set(0, mirror ? 1 : -1, 0, 0, 0, 0, 1, 0, -1, 0, 0, 0, 0, 0, 0, 1).multiply(new THREE.Matrix4().makeScale(scale, scale, scale));
    this.mirror = mirror;
    this.root.add(conv);
    this.bones = data.bones.map(b => { const o = new THREE.Bone(); o.name = b.name; return o; });
    this.bones.forEach((o, i) => { const p = data.bones[i].parent; if (p >= 0) this.bones[p].add(o); });

    let tc = texCache.get(data);
    if (!tc){ tc = data.textures.map(t => { const tx = new THREE.DataTexture(t.rgba, t.w, t.h); tx.colorSpace = THREE.SRGBColorSpace; tx.magFilter = THREE.LinearFilter; tx.minFilter = THREE.LinearMipmapLinearFilter; tx.generateMipmaps = true; tx.anisotropy = 4; tx.wrapS = tx.wrapT = THREE.RepeatWrapping; tx.needsUpdate = true; return tx; }); texCache.set(data, tc); }
    const pos = [], nor = [], uv = [], si = [], sw = [], mats = [], geo = new THREE.BufferGeometry();
    let start = 0;
    for (const [ti, a] of data.byTex){
      const n = a.pos.length / 3; if (!n) continue;
      pos.push(...a.pos); nor.push(...a.nor); uv.push(...a.uv);
      for (const b of a.bone){ si.push(b, 0, 0, 0); sw.push(1, 0, 0, 0); }
      const t = data.textures[ti];
      const m = material ? material(t, tc[ti]) : new THREE.MeshLambertMaterial({ map: tc[ti] || null, alphaTest: t && t.masked ? .5 : 0, transparent: false });
      geo.addGroup(start, n, mats.length); mats.push(m); start += n;
    }
    geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute("normal", new THREE.Float32BufferAttribute(nor, 3));
    geo.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
    geo.setAttribute("skinIndex", new THREE.Uint16BufferAttribute(si, 4));
    geo.setAttribute("skinWeight", new THREE.Float32BufferAttribute(sw, 4));
    this.mesh = new THREE.SkinnedMesh(geo, mats); this.mesh.frustumCulled = false;
    for (let i = 0; i < this.bones.length; i++) if (data.bones[i].parent < 0) this.mesh.add(this.bones[i]);
    conv.add(this.mesh);
    this.mesh.bind(new THREE.Skeleton(this.bones, this.bones.map(() => new THREE.Matrix4())), new THREE.Matrix4());
    this.attach = data.attachments.map(a => { const o = new THREE.Object3D(); o.position.set(...a.org); (this.bones[a.bone] || this.mesh).add(o); return o; });

    this.cur = null; this.t = 0; this.rate = 1; this.queue = []; this.onEvent = null; this.onEnd = null;
    const first = data.seqs.findIndex(s => s.pose); if (first >= 0){ this.play(first, { loop: true }); this.update(0); }
  }
  find(...names){
    for (const n of names){ const re = n instanceof RegExp ? n : new RegExp(`^${n}$`, "i"); const i = this.data.seqs.findIndex(s => s.pose && re.test(s.name)); if (i >= 0) return i; }
    return -1;
  }
  length(i){ const s = this.data.seqs[i]; return s ? Math.max(1, s.frames - 1) / s.fps : 0; }
  // play(chỉ số, { dur: ép thời lượng, loop, then: chạy tiếp danh sách [[chỉ số, opts], …] })
  play(i, o = {}){
    const s = this.data.seqs[i]; if (!s || !s.pose) return;
    this.cur = s; this.t = 0; this.loop = o.loop ?? s.loop; this.rate = o.dur ? this.length(i) / o.dur : 1; this.queue = o.then ? o.then.slice() : []; this.done = false;
    this.fire(-1, 0);
  }
  fire(a, b){
    if (!this.onEvent) return;
    for (const e of this.cur.events) if (e.frame > a && e.frame <= b || (a < 0 && e.frame === 0)) this.onEvent(e);
  }
  update(dt){
    const s = this.cur; if (!s) return;
    if (!this.done){
      const prev = this.t, last = Math.max(1, s.frames - 1);
      this.t += dt * s.fps * this.rate;
      if (this.t >= last){
        if (this.loop){ this.fire(prev, last); this.t %= last; this.fire(-.5, this.t); }
        else { this.fire(prev, last); this.t = last;
          if (this.queue.length){ const [ni, no] = this.queue.shift(); const rest = this.queue; this.play(ni, { ...no, then: rest }); return this.update(0); }
          this.done = true; if (this.onEnd) this.onEnd(s); }
      } else this.fire(prev, this.t);
    }
    const nb = this.bones.length, f0 = Math.floor(this.t), a = this.t - f0, f1 = Math.min(f0 + 1, s.frames - 1), P = s.pose;
    for (let b = 0; b < nb; b++){
      const p0 = (f0 * nb + b) * 7, p1 = (f1 * nb + b) * 7, bone = this.bones[b];
      bone.position.set(P[p0] + (P[p1] - P[p0]) * a, P[p0 + 1] + (P[p1 + 1] - P[p0 + 1]) * a, P[p0 + 2] + (P[p1 + 2] - P[p0 + 2]) * a);
      _q0.set(P[p0 + 3], P[p0 + 4], P[p0 + 5], P[p0 + 6]); _q1.set(P[p1 + 3], P[p1 + 4], P[p1 + 5], P[p1 + 6]);
      bone.quaternion.slerpQuaternions(_q0, _q1, a);
    }
  }
  attachmentWorld(i, out = _v){ const o = this.attach[i]; if (!o) return null; return o.getWorldPosition(out); }
}
