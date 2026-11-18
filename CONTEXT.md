# Context chuyển sang Claude Code — Web FPS Prototype

## Hiện trạng (đọc phần này trước khi sửa)
Các mục phía dưới là nhật ký cũ. Nếu lệch với đoạn này thì **đoạn này đúng**.

- Game: **CAMPUS STRIKE**, một file `index.html`, Three.js **0.160.1** (import map CDN). Không nâng bản Three. Chạy `python -m http.server 8765` rồi mở http://127.0.0.1:8765 (`?nolock` để debug; `window.__g`, `window.__manual`, `tick(dt)`).
- Map khuôn viên đại học tự dựng. Không ghi tên trường thật trong UI. Không tái tạo map Valve.
- Chế độ: `dm` đấu đội, `hostage` giải cứu con tin, `bomb` đặt bom. Biến `MODE`, `PT`, `OPT` (localStorage `campus-strike-match`). `setupMatch()` khi bấm VÀO TRẬN.
- **Đấu đội không mua súng.** Xuất phát với Glock 18 (phe T) hoặc USP (phe CT) và dao. Súng rải trên đất (`DM_GUNS`, `spawnDmGuns`, chấm vàng trên radar). Ô trống thì đi qua là nhặt, ô đã có thì E để đổi. Chỗ nhặt hồi lại sau 12 giây.
- **Giải cứu con tin và đặt bom thì mua**, phím B, trong khu xuất phát. Menu số đủ như CS 1.6: súng lục, shotgun, tiểu liên, súng trường, súng máy, đạn, trang bị.
- Danh mục súng: `assets/weapons.js` (`WEAPON_CATALOG`, `EQUIP`). Tên hiển thị đúng tên thật: AK-47, M4A1, AWP, Desert Eagle, Glock 18, USP, MP5, M3, XM1014, M249, HE Grenade, Flashbang, Smoke Grenade, Kevlar + Helmet, Defuse Kit, Nightvision. Giá và phe (T/CT) theo menu mua Counter-Strike 1.6. `index.html` gắn `build` theo `mesh`.
- Trang bị có tác dụng: Kevlar hấp thụ đạn; mũ giảm headshot cho tới khi hết giáp; HE nổ; flash làm lóa (người chơi trắng màn, bot ngừng bắn); khói chặn tia nhìn (`smokes`, `los`); Defuse Kit rút thời gian gỡ bom từ 10 giây xuống 5 giây (chỉ CT, chế độ bom); Nightvision là lớp phủ xanh.
- Model vẫn là procedural + glTF đã có giấy phép trong `models/` (J-Toastie CC-BY, Quaternius CC-BY/CC0). **Mỗi khẩu có model riêng** (`mesh` trong `assets/weapons.js`): glock (`pistol`, Glock của rig), usp, p228, fiveseven, elite (`buildHandgun`), deagle, m3 (`shotgun`, glTF), xm1014, mac10, tmp, mp5 (`smg`), ump45, p90, galil, famas, ak47 (`rifle`), scout, m4a1 (`m4`), sg552, aug, awp (`sniper`), sg550, g3sg1, m249. Bộ chi tiết chung: `kitGrip`, `kitScope` (open = ống rỗng cho súng zoom không có màn scope đen), `tubeOpen`, `legsFolded`. Mesh mới phải đăng ký ở cả `BUILD` và `VMGL`. Hệ toạ độ súng dài: đỉnh báng cầm ở f≈0, nòng hướng f+ (= −z), `sightY` = độ cao đường ngắm.
- Súng trên tay có **kích thước cố định theo pixel**, không co giãn theo cửa sổ (`fitVm`, chuẩn chiều cao 950 px, FOV 52°). Chỉ ưu tiên desktop.
- **Map (x tây→đông, z bắc−→nam+)**: khu cũ x −42…42, z −36…36 ở giữa. Mở rộng trong `expandCampus()`: tây = ký túc xá + sân bóng rổ (x −104…−48), đông = sân vận động có đường chạy + khán đài (x 48…112), bắc = khu học thuật (z −116…−42: đại lộ, thư viện, 2 giảng đường, bãi xe, khu thí nghiệm, quảng trường xuất phát đội Đỏ). Nam là hồ. Giới hạn người chơi ở `tick` (`clamp` x −103.6…111.6, z −115.6…35.6) — mở rộng map thì sửa cả dòng này.
- Xuất phát: CT ở cổng chính (z ≈ 31), T ở quảng trường phía bắc (z ≈ −100) — cách ~130 m. `inSpawnZone` T: z < −90. Con tin quanh thư viện. Vòng 3:00.
- RNG: toà nhà bị bỏ để mở lối dùng `building(..., { ghost: true })` (vẫn tiêu rng). Code map mở rộng dùng `mrng = rngExp` (mulberry 31337) nên thêm/bớt đồ ở khu mới không làm lệch khu cũ. NAV thêm tay; kiểm tra đồ thị liên thông sau khi đặt vật cản (node trên cây/thùng sẽ bị cô lập).
- Sát thương: rơi theo khoảng cách nhẹ (súng trường 420 m, khác 220 m, tối thiểu 60%); súng trường / súng máy / Deagle trúng đầu là chết (≥120).
- Khung bóng nắng ±64 m đi theo người chơi (`followSun`).
- **Tài nguyên CS 1.6 gốc (chủ dự án yêu cầu, 2026-11-17)**: `python goldsrc/fetch.py` tải `models/v_*.mdl`, `models/w_*.mdl` và wav từ https://en.ds-servers.com/goldsrc-res/ vào `goldsrc/` (đã commit để Vercel phát được; không đưa vào `assets/`). File kho GoldSrc thiếu thì chép từ bản "CS 1.6 clean 2018" trong `Material/` (giống từng byte); nguồn từng file ghi ở `goldsrc/sources.txt`.
  - `assets/goldsrc-mdl.js` (code của mình, được commit): `parseMDL` đọc MDL v10 (xương, sequence nhóm 0 giải nén RLE, texture 8-bit, attachment, event 5004 = tiếng), `MDLModel` = SkinnedMesh + `play(i, {dur, loop, then})` / `update(dt)`. `mirror: true` cho view-model (CS lật tay trái → phải).
  - `makeVmGS`: view-model dùng hoạt cảnh gốc (idle / shootN / reload / draw; USP & M4A1 dùng bộ `_unsil`; Elite luân phiên trái/phải; M3/XM1014 nạp từng viên start_reload → insert×n → after_reload; dao midslash; lựu đạn throw). Tiếng thay đạn lấy từ event 5004 (`playPath`), không dùng `reloadCues`. FOV view-model 73.74° dọc (= fov 90 ở 4:3), vẫn cố định pixel theo chiều cao 950.
  - Súng nằm đất dùng `w_*.mdl` (`GSWM`). Bot vẫn cầm súng procedural (w_ nằm chéo, cần chỉnh từng khẩu). Không có `goldsrc/` thì toàn bộ quay về procedural/glTF; `?nogs` để ép tắt.
