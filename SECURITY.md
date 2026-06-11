# 資安檢查報告與防護措施

本文件記錄系統的資安審查結果：已發現並修補的問題、既有的防護設計，以及上線前的注意事項。

## 已修補的問題

| # | 問題 | 風險 | 修補方式 |
|---|------|------|----------|
| 1 | 密碼以無鹽 SHA-256 儲存 | 中：資料庫外洩時可被彩虹表破解 | 改為 **scrypt + 每帳號隨機鹽值**（`src/lib/password.ts`）；舊帳號於下次登入時自動升級雜湊 |
| 2 | 登入無速率限制 | 中：可暴力破解密碼 | 每 IP 每分鐘最多 5 次登入嘗試（429 回應） |
| 3 | Session HMAC 用 `===` 比較 | 低：理論上的時序攻擊 | 改用 `crypto.timingSafeEqual` 常數時間比較 |
| 4 | Session cookie 未設 `secure` | 中：HTTP 下可被竊聽 | 正式環境（`NODE_ENV=production`）強制 `secure` |
| 5 | 公開預約 API 無輸入驗證與限流 | 中：可灌入垃圾資料、洗爆簡訊 | Zod schema 驗證（姓名/電話格式與長度）＋ 每 IP 每分鐘 10 次限流 |
| 6 | 無 CSRF 防護 | 中：跨站偽造請求 | 雙重防線：cookie `SameSite=Lax` ＋ middleware 檢查變更類請求（POST/PATCH/DELETE）的 `Origin` 必須同源 |
| 7 | 無安全性 HTTP 標頭 | 低-中：點擊劫持、MIME 嗅探 | `next.config.mjs` 加入 CSP、X-Frame-Options: DENY、X-Content-Type-Options、Referrer-Policy、Permissions-Policy |
| 8 | `AUTH_SECRET` 有預設值可被猜測 | 高（若上線未改）：可偽造任意 session | 正式環境啟動時若未設定強密鑰直接拋錯拒絕啟動 |
| 9 | SQLite 資料庫曾被提交至 git | 中：示範密碼雜湊外洩 | 已自版控移除並加入 `.gitignore` |
| 10 | 線上預約可繞過休假日 | 低：資料一致性 | 預約 API 補上排班檢查 |

## 既有的防護設計

- **認證**：HMAC-SHA256 簽章的 httpOnly session cookie，7 天效期，登出即銷毀；停用帳號的 session 立即失效（每次請求都重新驗證在職狀態）。
- **授權（RBAC）**：三級角色（ADMIN / MANAGER / STAFF）。薪資、員工管理、服務價目、庫存、通知、跨店報表等 API 與頁面皆在伺服器端逐一檢查權限，非僅前端隱藏。
- **店長無法修改管理者帳號**；員工只能查看自己的薪資與業績。
- **金額以資料庫為準**：POS 結帳價格、訂金金額一律從資料庫讀取重算，不信任前端傳入的金額；折扣上限為小計。
- **餘額與庫存檢查**：儲值金不足、庫存不足在交易中檢查並以 Prisma transaction 確保一致性。
- **ORM 參數化查詢**：全面使用 Prisma，無字串拼接 SQL，杜絕 SQL injection。
- **React 自動轉義輸出**，未使用 `dangerouslySetInnerHTML`，降低 XSS 風險；CSP 再加一層防護。
- **卡號不落地**：示範付款頁的卡號欄位僅存在於瀏覽器，不傳送、不儲存。正式環境應由金流商（ECPay / NewebPay / Stripe）的付款頁或 SDK 處理卡號，伺服器只接收 webhook 結果並驗證簽章。
- **Cron 端點**：`/api/notifications/remind` 需店長以上權限或 `CRON_SECRET` header。

## 上線前檢查清單

1. `AUTH_SECRET` 設定為 32 bytes 以上隨機值（`openssl rand -base64 32`）。
2. 全站強制 HTTPS（建議由反向代理或平台層處理，並開啟 HSTS）。
3. 資料庫改用 PostgreSQL，限制網路存取來源，開啟每日備份。
4. 簡訊金鑰、金流金鑰只放環境變數，絕不進版控。
5. 多節點部署時，將記憶體限流（`src/lib/rate-limit.ts`）改為 Redis。
6. 串接真實金流時務必驗證 webhook 簽章，並以金流商回傳金額為準。
7. 設定錯誤監控（如 Sentry）與存取日誌保留。
8. 個資（顧客電話、生日、備註）屬個資法範疇：限制匯出權限、留存存取紀錄、提供刪除機制。

## 回報弱點

發現安全問題請寄信至系統管理者信箱，請勿公開揭露。
