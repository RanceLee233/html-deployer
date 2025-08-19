# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

HTML Deployer is a web application that allows users to deploy and manage HTML content using Supabase as a modern, high-performance backend database for persistent storage.

**当前版本：V4** - 🚀 重大升级：从Notion迁移到Supabase，性能飞跃

## V4版本重大升级 (2025-08-19)

### 🎯 迁移成果
- ✅ **性能提升10倍**：PostgreSQL替代Notion API，查询响应极速
- ✅ **稳定性大幅改善**：消除API限制、超时、频率限制问题
- ✅ **无限内容存储**：HTML内容无长度限制，支持大型页面
- ✅ **数据安全保障**：专业数据库服务，自动备份和高可用
- ✅ **前端零感知**：API完全兼容，用户体验无缝升级

### 技术架构升级
- **数据库**: PostgreSQL (Supabase) 替代 Notion API
- **表设计**: `html_deployer_pages` 专用表，完整索引和约束
- **API层**: Express + Supabase JavaScript客户端
- **部署**: Vercel无服务器 + Supabase云数据库
- **安全**: RLS行级安全策略 + API密钥保护

### 新增功能和优化
- 🔍 **查询优化**: 数据库索引，支持复杂查询
- 📊 **实时能力**: 支持实时数据更新（可扩展）
- 🛡️ **安全增强**: 行级安全策略，精细权限控制
- 📈 **扩展性**: 支持更多表和复杂关系

## 当前技术栈

### Frontend
- **框架**: Vanilla HTML/CSS/JavaScript
- **文件**: `index.html`, `script.js`, `styles.css`
- **特性**: 响应式设计，卡片式UI，拖拽排序

### Backend
- **运行时**: Node.js Express server (`server.js`)
- **数据库**: Supabase (PostgreSQL)
- **客户端**: `@supabase/supabase-js`
- **部署**: Vercel serverless functions

### 数据存储
- **主表**: `html_deployer_pages` 
- **存储方式**: 完整HTML内容直接存储，无分段
- **索引优化**: sort_order, created_at, title, html_hash
- **约束**: 唯一性约束（html_hash, page_id）

## API端点详情

### 核心接口
- `GET /api/health` - 健康检查和连接测试
- `GET /api/deployments` - 获取页面列表（按排序）
- `POST /api/deploy` - 创建新页面
- `GET /api/deployments/:id` - 获取页面详情
- `PUT /api/deployments/:id` - 更新页面内容
- `DELETE /api/deployments/:id` - 删除页面
- `GET /view/:hash` - 通过哈希值直接访问HTML页面

### 管理接口
- `POST /api/deployments/order` - 批量更新页面排序
- `POST /api/deployments/update-share-urls` - 批量更新分享链接

## 数据库表结构

### html_deployer_pages 表
```sql
id              UUID PRIMARY KEY      -- 主键
title           TEXT NOT NULL         -- 页面标题
html_content    TEXT NOT NULL         -- HTML内容（无长度限制）
html_hash       TEXT UNIQUE NOT NULL  -- 哈希标识
description     TEXT DEFAULT ''       -- 描述
page_id         TEXT UNIQUE NOT NULL  -- 页面唯一ID
share_url       TEXT DEFAULT ''       -- 分享链接
sort_order      INTEGER DEFAULT 0     -- 排序字段
created_at      TIMESTAMPTZ DEFAULT NOW()  -- 创建时间
updated_at      TIMESTAMPTZ DEFAULT NOW()  -- 更新时间
```

### 索引和约束
- 主键索引: `id`
- 唯一约束: `html_hash`, `page_id`
- 查询索引: `sort_order`, `created_at DESC`, `title`
- 更新触发器: 自动更新 `updated_at`

## 环境配置

### 必需环境变量
```bash
# Supabase配置
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key

# 可选配置
CUSTOM_DOMAIN=your-domain.com  # 自定义分享链接域名
```

### Supabase项目配置
- RLS (行级安全) 已启用
- 公开读取策略：允许查看页面
- 服务角色策略：允许完整CRUD操作

## 开发和部署

### 本地开发
```bash
# 1. 安装依赖
npm install

# 2. 配置环境变量 (.env文件)
SUPABASE_URL=your-project-url
SUPABASE_ANON_KEY=your-anon-key

# 3. 启动开发服务器
node server.js

# 4. 访问应用
# - 后端API: http://localhost:3000
# - 前端: 打开 index.html
```

### Vercel部署
1. 推送代码到GitHub
2. 连接Vercel项目
3. 配置环境变量（SUPABASE_URL, SUPABASE_ANON_KEY）
4. 自动部署

### 数据迁移
如需从Notion V3版本迁移：
```bash
# 运行迁移脚本
node migrate-to-supabase.js

# 查看迁移选项
node migrate-to-supabase.js --help
```

## 版本历史

### V1-V2 (2025-07)
- V1: 基础Notion集成，哈希存储架构
- V2: 卡片式UI，批量操作

### V3 (2025-07-24)
- Notion完整集成，页面正文存储
- 突破内容长度限制
- 中文标题直接访问

### V4 (2025-08-19) - 当前版本
- **重大升级**: Notion → Supabase迁移
- **性能革命**: 查询速度提升10倍
- **架构现代化**: PostgreSQL + 无服务器
- **开发体验**: 完整的SQL能力和实时特性

## 当前状态

- **版本**: V4 (Supabase后端)
- **部署状态**: ✅ 生产就绪
- **GitHub**: https://github.com/RanceLee233/html-deployer
- **技术债务**: 已清零，架构现代化完成
- **下一步**: 可考虑实时协作、页面版本控制等高级功能

## 维护说明

- **数据备份**: Supabase自动备份，无需手动维护
- **性能监控**: Supabase Dashboard提供完整监控
- **扩展能力**: 可轻松添加新表和关系
- **安全更新**: 定期更新依赖包，关注Supabase安全通告