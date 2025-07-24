# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

HTML Deployer is a web application that allows users to deploy and manage HTML content using Notion as a backend database for persistent storage.

**当前版本：V1** - 已完成核心功能，支持哈希值存储架构

## V1版本特性

### 架构升级
- ✅ **哈希值存储架构**：突破Notion 2000字符限制
- ✅ **分享链接功能**：每个页面有独立分享URL
- ✅ **向后兼容**：支持新旧两种数据库结构
- ✅ **Vercel部署**：无服务器架构，自动扩展

### 技术栈
- **Frontend**: Vanilla HTML/CSS/JavaScript (`index.html`, `script.js`, `styles.css`)
- **Backend**: Node.js Express server (`server.js`) 
- **Storage**: Notion数据库 + Vercel文件系统
- **Deployment**: Vercel serverless functions

### 已完成功能
- [x] 哈希值存储架构
- [x] 分享链接生成
- [x] 页面CRUD操作
- [x] 跨域请求处理
- [x] 错误处理机制
- [x] Vercel部署配置

## V1架构详情

### 数据存储
- **Notion数据库**：存储元数据（标题、描述、哈希值、分享链接）
- **文件系统**：存储实际HTML内容（按MD5哈希命名）
- **存储路径**：Vercel的`/tmp`目录（无服务器环境）

### API端点
- `GET /api/health` - 健康检查
- `GET /api/deployments` - 获取所有部署页面
- `POST /api/deploy` - 创建新部署
- `GET /api/deployments/:id` - 获取单个页面详情
- `DELETE /api/deployments/:id` - 删除页面
- `GET /view/:hash` - 通过哈希值查看页面

### 数据库结构（V1）
- **页面标题**: Title类型
- **HTML哈希值**: Rich text类型（存储文件哈希）
- **描述**: Rich text类型
- **页面ID**: Rich text类型（唯一标识）
- **分享链接**: Rich text类型（完整URL）
- **创建时间**: Created time类型

## 开发信息

### 环境变量
- `NOTION_API_KEY`: Notion集成token
- `NOTION_DATABASE_ID`: 目标数据库UUID

### 本地开发
```bash
npm install
node server.js
# 访问 http://localhost:3000
```

### 部署状态
- **V1版本URL**: https://html-deployer-bnmhuoumf-rancelee233s-projects.vercel.app
- **GitHub仓库**: https://github.com/RanceLee233/html-deployer
- **部署状态**: ✅ 已部署，功能完整

## 即将开发：V2版本

### 计划功能
- [ ] **页面预览卡片**：显示HTML页面缩略图
- [ ] **可视化预览**：卡片式布局，包含预览图
- [ ] **一键操作**：复制、查看、删除按钮集成
- [ ] **响应式设计**：更好的移动端体验
- [ ] **批量操作**：多页面管理

### 技术规划
- 保持现有API向后兼容
- 前端UI重构为卡片式布局
- 添加页面缩略图生成功能
- 优化用户体验

## 注意事项

### 重要提醒
- **V1版本已稳定**：当前版本可以正常使用
- **数据安全**：重要页面建议本地备份
- **Vercel限制**：文件存储在临时目录，但哈希值持久化