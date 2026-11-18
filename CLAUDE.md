# CAMPUS STRIKE

Đọc `CONTEXT.md` trước khi sửa gameplay, vũ khí, map hoặc âm thanh. File đó nằm trên git (repo private) và là sổ bàn giao giữa Claude và Cursor: ai làm xong phần nào thì ghi tiếp vào cuối file. Nếu không mở được, các quy tắc dưới đây vẫn có hiệu lực.

- Game là `index.html`, Three.js 0.160.1. Chạy `python -m http.server 8765`.
- Danh mục súng: `assets/weapons.js`. Tên và giá theo menu mua Counter-Strike 1.6 (AK-47, M4A1, AWP, …). Model là procedural và glTF có giấy phép trong `models/`.
- https://en.ds-servers.com/ chỉ để đối chiếu danh sách vũ khí. Không tải model `.mdl`, texture hay âm thanh Valve vào `assets/`.
- Đấu đội không mua súng; súng nằm trên đất. Giải cứu con tin và đặt bom thì mua trong khu xuất phát.
- `Material/` đã gitignore. Đừng commit thư mục đó. `CLAUDE.md` và `CONTEXT.md` thì commit bình thường.
