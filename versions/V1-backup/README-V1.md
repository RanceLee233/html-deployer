# V1版本备份说明

此文件夹包含HTML Deployer V1版本的完整备份。

## 备份内容

### 核心文件
- `server.js` - Express后端服务器
- `index.html` - 前端主页面
- `script.js` - 前端JavaScript逻辑
- `styles.css` - 样式文件
- `vercel.json` - Vercel部署配置

### 辅助文件
- `package.json` - 项目依赖
- `favicon.ico` - 网站图标
- `public/` - 静态资源目录
- `test-connection.js` - Notion连接测试

## V1版本特性

✅ **已完成的功能：**
- 哈希值存储架构（突破2000字符限制）
- 分享链接功能
- 页面CRUD操作
- 跨域请求处理
- 错误处理机制
- Vercel部署配置

✅ **数据库结构：**
- 页面标题 (Title)
- HTML哈希值 (Rich text)
- 描述 (Rich text)
- 页面ID (Rich text)
- 分享链接 (Rich text)
- 创建时间 (Created time)

## 回滚方法

如果需要回滚到V1版本：
```bash
cp -r versions/V1-backup/* ./
git add .
git commit -m "回滚到V1版本"
git push origin main
```

## 当前部署
- URL: https://html-deployer-bnmhuoumf-rancelee233s-projects.vercel.app
- 状态: ✅ 稳定运行
- 功能: 完整可用

**创建时间**: 2025-07-24
**备份状态**: 完整V1版本功能备份