- Âm thanh: `SNDROOT = "goldsrc/sound/"`, tiếng bắn riêng từng súng `FIRE_SND` (khoá `fire_<id>`). **Lỗi cũ đã sửa**: `playAt` từng lấy `list[0.73]` (chỉ số thực) nên mọi tiếng ngẫu nhiên đều câm — luôn `Math.floor` chỉ số.
- Tiền chế độ theo vòng: đầu vòng tối thiểu $1000 (`MIN_ROUND_MONEY`) cho cả người chơi và bot. Bot có `money`, tự mua (`botBuy`), giữ súng nếu sống sót, bắn theo thông số súng đang cầm, rơi đúng súng khi chết.
- Ô vũ khí: 1 súng chính, 2 súng lục, 3 dao, 4 lựu đạn (`selectSlot`). Mua lựu đạn chỉ cộng vào ô 4, không rút ra và không bị mất khi mua súng khác. Phím 4 lấy lựu đạn (bấm lại để xoay HE / flash / smoke). Menu mua đang mở thì chuột không ném lựu.
- Ném lựu (HE / flash / smoke) phát câu radio CS 1.6 `radio/ct_fireinhole.wav` (`playRadio`). Thư viện phía bắc (x −16…16, z −84…−66) hát vòng `ambience/opera.wav` khi lại gần, tắt dần trong 16 m — quảng trường T (z ≈ −100) không nghe. `updateOpera`.
- `Material/` và `CONTEXT.md` nằm trong `.gitignore`. `goldsrc/` thì commit (Vercel cần model và wav). Đừng commit `Material/` hay `CONTEXT.md`.
- Chưa có phòng chơi mạng. Mỗi trình duyệt là một trận với bot.

## Bối cảnh
Đã khảo sát web game **CS/WEB** (cstest.candoo.io.vn) — bản tái hiện Counter-Strike 1.6 chạy trên trình duyệt — để học kỹ thuật dựng đồ hoạ/model, sau đó áp dụng để tự dựng một web FPS mới.

## Những gì đã học được từ CS/WEB (kỹ thuật, không phải asset)
- **Renderer nền:** Three.js (đóng gói lại thành "Saltline engine").
- **Model nhân vật/vũ khí:** họ tự viết parser đọc trực tiếp định dạng nhị phân gốc GoldSrc **`.mdl`** (magic `"IDST"`, version `10`) — đọc bones, bone controllers, sequences (animation keyframe + event âm thanh), body parts/mesh, texture palette 8-bit → dựng `BufferGeometry` + skin weights, rồi tự cài lại hệ animation xương (nội suy tuyến tính giữa frame, blend nhiều sequence, bone controller riêng cho đầu/thân).
- **Bản đồ:** tự viết parser đọc **`.bsp`** gốc GoldSrc (version 30) — lump ENTITIES/FACES/EDGES/SURFEDGES/TEXINFO/TEXTURES/MODELS, dựng mặt từ edge/surfedge winding kiểu Quake; texture map lấy từ file `.wad` gốc.
- **Vũ khí góc nhìn thứ nhất:** là một `Group` gắn thẳng vào `camera`, có bob/giật lùi, muzzle flash, tracer, attachment bone cho điểm bắn.
- **Âm thanh/hiệu ứng hạt:** dùng thẳng file `.wav` và sprite `.spr` gốc của game cũ.
- **Bot AI:** nav-mesh được tiền xử lý thành `.nav.json` để chạy trong JS.

→ Điểm mấu chốt: họ không "vẽ" model mới — họ **reverse-engineer định dạng binary cũ** và viết lại toàn bộ pipeline đọc + dựng hình + animation bằng JS/WebGL. Dùng trực tiếp asset gốc của Valve (model/âm thanh CS 1.6) là nội dung có bản quyền — **không nên sao chép** cho dự án mới; kỹ thuật (binary parser, cách gắn vũ khí vào camera, cách mô tả map bằng toạ độ, bone animation tự chế) thì hoàn toàn áp dụng được với asset gốc của mình.

