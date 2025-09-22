# TOP 945 音檔爬蟲與 QR 掃描器

一個專為 TOP 945 設計的網頁版音檔爬蟲工具，內建 QR Code 掃描功能。此工具讓您可以輕鬆掃描雜誌上的 QR Code ，並自動下載 TOP 945 的音檔內容。

## ✨ 功能特色

- 📱 **QR Code 掃描器**：內建攝影機式 QR Code 掃描功能
- 🔗 **網址重定向追蹤**：自動追蹤短網址和 JavaScript 重定向
- 🔊 **音效回饋**：偵測到有效網址時播放成功提示音
- 📁 **整理下載**：自訂資料夾命名以便整理檔案
- 🎵 **批次處理**：同時下載多個音檔集合
- 🌐 **網頁介面**：清爽響應式的網頁操作界面

## 🚀 快速開始

### 系統需求

- Node.js (v14 或更高版本)
- Yarn 或 npm

### 安裝

```bash
# 複製專案
git clone https://github.com/unayung/express-crawler-top945.git
cd express-crawler-top945

# 安裝相依套件
yarn install
# 或
npm install
```

### 使用方法

1. **啟動伺服器**

   ```bash
   node index.js
   # 或開發模式（自動重啟）
   nodemon index.js
   ```

2. **開啟網頁介面**

   ```
   http://localhost:3456
   ```

3. **使用 QR 掃描器**
   - 輸入資料夾名稱
   - 點選「📱 掃描 QR」按鈕
   - 將攝影機對準 TOP 945 雜誌上的 QR Code
   - 當全部掃描完畢時，按下 Start Crawling
   - 音檔檔案會自動下載到 `./downloads/[資料夾名稱]/`

## 🛠️ 技術架構

- **後端**：Node.js、Express.js
- **網頁爬蟲**：Puppeteer（無頭瀏覽器）
- **QR 掃描**：html5-qrcode 函式庫
- **音效**：Web Audio API 回饋音效
- **檔案處理**：fs-extra、node-fetch

## 📡 API 端點

### `GET /`

應用程式的主要網頁介面。

### `POST /expand-url`

展開短網址並追蹤 JavaScript 重定向。

**請求內容：**

```json
{
  "url": "http://short.url/abc123"
}
```

**回應：**

```json
{
  "originalUrl": "http://short.url/abc123",
  "finalUrl": "https://www.top945.com.tw/service/mp3C/index?TheGUID=...",
  "isTop945": true
}
```

### `POST /crawl`

開始爬蟲和下載程序。

**請求內容：**

```json
{
  "inputs": [
    {
      "folderName": "第一集",
      "url": "https://www.top945.com.tw/service/mp3C/index?TheGUID=..."
    }
  ]
}
```

## 📂 專案結構

```
express-crawler-top945/
├── index.js              # 主要應用程式檔案
├── package.json           # 相依套件和腳本
├── downloads/             # 下載的音檔檔案（自動建立）
├── README.md             # 說明文件
└── CLAUDE.md             # 開發指引
```

## 🔧 設定

應用程式預設在 `3456` 埠執行。您可以在 `index.js` 中修改：

```javascript
const port = 3456; // 修改此行
```

## 📱 QR Code 掃描器功能

- **智慧網址偵測**：自動偵測 TOP 945 網址
- **重定向追蹤**：處理雜誌上的短網址
- **音效回饋**：掃描到有效網址時播放成功提示音
- **錯誤處理**：對無效 QR Code 顯示清楚的錯誤訊息
- **處理鎖定**：防止同時進行多個掃描

## ⚠️ 重要聲明

**使用風險自負，請尊重版權法律！**

此工具僅供教育和個人使用。使用者須負責：

- 遵守版權法和智慧財產權
- 確保有權限下載相關內容
- 遵循 TOP 945 的服務條款
- 遵守所有適用的本地和國際法律

## 🤝 貢獻

1. Fork 此專案
2. 建立功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交您的更改 (`git commit -m 'Add amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 開啟 Pull Request

## 📄 授權

此專案採用 MIT 授權 - 詳見 [LICENSE](LICENSE) 檔案。

## 🙋‍♂️ 支援

如果您遇到任何問題或有疑問：

1. 檢查現有的 [Issues](https://github.com/unayung/express-crawler-top945/issues)
2. 建立新的 issue 並提供詳細資訊
3. 請包含您的 Node.js 版本和作業系統

## 🌟 致謝

- TOP 945 提供音檔內容
- 開源社群提供此專案使用的優秀函式庫
- 協助改進此工具的貢獻者們

---

_請記住，務必遵守版權法律並負責任地使用此工具。_
