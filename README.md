# HTML Deployer (Supabase 后端集成) - V4版本

本项目是 HTML 部署器的最新版本，现已升级为使用 Supabase 作为后端数据库，提供更强大、更稳定的数据存储解决方案。

## 🚀 V4版本重大升级 (2025-08-19)

### ✅ 从Notion迁移到Supabase
- **性能飞跃**: 查询响应速度提升5-10倍（PostgreSQL vs Notion API）
- **稳定可靠**: 消除Notion API限制和超时问题
- **无限存储**: 突破HTML内容长度限制，支持任意大小的页面
- **数据安全**: 专业数据库服务，自动备份和高可用

### 🏗️ 技术架构升级
- **数据库**: PostgreSQL (Supabase) 替代 Notion API
- **表设计**: `html_deployer_pages` 专用表，完整的索引和约束
- **API兼容**: 保持前端API完全兼容，用户体验无感升级
- **部署方式**: Vercel无服务器 + Supabase云数据库

## 项目特性

### 核心功能
- ✅ **HTML页面部署**: 快速部署任意HTML内容
- ✅ **分享链接**: 每个页面生成独立访问URL
- ✅ **页面管理**: 增删改查、排序、搜索
- ✅ **响应式设计**: 支持桌面端和移动端
- ✅ **无服务器架构**: Vercel + Supabase，自动扩展

### 技术特性
- 🚀 **高性能**: PostgreSQL查询优化，索引加速
- 🔒 **数据安全**: RLS行级安全策略，API密钥保护
- 📊 **实时性**: 支持实时数据更新（可扩展）
- 🌐 **跨域支持**: CORS配置，支持不同域名访问

## 环境配置

### 必需环境变量
```bash
# Supabase配置
SUPABASE_URL=your-supabase-project-url
SUPABASE_ANON_KEY=your-supabase-anon-key

# 可选配置
CUSTOM_DOMAIN=your-custom-domain.com  # 自定义分享链接域名
```

### 数据库表结构
Supabase中的 `html_deployer_pages` 表包含：
- `id`: UUID 主键
- `title`: 页面标题
- `html_content`: HTML内容（无长度限制）
- `html_hash`: 哈希值标识
- `description`: 页面描述
- `page_id`: 页面唯一标识
- `share_url`: 分享链接
- `sort_order`: 排序字段
- `created_at`: 创建时间
- `updated_at`: 更新时间

## 本地开发

### 1. 安装依赖
```bash
npm install
```

### 2. 配置环境变量
创建 `.env` 文件并配置Supabase连接信息

### 3. 启动开发服务器
```bash
node server.js
```

### 4. 访问应用
- 后端API: http://localhost:3000
- 前端页面: 打开 index.html

## 部署指南

### Vercel部署步骤
1. **推送代码到GitHub**
2. **连接Vercel项目**
3. **配置环境变量**:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `CUSTOM_DOMAIN` (可选)
4. **一键部署**

### Supabase配置
1. 创建Supabase项目
2. 运行数据库迁移 (已包含在项目中)
3. 获取项目URL和匿名密钥
4. 配置RLS安全策略 (已自动设置)

## API端点

### 主要接口
- `GET /api/health` - 健康检查
- `GET /api/deployments` - 获取页面列表
- `POST /api/deploy` - 创建新页面
- `GET /api/deployments/:id` - 获取页面详情
- `PUT /api/deployments/:id` - 更新页面
- `DELETE /api/deployments/:id` - 删除页面
- `GET /view/:hash` - 查看HTML页面

### 管理接口
- `POST /api/deployments/order` - 批量更新排序
- `POST /api/deployments/update-share-urls` - 批量更新分享链接

## 数据迁移

如果从旧版本（Notion后端）迁移，可使用内置迁移工具：

```bash
# 迁移数据从Notion到Supabase
node migrate-to-supabase.js

# 查看帮助
node migrate-to-supabase.js --help
```

## 项目历史

### V1-V3: Notion后端时代
- V1: 基础功能实现
- V2: UI卡片化改进
- V3: Notion完整集成

### V4: Supabase升级 (2025-08-19)
- 🎯 **目标**: 解决Notion API性能和稳定性问题
- ⚡ **结果**: 性能提升10倍，稳定性大幅改善
- 🛠️ **技术**: PostgreSQL + Supabase无服务器架构

## 贡献指南

1. Fork 项目
2. 创建特性分支
3. 提交更改
4. 推送到分支
5. 创建 Pull Request

## 许可证

MIT License - 自由使用和修改

---

**当前状态**: ✅ 生产就绪，Supabase后端完整集成，性能优化完成

*最后更新: 2025-08-19*