## Việc đã làm trong phiên này
Đã bắt đầu dựng **prototype FPS gốc** (không dùng asset Valve), áp dụng các kỹ thuật trên nhưng bằng hình học procedural:
- File: `index.html` (single-file, Three.js qua CDN ES module, không cần build tool, không cần server — mở trực tiếp bằng trình duyệt hoặc serve tĩnh).
- Đã có: pointer-lock FPS controls (WASD + chuột), va chạm AABB đơn giản (player vs tường mở rộng theo bán kính), map abstract (1 sảnh giữa MID nối khu A/B, vài crate che chắn, tường ngoài), súng procedural (box/cylinder) gắn vào camera với bob + giật lùi + muzzle flash (canvas-generated glow texture) + tracer line, raycast bắn trúng bot (headshot vs bodyshot khác sát thương), 3 bot dạng capsule+sphere với state machine patrol → attack (line-of-sight raycast chặn bởi tường), bot tấn công gây sát thương người chơi theo xác suất/khoảng cách, HUD đầy đủ (máu, đạn, killfeed, hit-marker, damage vignette), màn hình start/pause/death với đếm ngược hồi sinh.
- **Giả định đã chọn khi người dùng bỏ qua câu hỏi** (cần xác nhận lại nếu muốn đổi):
  1. Asset pipeline: hình học procedural qua Three.js (không dùng glTF ngoài, không tự viết parser định dạng riêng).
  2. Chưa có asset thật → dùng placeholder (box tường, capsule nhân vật).
  3. Quy mô: prototype nhỏ, 1 map, chơi với bot, chạy local trong trình duyệt, chưa có multiplayer/WebSocket.

## Việc chưa làm / gợi ý bước tiếp theo trong Claude Code
1. Kiểm thử thực tế trong trình duyệt (chưa chạy qua browser tool để xác nhận không lỗi runtime — nên mở thử và xem console ngay khi bắt đầu).
2. Âm thanh: chưa có (cần tự thu âm/dùng SFX free bản quyền rõ ràng — không lấy file `.wav` gốc CS1.6).
3. Model nhân vật/vũ khí chi tiết hơn: nếu muốn nâng cấp từ placeholder lên model thật, khuyến nghị dùng **glTF/GLB qua Three.js `GLTFLoader`** (không tự viết lại định dạng `.mdl` trừ khi mục đích là học thuật/portfolio kỹ thuật).
4. Nếu muốn multiplayer thật (như CS/WEB có phòng chờ, nhiều người): cần thêm backend WebSocket (vd. Node + `ws`, hoặc Colyseus) đồng bộ vị trí/bắn súng, hiện prototype hoàn toàn client-side/offline.
5. Tối ưu hiệu năng khi thêm map lớn hơn: cân nhắc instancing cho crate lặp lại, giảm shadow map size trên máy yếu, thêm tuỳ chọn đồ hoạ Low/Medium/High như CS/WEB.
6. Map hiện tại là bố cục trừu tượng tự nghĩ (không sao chép toạ độ Dust2 thật) — nên giữ nguyên tinh thần "tự thiết kế" khi mở rộng, tránh tái tạo map Valve 1:1.

## File đính kèm
- `index.html` — prototype hiện tại, tự chứa, mở trực tiếp để chạy thử.

## Cập nhật 2026-11-16 — CAMPUS STRIKE
- `index.html` đã viết lại hoàn toàn: map khuôn viên đại học lấy cảm hứng VinUni (bố cục tự thiết kế, không tái tạo map Italy của CS), đấu đội 5v5 với bot, tới 30 điểm.
- Chạy: `python -m http.server 8765` rồi mở http://localhost:8765 (thêm `?nolock` để chạy không khoá chuột khi debug; `window.__g.tick(dt)` + `window.__manual=true` để mô phỏng từng bước).
- Va chạm AABB có bậc thang/độ cao (`moveBody`), ray tự viết (`rayBoxes`), nav graph tự nối cạnh bằng mô phỏng đi bộ (`NAV`).
- Súng: 3 khẩu procedural (rifle/pistol/shotgun), giật camera theo mẫu + lò xo view-model, tản đạn động, ADS, nạp đạn có hoạt cảnh, âm thanh WebAudio tổng hợp.
- Người: mô hình có khớp (chân FK, tay IK 2 khớp ôm súng), hitbox đầu/thân/tay chân.

## Cập nhật — model glTF + map theo tour 360
- `models/`: akm.glb, glock.glb (J-Toastie, CC-BY 3.0, súng + tay + clip Idle/Shoot/Reload), soldier.glb (Quaternius, CC-BY 3.0), swat.glb, shotgun.glb (Quaternius, CC0). Nguồn poly.pizza; dòng ghi công nằm ở màn hình bắt đầu.
- `index.html` nạp bằng GLTFLoader (`MODELS`, cờ `GL`); thiếu file thì tự quay về model dựng bằng code. Lính: `makeSoldierGL`/`poseGL`; súng góc nhìn thứ nhất: `makeVmGL` + bảng `VMGL` (hip, adsZ).
- Map đã chỉnh theo ảnh toàn cảnh tour 360 VinUni (quảng trường cỏ, khán đài tròn, đường chạy đỏ, vườn hồng, bờ hồ có nhà phố).

## Cập nhật — map chữ U, cầm súng hai tay, máu, gán phím
- Map vẽ lại: tòa chính chữ U (A giữa có tháp + lối Grand Hall xuyên qua, cánh B/C, dãy D có căn-tin, dãy E có cổng vòm) ôm quảng trường; công viên trục chính ra cổng phía nam; khán đài, vườn hồng, sân thể thao trên bệ ở phía đông. Xanh xuất phát ở cổng chính (nam), Đỏ ở đường bắc.
- Lính glTF cầm súng trường hai tay bằng IK trên xương thật (`ikArm`, trong `poseGL`).
- Máu: `blood()` / `updateBlood()` (giọt bắn + vệt trên nền).
- Gán phím: `BIND`/`DEFAULT_BIND` (mặc định kiểu CS, ngồi = Ctrl trái), lưu localStorage `campus-strike-settings`; khi vào trận game xin toàn màn hình + khoá bàn phím để Ctrl+W không đóng tab.

