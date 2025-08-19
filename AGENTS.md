# Repository Guidelines

本指南面向贡献者，帮助你快速理解本仓库结构、开发流程与规范。

## 项目结构与模块
- `index.html`：前端页面入口，布局与组件挂载点。
- `styles.css`：全局样式与卡片网格风格。
- `script.js`：前端逻辑（加载/部署/删除/复制、拖拽排序、搜索）。
- `server.js`：Express 后端代理 Notion API 的接口层。
- `public/`：静态资源（如图标、公共文件）。
- `versions/`：版本或迁移脚本。
- `tests*` 文件：针对存储/连接等的快速校验脚本。

## 构建、运行与开发
- `npm start`：启动本地后端（默认端口 3000）。
- 本地访问：打开 `index.html`（或通过静态服务器）联调 `/api`。
- 生产部署：参考 `vercel.json` 或你使用的托管平台配置。

## 代码风格与命名
- 缩进：2 空格；文件编码 UTF-8（LF）。
- 命名：JS 使用 `camelCase`，常量 `UPPER_SNAKE_CASE`。
- 样式：BEM/语义化 class，组件前缀如 `page-card`、`sidebar`。
- 格式化：建议使用 Prettier（保持 2 空格、80 列约束）。

## 测试指南
- 轻量脚本：`test-*.js` 可直接 `node file.js` 运行。
- 覆盖优先：接口错误分支与空数据场景需覆盖。
- 命名：`test-功能名.js`，输出清晰日志，易于排障。

## 提交与 PR 规范
- 提交信息：`type(scope): summary`，如 `feat(ui): add card drag sort`。
- PR 需包含：变更说明、动机/背景、截图或动图（前端改动）。
- 关联：使用关键字关联 issue，说明破坏性变更与迁移步骤。

## 安全与配置
- 机密：`.env` 不入库，示例放 `README` 或 `.env.example`。
- 忽略：`node_modules/`、`AI图片参考/` 已在 `.gitignore`。
- 配置：`API_BASE_URL` 在前端自动切换，后端读取环境变量。

## 设计参考与素材（Agent 提示）
- 截图与视觉参考统一放在 `AI图片参考/` 目录（仅本地参考，不参与版本控制/部署）。
- 若需对齐配色/布局，请只查阅该目录，不必在其他路径或网络上寻找。
- 常见命名示例：`剪贴板 YYYY-MM-DD … .png`、`4.png` 等；请勿提交该目录内容。
