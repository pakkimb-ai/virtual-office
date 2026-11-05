# 虛擬辦公室 🎃

萬聖節 Three.js 真 3D 辦公室（可拖轉／撳工位）。

https://pakkimb-ai.github.io/virtual-office/?v=18a1

## Assets（CC0）

| Pack | Source | License | Used for |
|------|--------|---------|----------|
| KayKit Furniture Bits 1.0 | [Kay Lousberg](https://kaylousberg.itch.io/furniture-bits) | CC0 | 枱、椅、燈、書架、相框、盆栽、櫃 |
| KayKit Adventurers 1.0 | [Kay Lousberg](https://kaylousberg.itch.io/kaykit-adventurers) | CC0 | 四個工位角色（`assets/kaykit/chars/`） |
| Kenney Furniture Kit | [Kenney.nl](https://kenney.nl/assets/furniture-kit) via [OpenGameArt](https://opengameart.org/content/furniture-kit) | CC0 | 螢幕、鍵盤、滑鼠 |
| Kenney UI Pack | [Kenney.nl](https://kenney.nl/assets/ui-pack) via OpenGameArt | CC0 | UI 色條／圖示（`assets/ui/`） |

四人崗位：隊長 Knight、開發 Rogue、美術 Mage、策劃 Barbarian。螢幕 IDE／預覽／文件／色板為 canvas 自繪；窗簾為半透明蕾絲布簾貼圖（自繪）。唔使用任天堂／動森官方貼圖。

## 狀態通道（Gate A）

角色行去邊，由真實狀態推動，唔係計時器假郁。每個 bot push 一行狀態；畫面氣泡只顯示 `line`。未收到該 bot 嘅狀態之前，角色留喺原位（同 v17b4 一樣企喺自己枱前）。

| id | 角色 | 工位名牌 |
|----|------|----------|
| `grok` | 隊長 | 隊長 |
| `write` | 策劃 | 策劃 |
| `design` | 設計 | 美術 |
| `ai` | 開發 | 開發 |

`state`：`working`、`waiting`、`done`、`error`、`idle`。`line` 最多 20 字（粵語／中文可以）。`updatedAt` 由 Worker 寫入，bot 唔使自己填。

| state | 去邊 | 姿勢 |
|-------|------|------|
| `working` / `waiting` / `error` | 自己張枱 | 坐低、面向枱（KayKit `Sit_Chair_Idle`） |
| `idle` / `done` | 地氈邊臨時閒位 | 企住（`Unarmed_Idle`），面向地氈中心 |
| 交接去玻璃房 | 今次唔做 | — |

`working` 超過 **10 分鐘**冇更新會當過期（人留喺枱，撳工位徽章顯示「冇更新」）。任何狀態超過 **45 分鐘**冇心跳，畫面頂會有一行細提示。做緊嘢至少每 10 分鐘 push 一次；閒緊都至少每 45 分鐘 push 一次，先唔會當冇心跳。

建議 push 時機：開工、進度、等 Pak、出錯、搞掂。

### Worker

`worker/` 係 Cloudflare Worker + Durable Object（`StatusBoard`），一個辦公室一份狀態。

```bash
cd worker
npm install
npx wrangler dev --port 8787
# 部署：npx wrangler login && npx wrangler deploy
# 要鎖 POST：npx wrangler secret put STATUS_TOKEN
```

未設 `STATUS_TOKEN` 時，POST 係開嘅，方便本機試。設咗之後要帶 `Authorization: Bearer <token>`。GET 同 WebSocket 一直公開，等 GitHub Pages 睇到。

```bash
API=http://127.0.0.1:8787

curl -s -X POST "$API/api/status" -H 'content-type: application/json' \
  -d '{"id":"grok","state":"working","line":"對齊閘 A"}'

curl -s -X POST "$API/api/status" -H 'content-type: application/json' \
  -d '{"id":"write","state":"waiting","line":"等 Pak 拍板"}'

curl -s -X POST "$API/api/status" -H 'content-type: application/json' \
  -d '{"id":"design","state":"idle","line":"得閒"}'

curl -s -X POST "$API/api/status" -H 'content-type: application/json' \
  -d '{"id":"ai","state":"error","line":"測試失敗"}'

curl -s -X POST "$API/api/status" -H 'content-type: application/json' \
  -d '{"id":"ai","state":"done","line":"搞掂"}'

curl -s "$API/api/status"
```

有 token 時加 `-H "authorization: Bearer $STATUS_TOKEN"`。

### 前端點樣接

靜態頁仍然係 GitHub Pages。`js/status-config.js` 嘅 `STATUS_API` 而家係空，所以正式網址唔會自己郁。預覽時加 query：

```text
http://127.0.0.1:4173/?api=http://127.0.0.1:8787&v=18a1
https://pakkimb-ai.github.io/virtual-office/?v=18a1&api=https://<your-worker>.workers.dev
```

另一個終端機開靜態頁：`python3 -m http.server 4173`。頁面會 poll `GET /api/status`，同時訂 `WS /api/status/ws`。

部署 Worker 之後，將 origin 寫入 `STATUS_API`（唔好加尾斜線），Pages 就唔使靠 `?api=`。

```bash
npm test
```
