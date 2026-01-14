# translate (Supabase Edge Function)

Dịch đoạn text (ví dụ đoạn bạn bôi đậm trong Reader) bằng Gemini, trong đó API key được giữ ở backend (Supabase secrets) thay vì để lộ trên frontend.

## Endpoint

Khi gọi từ frontend bằng `supabase.functions.invoke("translate", ...)`, request sẽ đi tới:

`https://<project-ref>.supabase.co/functions/v1/translate`

## 1) Backend (Bảo mật Key)

1. Cài Supabase CLI (macOS):
   - `brew install supabase/tap/supabase`
2. Đăng nhập:
   - `supabase login`
3. Link project:
   - `supabase link --project-ref eklrloldatjpfyxgdpwd`
4. Set secrets (KHÔNG commit key vào repo):
   - `supabase secrets set GEMINI_API_KEY=YOUR_KEY`
   - (tuỳ chọn) `supabase secrets set GEMINI_MODEL=gemini-1.5-flash`
5. Deploy function:
   - `supabase functions deploy translate`

## Fix CORS (preflight OPTIONS)

Nếu bạn thấy lỗi kiểu:
- “blocked by CORS policy”
- “Response to preflight request doesn't pass access control check”

Thì cần đảm bảo function không bị chặn ở layer JWT verify trước khi `OPTIONS` chạy.

File `supabase/functions/translate/config.toml` đã đặt:

- `verify_jwt = false`

Điều này giúp preflight `OPTIONS` trả về HTTP 200 OK kèm CORS headers.

## 2) Frontend Logic (Lấy text)

Frontend gọi:

- `supabase.functions.invoke("translate", { body: { q, target } })`

Trong đó:
- `q`: đoạn text được bôi đậm
- `target`: ngôn ngữ đích (ví dụ `vi`, `en`) — có thể lấy từ `profile.language`

## 3) UI (Hiển thị kết quả)

Reader hiển thị modal với:
- loading (`Đang dịch...`)
- error
- translated text