## Cập nhật — mua đồ kiểu CS
- Ô đồ: 1 súng chính, 2 súng lục, 3 dao, 4 lựu đạn (`inv`). Bảng `WEAPONS` có `cls`/`slot`/`price`/`clipCost`; thêm MP-9K, SR-338 (ống ngắm), Đại Bàng .50, dao, lựu đạn nổ.
- Tiền: `START_MONEY` 2500, hạ gục +300, hồi sinh +1400, tối đa 16000. Chết mất hết súng (còn P9 + dao).
- Mua bằng phím B trong khu cổng chính (`inBuyZone`), menu số (`SHOP`, `buyKey`): súng, đạn, áo giáp, lựu đạn.
- Tâm ngắm chỉ nở khi bắn (`hudCross`), độ tản đạn thật khi di chuyển giữ nguyên.

## Cập nhật — chế độ chơi (Đấu đội / Giải cứu con tin / Đặt bom), chọn phe, súng rơi, HUD mới
- Màn hình bắt đầu: chọn chế độ, phe (Xanh = Cảnh sát CT, Đỏ = Khủng bố T), mục tiêu (số mạng hoặc số vòng). Lưu localStorage `campus-strike-match` (`OPT = {mode, team, dmTarget, rounds}`). Menu tạm dừng có "VỀ MÀN HÌNH CHÍNH" (= `location.reload()`).
- Biến chính: `MODE` ("dm" | "hostage" | "bomb"), `PT` (đội người chơi). `setupMatch()` (gọi khi bấm VÀO TRẬN) xoá bot cũ, tạo 4 đồng đội + 5 đối thủ, dựng `enemyHit`, bật mốc A/B hoặc con tin, rồi `resetMatch()`.
- Theo phe: `SPAWN[PT]`, hướng nhìn lúc xuất phát, `inSpawnZone(team, p)` / `inBuyZone()`, lọc sát thương lựu đạn, radar (địch chỉ hiện khi vừa bắn), `teamName(t)`.
- Vòng đấu (`startRound(first)`, `endRound(win, lý do)`, `updateMode(dt)`): 2:30/vòng, không hồi sinh, nghỉ 5 s giữa vòng, `score[]` = số vòng thắng. Sống sót giữ súng/giáp (`spawnPlayer(keep, spot)`), chết thì về P9 + dao. Tiền: bắt đầu $800 (Đấu đội $2500), thắng +3000, thua +1500, hạ gục +300.
- Con tin: `hostages[]` (`makeHostage`, `updateHostages`) — model lính glTF đổi màu cam/trắng, không có súng/hitbox; đi theo người dẫn bằng vệt bước chân (`h.trail`) + `moveBody`, dịch chuyển chỉ khi kẹt > 4 s. Khu cứu hộ = khu xuất phát xanh. Bot CT (`b.rescuer`) đi nhặt và dẫn con tin về.
- Bom: `bomb` {state carried/dropped/planted/defused/exploded, carrier, fuse…}, `SITES` A (khán đài, có thêm node nav [-22,5]) / B (vườn hồng). Đặt 3 s / gỡ 6 s giữ phím Dùng; nổ sau 40 s, giết trong 12 m (`bombExplode`, `bombActor`).
- AI theo chế độ: `botObjective(b, dt)` (đứng đặt/gỡ bom, chờ con tin, canh gác) và `objGoal(b)` (chọn đích, `b.goalPt` = chặng cuối đi thẳng, `b.campAfter` = thời gian canh).
- Phím Dùng mặc định E (`BIND.use`): gọi/bảo con tin ở lại, nhặt súng, giữ để đặt/gỡ bom. `useTarget()` quyết định thứ đang nhắm tới.
- Súng rơi (`floorGuns`, `dropGun`, `pickUpGun`, `updateFloorGuns`): ai chết cũng rơi súng chính (bot rơi VK-47 30+30 viên), người chơi rơi cả súng lục đã mua; E để nhặt/đổi, đi qua tự nhặt nếu ô trống; tối đa 12 khẩu, Đấu đội tự biến mất sau 30 s, chế độ vòng xoá khi sang vòng.
- HUD: bảng điểm trên (`#score` + `#rtime` + dòng `#sub`), dải mục tiêu `#obj`, bảng trái dưới (máu/giáp/tiền/hạ-tử), thanh ô vũ khí `#slotbar` (`hudSlots`), lời nhắc `#ctx` (`hudCtx`), thanh tiến trình `#prog`. Kiểm thử: `window.__g` có thêm `OPT, setupMatch, hostages, bomb, floorGuns, startRound, endRound, roundT…`; `window.__lastRound` ghi kết quả vòng gần nhất.

## Cập nhật — súng vẽ texture + tay có xương cho mọi vũ khí + tiếng nhiều lớp
- `lab.html`: trang thử model (xem `?w=smg|sniper|deagle`, thêm `&rig=1` để xem kèm tay). Khối giữa `//__BEGIN_SHARED__` và `//__END_SHARED__` là mã dùng chung đã chép sang `index.html`.
- Texture vẽ theo mặt nghiêng: `gunTexture()` + bộ nét `PNT` (mòn cạnh, khía, ốc, chữ khắc); `ext()` (đùn biên dạng, có lỗ khoét) và `extZ()` (đùn mặt cắt dọc thân). Súng vẽ mới: `buildSMG`, `buildSniper`, `buildDeagle`, `buildKnife`.
- Mọi vũ khí góc nhìn thứ nhất dùng rig tay của J-Toastie (`RIGS`, `VMGL`, `makeVmGL`): súng dài dùng rig AKM, súng ngắn/dao/lựu đạn dùng rig Glock; model tự vẽ được gắn vào xương Root/Magazine/Bolt.
- Tiếng súng: `gunshot()` + bảng `SHOT` (tiếng chát, thân nổ, tiếng trầm, tiếng khoá nòng) và vang ngoài trời bằng ConvolverNode tự sinh.
- KHÔNG dùng model/texture của CS 1.6 hay game thương mại khác. Wav trong `Material/` là ngoại lệ đã được chủ dự án cho dùng local, và thư mục đó không đưa lên git.
- Danh sách tên súng lấy từ menu CS 1.6 (đối chiếu weapon pack trên en.ds-servers.com) nhưng file model trên site đó không được tải về.

