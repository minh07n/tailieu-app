# TODO - Nâng cấp trang Hồ sơ (Profile)

## Back-end (server/routes/auth.js)

- [ ] Thêm endpoint đổi mật khẩu: `PUT /api/auth/password`
- [ ] Thêm endpoint xem tài liệu đã upload của user: `GET /api/auth/my-uploads`
- [ ] Thêm endpoint xóa tài liệu của chính user: `DELETE /api/auth/my-uploads/:id`
- [ ] Thêm endpoint xóa tài khoản: `DELETE /api/auth/me` (xóa documents + download_history liên quan)

## Front-end (public/js/app.js)

- [ ] Cập nhật `pageProfile()` để hiển thị form đổi mật khẩu
- [ ] Thêm bảng “Tài liệu của tôi” và nút xóa tài liệu
- [ ] Thêm phần “Xóa tài khoản” có confirm + nhập mật khẩu hiện tại
- [ ] Bảo đảm các action gọi đúng API mới, hiển thị toast lỗi/thành công

## Test thủ công

- [ ] Đăng nhập user → đổi mật khẩu thử sai/đúng
- [ ] Upload/xóa tài liệu của chính mình
- [ ] Xóa tài khoản → đăng xuất và không truy cập được nữa
