# HTML Deployer (Notion 后端集成)

本项目是 HTML 部署器的修改版本，现已集成 Notion 作为后端，用于持久化存储已部署的 HTML 内容。

## 项目思路与解决方案概述

原始的 HTML 部署器将已部署的 HTML 内容存储在浏览器本地存储（`localStorage`）或直接存储在 URL 哈希中。虽然 URL 哈希方法允许共享和书签单个页面，但 `localStorage` 方法用于管理已部署项目的列表，仅限于单个浏览器/设备，并且缺乏持久性。

此更新版本利用 Notion 作为强大、基于云的数据库来存储所有已部署的 HTML 条目。这提供了：
-   **真正的持久性**：数据存储在 Notion 中，不会因清除缓存或更换设备而丢失。
-   **跨设备同步**：从任何设备访问您已部署的列表。
-   **协作**：您可以将 Notion 数据库分享给朋友，他们也可以向其中添加页面。
-   **改进的管理**：利用 Notion 丰富的界面来管理您的 HTML 条目。

一个小型 Node.js Express 服务器充当前端（稍后将重新实现）和 Notion API 之间的安全代理，确保您的 API 密钥永远不会在客户端暴露。

## Notion 集成详情

### 数据库 ID:
`23a028e7d48d80d499dadb3720bf26d5`

### API 密钥（敏感！请勿公开分享）：
`ntn_Gm686281869ayWzsPVp9sx1y2hHuZ4bJ5hBs4dQOOnkekG`
*注意：此密钥由用户提供。如果出现连接问题，请根据您的 Notion 集成页面中以 `secret_` 开头的密钥进行验证。*

### 数据库结构:
Notion 数据库应具有以下属性：
-   **页面标题**：`Title` 类型
-   **HTML代码**：`Text` 类型（用于完整的 HTML 内容）
-   **描述**：`Text` 类型（用于简短的描述/摘要）
-   **创建时间**：`Created time` 类型（由 Notion 自动管理）

## 当前项目状态

所有必要的后端服务器文件（`package.json`、`.env`、`.gitignore`、`server.js`）已在此目录（`/Users/lijiong/AI_chat/编程项目/html-deployer-main/`）中创建。

## 进度更新（最后更新：2025-07-24）

### ✅ 已完成：
1. **安装依赖项** - `npm install` 已成功执行，`node_modules` 文件夹已创建。
2. **本地运行测试** - 服务器已成功启动在 `http://localhost:3000`，无错误。Notion API 密钥和数据库 ID 配置正确。
3. **重新实现前端** - 已创建 `index.html`、`script.js`、`styles.css` 文件，实现了以下功能：
   - 部署新 HTML 页面到 Notion
   - 显示所有已部署的页面列表
   - 查看已部署页面（在新窗口打开）
   - 删除已部署页面
   - 响应式设计，支持移动端
4. **推送到 GitHub** - 代码已成功推送到 https://github.com/RanceLee233/html-deployer

### 🔄 待完成：

5.  **部署到 Vercel**：
    - 访问 [Vercel](https://vercel.com) 并登录
    - 点击 "New Project"
    - 导入 GitHub 仓库 `RanceLee233/html-deployer`
    - **Build and Output Settings**：
      - Build Command: **留空**（删除默认值）
      - Output Directory: **留空**（删除默认值）
      - Install Command: 保持默认 `npm install`
    - **环境变量设置**：
      - Key: `NOTION_API_KEY`
        Value: `ntn_Gm686281869ayWzsPVp9sx1y2hHuZ4bJ5hBs4dQOOnkekG`
      - Key: `NOTION_DATABASE_ID`  
        Value: `23a028e7d48d80d499dadb3720bf26d5`
    - 点击 "Deploy"

### 📝 本地测试方法：
1. 在一个终端窗口运行后端：`node server.js`
2. 在浏览器中打开 `index.html` 文件
3. 测试部署、查看、删除功能