## Cập nhật — catalogue vũ khí và menu mua đủ
- `assets/weapons.js` là nguồn số liệu: id, tên, giá, phe, ô, sát thương, băng đạn, `mesh`, `snd`. `index.html` import catalogue rồi gán hàm `build`.
- Menu B (con tin / bom): 1 súng lục (Glock 18, USP, P228, Desert Eagle, Dual Berettas chỉ T, Five-SeveN chỉ CT), 2 shotgun (M3, XM1014), 3 tiểu liên (MAC-10 chỉ T, TMP chỉ CT, MP5, UMP45, P90), 4 súng trường (Galil/AK-47/SG 552/G3SG1 chỉ T, FAMAS/M4A1/AUG/SG 550 chỉ CT, Scout và AWP cả hai), 5 M249, 6–7 đạn, 8 trang bị (Kevlar $650, Kevlar + Helmet $1000, HE $300, Flashbang $200 tối đa 2, Smoke $300, Nightvision $1250, Defuse Kit $200 khi chơi bom phe CT).
- Ô 4 xoay HE / Flashbang / Smoke Grenade. Đấu đội vẫn không mở shop.

## Cập nhật 2026-11-18 — kiến trúc map theo VinUni thật
- Tham khảo: ảnh toàn cảnh tour 360 VinUni. Tòa nhà thật: trắng, MÁI BẰNG có lan can con tiện, trụ áp tường, gờ chỉ từng tầng; tháp nhiều tầng có tầng lục lăng + chóp mảnh đầu vàng; nhà thi đấu mái vòm.
- `hipRoof()` giữ tên nhưng giờ dựng mái bằng + diềm + lan can (`balustrade()`); `building(..., { vault: true })` dùng `vaultRoof()`.
- Chi tiết mặt tiền trong `faceWindows()` qua `faceBox()`/`putBox()` vào các nhóm instanced mới `INST.trim / balus / rustic / roof`.
- Texture mới: `texBalus`, `texRustic`, `texVault`; vật liệu `matBalus`, `matCornice`, `matRustic`, `matRoofTop`, `matVault`, `matTowerGold`.
- Không thêm/bớt lời gọi rng()/mrng()/art(): texture tường chỉ đổi màu, mây vẽ bằng `mulberry(5150)` riêng nhưng vẫn tiêu đủ art() cũ.
- Người dùng: bãi cỏ rộng chưa có nhà trong ảnh thật thì KHÔNG đưa vào map.

## Cập nhật 2026-11-18 — BỐ CỤC map theo mặt bằng VinUni thật
- Nguồn: ảnh flycam trong tour 360 (OpenStreetMap bị chặn từ máy này). Đoạn map trong `index.html` bắt đầu ở tiêu đề "MAP — dựng theo mặt bằng VinUni thật", kết thúc trước "build instanced windows/doors".
- Ranh giới chơi x -112…112, z -112…22 (hồ ở phía nam z > 22). Tây: vườn đài phun nước + hàng cột bán nguyệt, Quảng trường trung tâm, khối nhà chính quay cửa về phía tây (`vinTower(-37,-60,22)` trên sảnh xuyên đông–tây z -64…-56), cánh nam có sân trong + 2 cổng vòm, cánh bắc, cầu nối có lối dưới, thư viện sau khối tháp. Giữa: hội trường mái vòm + hàng cột, khán đài ngoài trời (A, 12,-22), sân vận động đông–tây (tâm 44,-78). Đông: vườn hồng (B, 46,-20), nhà đa năng, căn-tin, nhà thi đấu mái vòm, ký túc xá + chòi tròn. Bãi cỏ rộng sát hồ đã bỏ theo yêu cầu.
- Gameplay theo map mới: `SPAWN` (CT lối dạo ven hồ, T đường phía bắc), `inSpawnZone`, `SITES`, `HOSTAGE_SPOTS` (quanh cánh bắc), `NORTH_NODES` (z < -60), `DM_GUNS` (tự bám vào điểm nav gần nhất), giới hạn `player.pos`, vùng opera (cánh bắc).
- NAV giờ tự sinh: lưới 8 m lọc chỗ trống + `NAV_EXTRA` ở lối hẹp; nối cạnh ≤ 12,5 m, chỉ xét va chạm gần đoạn đi (`moveBody`/`groundAt` nhận tham số `list`). Kiểm tra: mọi nút phải thuộc 1 thành phần liên thông.
- Chuỗi ngẫu nhiên: map dùng `mapRng`/`mart` riêng; `RNGN`/`ARTN` đếm lượt gọi, cuối đoạn map trả lại tới đúng 98969 / 43913 như bản trước để texture súng không đổi. Nếu sửa phần trước điểm `__M0` mà đổi số lượt gọi thì phải đo lại hai con số này.
- `faceWindows(..., skip)`: tham số cuối bỏ qua cửa sổ thấp hơn mức này (tường phía trên lối xuyên).

## Cập nhật 2026-11-18 (2) — map theo BẢN ĐỒ CHÍNH THỨC VinUni (Open Day 2024) + vào được trong nhà
- Bản đồ chính thức: Cổng Đại Lễ = phía tây (x -112), Cổng San Hô = phía đông; trục chính Quảng trường → sân bậc → Tòa I → Tòa A (tháp) → Tòa C → sân vận động. G/E (sân trong) phía trước hai bên A, H/B phía sau hai bên, F góc tây nam, bãi gửi xe phía bắc; sân vận động + Tòa L (khán đài sát đường chạy phía nam) + K + J (ký túc xá chữ U) ở đầu đông, J/K trên phần nhô bên hồ. Bãi cỏ rộng sát hồ bỏ đi.
- Vùng chơi hình chữ L: `inPlay(x, z)`; hồ ở phía nam (z > 63,5) và quanh phần nhô phía đông.
- Nhà vào được (`hollow()`): sảnh I–A, thư viện C, hội trường B (sân khấu + ghế), nhà thi đấu K (sân bóng rổ), quán cà phê F. `courtyardBlock()` cho G/E.
- Gameplay: CT xuất phát Cổng San Hô, T xuất phát Cổng Đại Lễ; điểm bom A = khán đài ngoài trời (41,54, mở về phía hội trường), B = vườn hồng (20,50); con tin ở sân trong G, sân trong E, quán F; nhạc opera quanh Tòa G; `NORTH_NODES` giờ là nửa phía tây (x < -20).
- Sơ đồ: `map-layout.svg` (xoay cùng chiều bản đồ chính thức). Script sinh sơ đồ nằm ngoài repo.
- Tốc độ chạy theo vũ khí: trường `spd` trong `assets/weapons.js` (dao 1,24 > súng lục và lựu đạn 1,12 > Desert Eagle 1,07 > tiểu liên 1,06 > Scout 1 > shotgun / M4 > AK > súng bắn tỉa nặng).
- Lựu đạn: giữ chuột để lấy đà (`nadeHold`, đầy sau `NADE_FULL` = 1,2 s, thanh `#nadePow`), thả mới ném; chuột phải = ném bổng nhẹ.
- (2026-11-18, 3) Cạnh sân vận động phía Cổng San Hô là LỐI ĐI SINH VIÊN (z -1,6…7,6, từ cổng x 111 tới đường nội bộ x 61), CT xuất phát ngay trên lối này. Bên kia lối (x 62…112, z -58…-5) là CÔNG TRƯỜNG ĐANG XÂY: rào tôn (cổng xe x 80…86 ở z -5, cổng người đi bộ phía tây z -31…-25, cổng phía bắc x 96…102), khung bê tông 3 tầng (cột lưới 8 m, sàn ở 4 m và 8 m — đi dưới được), lõi thang, giàn giáo, cần cẩu tháp, container, cát, thép.
- Bãi gửi xe: `CAR(x, z, yaw, kind, màu)` dựng xe điện SUV (kind 0) / sedan (kind 1) không logo. Người dùng muốn xe VinFast: chỉ thay bằng file model có giấy phép rõ ràng nếu người dùng cung cấp.
- (2026-11-18, 4) Bớt vẻ "nhựa": `skyEnv` (PMREM từ bầu trời vẽ tay) + `withEnv(mat, k)` cho sơn xe, kính xe, kính cửa sổ, kim loại, nước, tôn, tường (nhẹ). Bóng tiếp xúc mềm: một InstancedMesh shader (sdBox) dưới mọi collider chạm đất. Xe `CAR` chi tiết hơn (thân uốn thót mui, khe cửa, nẹp chrome, mâm 5 chấu, đĩa phanh, hốc gió) và GỘP theo vật liệu (`CAR.flush()`) → tổng lệnh vẽ thấp hơn bản trước.

## 2026-11-18 — Làm thật hơn trên Three.js (chưa port Babylon; người dùng review trước)
- Đã nghiên cứu Babylon.js vs Three.js: port = viết lại ~3.600 dòng + loader GoldSrc của Cursor; độ thật do model/ánh sáng, không do engine. Người dùng: "thử tiếp tục cải thiện bằng threeJs trước, review thấy Ok thì thôi, ko cần sửa cấu trúc".
- Hậu kỳ (`POST`, cuối file trước vòng lặp): N8AOPass (CDN n8ao@1.9.4; import map thêm "three/examples/jsm/" và "postprocessing" → `assets/pp-shim.js` stub `Pass`) + UnrealBloom (ngưỡng 2.4) + OutputPass + ShaderPass chỉnh màu. `?nofx` tắt hậu kỳ. POST.render bật `renderer.autoClear` trong lúc vẽ (N8AO cần xoá target, game để autoClear=false) — thiếu cái này thì khung cũ đè bóng ma.
- Công trình dựng theo ảnh báo (thanhnien 19/01/2020, kientructrinhgia): khối "CÔNG TRÌNH TIÊU BIỂU" trước "// ---------- cây, đèn, chỗ nấp". Gộp theo vật liệu bằng `bake`.
  - Cổng Đại Lễ = khải hoàn môn `triumph({x:-110,z:1,ry:π/2,...})`, chữ "ĐẠI HỌC VINUNI", cổng sắt khép trong 3 cửa vòm; tường rào tây tách đôi để chừa cổng.
  - Khải hoàn môn có tượng trên đỉnh ở bãi cỏ bắc (-82,-38) + 2 tượng chầu + hàng cột/pergola x -72…-62, z -40.2/-36.4.
  - 8 tượng đá trắng trên bệ dọc trục vào (x -106/-100 z -6.6/8.6; x -74/-68 z -4.6/6.6).
  - Tòa B: mặt tiền đền Hy Lạp — 6 cột Ionic có rãnh, dầm 3 lớp, diềm hoa thị vàng, răng cưa, trán hồi tam giác có mặt trời vàng, tượng đỉnh + bình góc.
  - Tháp A: kim cao hơn (10 m), mặt trời vàng 3D (`sunEmblem`) thay sprite ngôi sao.
- Cây: `TREE_V` 4 mẫu (thân + cành gộp, tán 34 tấm lá hai mặt pháp tuyến hướng ra ngoài), 2 lệnh vẽ/cây; cây bách `cypressGeo` thay các nón lá. tree() vẫn gọi mrng 24 lần.
- Kiểm tra: __M1 = 98969/43913, nav 449/449 nút liền, đặt bom chạy 80 s không lỗi, draw call ~1019.
- Chưa làm: nhân vật (người), tòa G, Cổng San Hô (không có ảnh).
- Chụp ảnh khi khung trình duyệt bị ẩn: scratchpad/shotsrv.py (POST ảnh canvas về cổng 8766) + hàm __cap trong trang.
- 2026-11-18 (sau commit 8027e2b): người dùng báo "tốc độ di chuyển chậm quá". Nguyên nhân: frame() kẹp dt ≤ 0,05 → FPS < 20 (hậu kỳ nặng) thì cả game chạy chậm (14 FPS: 4,1 m/s thay vì 5,8). Sửa: chia khung thành bước ≤ 0,034 s (raw kẹp 0,2), và `adaptFx` tự hạ hậu kỳ 2→1 (tắt bloom, AO Low)→0 (tắt) khi trung bình khung > 26 ms trong 1,5 s. `?fx=keep` giữ nguyên.
- 2026-11-18: người dùng xác nhận "tòa G là tòa thấy ngay trước mặt khi vào team Cảnh sát" → khối x 31…50, z -6…10 (trước đây ghi nhầm "Thư viện (Tòa C)") là TÒA G. Đã đổi nhãn ZONES/chú thích/map-layout.svg; khối sân trong tây bắc (-14…8, -36…-14, nơi giữ con tin + opera) tạm gọi "khối tây bắc" — chưa biết tên thật. Mặt đông Tòa G dựng theo ảnh nhà G & E thật (kalis.com.vn/nha-g-e-dai-hoc-vinuni): 6 cột Corinth đơn–đôi–đôi–đơn đầu vàng, 3 cửa gỗ + ô cửa tròn, trán hồi phù điêu, chóp khiên cuộn, 2 tượng; thùng nấp dời ra (54,-6.6)/(54,9.6).
- 2026-11-18 (sửa lại): đối chiếu sơ đồ Open Day 2024 (ảnh người dùng gửi, images/4.png) + thông báo VinUni "Auditorium (Building G)": tòa ngay trước khu xuất phát Cảnh sát là TÒA C (đúng như nhãn ban đầu); TÒA G là khối tây bắc (đối xứng E, có hội trường); chú thích dưới Tòa A bắt đầu "Thư viện…". Đã trả nhãn: ZONES "Tòa C", "Tòa B", "Sân trong Tòa G". Mặt tiền ảnh nhà G & E (kalis) hiện đang gắn ở mặt đông Tòa C — chờ người dùng quyết có chuyển sang G/E không.
- Đã XOÁ mọi chữ "VinUni" trên cổng / khải hoàn môn (người dùng không muốn rắc rối); tầng attic giờ là ô trơn. Bỏ hàm textTex.
- 2026-11-18: mặt tiền ảnh nhà G & E đã chuyển sang mặt TÂY của Tòa G (-14, z -25) và Tòa E (-14, z 25) bằng geFront(FX, FZ, ry=π); cửa giữa trùng cổng vòm vào sân trong (z ±2). Tòa C trở lại mặt tiền thường, thùng nấp về (53,-2)/(53,8). Nav 449/449, M1 giữ nguyên, chế độ con tin chạy 80 s không lỗi.
- 2026-11-18 CHỐT theo sơ đồ Open Day 2025 người dùng gửi (ĐỪNG tự gán tên toà theo nguồn khác): toà ngay trước khu xuất phát CT (31…50, -6…10) = TÒA G; khối sân trong tây bắc (-14…8, -36…-14) = TÒA C (nơi giữ con tin + opera); tây nam = TÒA E (nhà ăn); đông nam (31…51, 14…40) = TÒA B; HỘI TRƯỜNG = ô 'Trung tâm khởi nghiệp' phía nam Tòa A giữa B và E → toà mới hollow(12,21,27,36,12) có sân khấu/ghế, mặt nam là sảnh cột kiểu đền theo ảnh thật (geFront(19.5,36,-π/2,12)). Bỏ hàng cột + trán hồi cũ ở mặt nam Tòa B, bỏ cây (26,30). Nav 447/447, M1 giữ nguyên.
- 2026-11-18: mặt đông Tòa G (trước khu xuất phát CT) có mái hiên kiểu Hy Lạp theo lời người dùng: 4 cột Ionic cao 7,6 m, dầm 3 lớp, diềm hoa vàng, trán tam giác có mặt trời vàng, trần ô cờ, bậc thềm (x 50…54.4, z -3.7…6.7). Thùng nấp dời ra (53.2,-6.2)/(53.2,9.2). Nav 445/445.
- 2026-11-18: dao có đòn ĐÂM bằng nút ngắm (giữ = đâm liên tục): weapons.js knife.stab = { dmg 65, delay 1 s, range 1,8 m, back ×3 }; knifeAttack(w, stab) — đâm sau lưng (nhìn cùng hướng đối thủ, dot > .5) = 195; view-model GoldSrc dùng hoạt cảnh stab / stab_miss; tiếng: slash hạ tông + knife_hitwall1 khi trúng tường. Đã đo: chém 55, đâm 65, đâm sau lưng 195, quá 1,8 m trượt. Mái hiên Tòa G hạ còn một tầng (H 3,8), chỉ còn 2 cột hai đầu. Lưu ý khi test: bot dùng b.hp (không phải health).
- 2026-11-18: Tòa A to hơn theo ảnh thật người dùng gửi: thân chính cao 30 m (trước 22), thêm tầng lùi 13 × 22 m cao 4,6 m có 4 chòi góc mái vòm (vinTower(TX, TZ, YB) dựng tầng lùi rồi mới đến tháp), kim to dần (trụ thay cho kim mảnh) + vòng 16 cánh hoa xoè quanh chân kim, mặt trời vàng giữ nguyên. Đỉnh tháp ~ 73 m. Nav 445/445, M1 giữ nguyên.
- 2026-11-18 (học từ repo Saltline, chỉ tham khảo, không chép code — repo không có LICENSE):
  - Tone map AgX (exposure 1,15) thay ACES; chỉnh màu bão hoà +22 %; lá cây sáng ×1,45 (AgX nén vùng xanh tối).
  - Bóng mềm kiểu PCSS: thay getShadow trong ShaderChunk.shadowmap_pars_fragment (đầu file, sau renderer): 12 mẫu tìm vật che + 24 mẫu lọc, textureLod (tránh cảnh báo đạo hàm trong vòng lặp), bias .0012 chống tự đổ bóng. Chỉ ký tự ASCII trong chuỗi GLSL. ?nopcss để tắt. Chi phí thêm ~15–20 % thời gian vẽ khung (đo trong khung trình duyệt chậm).
  - groundVary(mat, amt, dirt, wear): onBeforeCompile pha màu theo toạ độ thế giới (nhiễu 6 m / 21 m / 1,7 m) + mảng bẩn — áp cho cỏ, gạch lát, sân, nhựa đường, vạch sơn, bê tông, đất công trường. texAsphalt: cốt liệu, mảng vá, vết nứt, vệt dầu.
  - Bầu trời là ShaderMaterial (gradient, mặt trời, mây fbm trôi theo skyU.time = wt trong frame()). Bỏ canvas trời cũ.
  - Màn khởi động có trạng thái "Đang tải bản đồ và model…" (#start.loading) — tải xong renderOpts() mới bỏ class loading.
  - Tượng = các vị thần: godGeo(name), statueGeo("tên") tự chuyển sang godGeo; bệ có biển tên khắc (plaqueFor). Trục vào: zeus, hera, athena, ares, apollo, artemis, poseidon, hermes; cạnh khải hoàn môn: aphrodite, dionysus; đỉnh khải hoàn môn: nike.
  - Test chụp ảnh: __g.followSun(x, z) để khung bóng nắng theo camera khi chụp thủ công.
- 2026-11-18: tượng thần dựng lại bằng SDF + surface nets (sdfMesh, godGeo): cơ thể liền khối, mặt, tóc xoăn, nếp áo; tư thế theo tượng nổi tiếng (Apollo Belvedere, Athena, Artemis Versailles, Aphrodite Milo, Nike...). Bỏ biển tên trên bệ (người dùng không muốn).
- 2026-11-18: NHÂN VẬT DÙNG MODEL GỐC CS 1.6 (người dùng yêu cầu, repo private): chép từ Material/Counter-Strike 1.6/cstrike/models vào goldsrc/models: player/{gign,sas,gsg9,urban,arctic,guerilla,leet,terror}/*.mdl (~19 MB), hostage.mdl, p_*.mdl (súng cầm tay). sources.txt có ghi.
  - assets/goldsrc-mdl.js: giải nén hoạt cảnh khi cần (seq.ok, seq.blend(k), seq.blendRange; seq.pose = blend giữa — view-model 1 blend nên không đổi). MDLModel.find dùng s.ok.
  - index.html: CSM/CS_OK, makeSoldierCS (thân dưới gait idle1/walk/run, thân trên từ Bip01 Spine: ref_aim_/ref_shoot_<đuôi súng CS_EXT> có blend góc ngắm theo pitch, chết: death1/2/3/gutshot/head...), csSetGun ghép xương p_ model, makeHostageCS/poseHostageCS (walk/run/idle1/fear1). Thiếu file → tự quay về glTF cũ.
  - Hộp trúng đạn giữ như bản glTF (đầu theo xương Bip01 Head). Đã chạy 2 vòng đặt bom: 14 lượt hạ gục, không lỗi.
- 2026-11-18: bóng bị tách khỏi chân người: do bias PCSS .0012 (~0,4 m) + sun.shadow.bias -0.0006. Đã hạ: tìm vật che .0004, lọc .00025, sun.shadow.bias -0.00025, normalBias .03. Bóng dính chân, tường và cây không bị vằn.
- 2026-11-18: màn khởi động có thanh tiến trình (LOADP / loadRange / yieldUI): dựng bản đồ → model súng → súng trên đất → model nhân vật → làm nóng (giải nén hoạt cảnh CS cần dùng, dựng tạm 8 lính + 1 con tin, renderer.compile cho scene + vmScene với mọi view-model hiện, initTexture mọi texture, vẽ thử 4 hướng) rồi mới bỏ class loading. Đo: sau khi vào trận không còn shader nào phải biên dịch (info.programs giữ nguyên). Tốc độ chuột: ô .sensR / .sensN ở màn khởi động, màn tạm dừng và bảng CÀI ĐẶT (0,1–6, gõ số tới 10) + 'Tốc độ chuột khi ngắm' (zsens, nhân với adsSens); lưu trong campus-strike-settings.
- 2026-11-18: sát thương theo CS 1.6: weapons.js thêm pen (0,5 × armor ratio: awp .975, scout .85, ak47 .775, m4a1 .7, usp .5…); damage() dùng armorPen(weapon) cho cả người chơi lẫn bot (giáp chặn (1−pen), tốn 0,5 giáp/điểm). Súng bắn tỉa không giảm sát thương theo tầm. Bot bắn AWP trúng thân người chơi: ×R(.92,1). Đo: AWP thân có giáp 112 (chết), chân 84, Scout thân 64.
- 2026-11-18: CÀI ĐẶT > ĐỒ HỌA (GFX, localStorage 'campus-strike-gfx'): độ phân giải vẽ (res = chiều cao khung, pixelRatio = res / innerHeight, phóng ra cả cửa sổ), chất lượng high/medium/low (đổi thì tải lại: low = không hậu kỳ + không PCSS + shadow 2048; medium = không bloom, AO Low; high = đủ), giới hạn FPS (frame(now) bỏ lượt khi chưa tới hạn), hiện FPS (#fpsbox dưới radar). Giới hạn FPS chưa đo được trong khung trình duyệt ẩn của Claude.
