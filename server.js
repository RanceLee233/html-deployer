require('dotenv').config();
const express = require('express');
const { Client } = require('@notionhq/client');
const cors = require('cors');
const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

// 初始化Notion客户端
const notion = new Client({ auth: process.env.NOTION_API_KEY });
const databaseId = process.env.NOTION_DATABASE_ID;

// 中间件
app.use(cors());
app.use(express.json());

// HTML内容存储目录 - 适配Vercel无服务器环境
const HTML_STORAGE_DIR = process.env.VERCEL 
    ? path.join('/tmp', 'html_storage') 
    : path.join(__dirname, 'html_storage');

// 确保存储目录存在
async function ensureStorageDir() {
    try {
        await fs.mkdir(HTML_STORAGE_DIR, { recursive: true });
    } catch (error) {
        console.error('创建存储目录失败:', error);
    }
}

// 生成HTML内容的哈希值
function generateHash(content) {
    return crypto.createHash('md5').update(content).digest('hex');
}

// 保存HTML内容到Notion数据库（使用新字段存储完整内容）
async function saveHtmlContent(content) {
    const hash = generateHash(content);
    return hash;
}

// 从Notion数据库读取HTML内容
async function getHtmlContent(hash) {
    try {
        // 通过哈希值查找对应的Notion页面
        const response = await notion.databases.query({
            database_id: databaseId,
            filter: {
                property: 'HTML哈希值',
                rich_text: {
                    equals: hash
                }
            }
        });
        
        if (response.results.length > 0) {
            const page = response.results[0];
            // 从页面内容中获取HTML
            const content = page.properties['完整HTML内容']?.rich_text[0]?.plain_text;
            if (content) {
                return content;
            }
            
            // 如果没有完整HTML内容字段，尝试旧字段
            const oldContent = page.properties['HTML代码']?.rich_text[0]?.plain_text;
            if (oldContent) {
                return oldContent;
            }
        }
        
        return null;
    } catch (error) {
        console.error('从Notion读取HTML内容失败:', error);
        throw error;
    }
}

// 删除HTML内容（通过归档Notion页面）
async function deleteHtmlContent(hash) {
    try {
        const response = await notion.databases.query({
            database_id: databaseId,
            filter: {
                property: 'HTML哈希值',
                rich_text: {
                    equals: hash
                }
            }
        });
        
        if (response.results.length > 0) {
            const pageId = response.results[0].id;
            await notion.pages.update({
                page_id: pageId,
                archived: true
            });
            return true;
        }
        
        return false;
    } catch (error) {
        console.error('删除HTML内容失败:', error);
        throw error;
    }
}

// --- API 路由 ---

// 健康检查端点
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        environment: {
            hasNotionApiKey: !!process.env.NOTION_API_KEY,
            hasNotionDatabaseId: !!process.env.NOTION_DATABASE_ID,
            notionDatabaseId: process.env.NOTION_DATABASE_ID || 'not set'
        }
    });
});

// 1. 获取所有已部署的页面
app.get('/api/deployments', async (req, res) => {
    try {
        // 添加环境变量检查
        if (!process.env.NOTION_API_KEY || !process.env.NOTION_DATABASE_ID) {
            console.error('环境变量缺失:', {
                hasApiKey: !!process.env.NOTION_API_KEY,
                hasDatabaseId: !!process.env.NOTION_DATABASE_ID
            });
            return res.status(500).json({ 
                error: '服务器配置错误：缺少必需的环境变量',
                details: {
                    hasApiKey: !!process.env.NOTION_API_KEY,
                    hasDatabaseId: !!process.env.NOTION_DATABASE_ID
                }
            });
        }

        console.log('尝试连接Notion数据库:', databaseId);
        const response = await notion.databases.query({
            database_id: databaseId,
            sorts: [
                {
                    property: '创建时间',
                    direction: 'descending',
                },
            ],
        });

        // 格式化返回的数据 - 兼容旧数据库结构
        const pages = response.results.map(page => {
            const properties = page.properties;
            
            // 兼容旧字段和新字段
            const hasNewStructure = properties['HTML哈希值'] !== undefined;
            const hasOldStructure = properties['HTML代码'] !== undefined;
            
            return {
                id: page.id,
                title: properties.页面标题?.title[0]?.plain_text || '无标题',
                htmlHash: hasNewStructure ? properties['HTML哈希值']?.rich_text[0]?.plain_text || '' : '',
                htmlContent: hasOldStructure ? properties['HTML代码']?.rich_text[0]?.plain_text || '' : '',
                description: properties.描述?.rich_text[0]?.plain_text || '',
                createdAt: page.created_time,
                shareUrl: properties['分享链接']?.rich_text[0]?.plain_text || '',
                pageId: properties['页面ID']?.rich_text[0]?.plain_text || ''
            };
        });

        console.log(`成功获取 ${pages.length} 个页面`);
        res.json(pages);
    } catch (error) {
        console.error('获取页面失败:', error);
        res.status(500).json({ 
            error: '无法从Notion获取页面',
            details: error.message,
            code: error.code
        });
    }
});

// 2. 创建一个新页面
app.post('/api/deploy', async (req, res) => {
    const { title, htmlContent, description } = req.body;

    if (!title || !htmlContent) {
        return res.status(400).json({ error: '标题和HTML内容不能为空' });
    }

    try {
        // 确保存储目录存在
        await ensureStorageDir();
        
        // 生成HTML内容的哈希值并保存到文件系统
        const htmlHash = await saveHtmlContent(htmlContent);
        
        // 生成唯一页面ID和分享URL
        const pageId = Date.now().toString(36) + Math.random().toString(36).substr(2);
        const shareUrl = `${req.protocol}://${req.get('host')}/view/${htmlHash}`;
        
// 获取数据库结构以确定使用哪种字段
        const database = await notion.databases.retrieve({
            database_id: databaseId
        });
        
        const hasNewStructure = database.properties['HTML哈希值'] !== undefined;
        const properties = {
            '页面标题': {
                title: [
                    {
                        text: {
                            content: title,
                        },
                    },
                ],
            },
            '描述': {
                rich_text: [
                    {
                        text: {
                            content: description || '',
                        },
                    },
                ],
            },
        };
        
        // 新架构：使用哈希值和完整HTML内容
        if (hasNewStructure) {
            properties['HTML哈希值'] = {
                rich_text: [
                    {
                        text: {
                            content: htmlHash,
                        },
                    },
                ],
            };
            properties['完整HTML内容'] = {
                rich_text: [
                    {
                        text: {
                            content: htmlContent,
                        },
                    },
                ],
            };
            properties['页面ID'] = {
                rich_text: [
                    {
                        text: {
                            content: pageId,
                        },
                    },
                ],
            };
            properties['分享链接'] = {
                rich_text: [
                    {
                        text: {
                            content: shareUrl,
                        },
                    },
                ],
            };
        } else {
            // 旧架构：使用HTML代码字段（截断处理）
            const truncatedHtml = htmlContent.length > 2000 ? htmlContent.substring(0, 2000) + '...' : htmlContent;
            properties['HTML代码'] = {
                rich_text: [
                    {
                        text: {
                            content: truncatedHtml,
                        },
                    },
                ],
            };
        }
        
        // 在Notion中创建记录
        const response = await notion.pages.create({
            parent: { database_id: databaseId },
            properties: properties,
        });
        
        // 返回格式化的响应
        res.status(201).json({
            success: true,
            id: response.id,
            pageId: pageId,
            htmlHash: htmlHash,
            shareUrl: shareUrl,
            message: '页面创建成功'
        });
    } catch (error) {
        console.error('创建页面失败:', error);
        res.status(500).json({ 
            error: '无法在Notion中创建页面',
            details: error.message,
            code: error.code
        });
    }
});

// 3. 获取单个页面详情
app.get('/api/deployments/:id', async (req, res) => {
    const pageId = req.params.id;
    
    try {
        const response = await notion.pages.retrieve({ page_id: pageId });
        
        // 兼容旧和新数据库结构
        const properties = response.properties;
        let htmlContent = '';
        let htmlHash = '';
        
        // 检查是新结构还是旧结构
        if (properties['HTML哈希值']) {
            // 新结构：有哈希值字段
            htmlHash = properties['HTML哈希值']?.rich_text[0]?.plain_text || '';
            if (htmlHash) {
                htmlContent = await getHtmlContent(htmlHash) || '';
            }
        } else if (properties['HTML代码']) {
            // 旧结构：直接存储HTML代码
            htmlContent = properties['HTML代码']?.rich_text[0]?.plain_text || '';
        }
        
        // 格式化返回的数据
        const page = {
            id: response.id,
            title: response.properties.页面标题.title[0]?.plain_text || '无标题',
            htmlContent: htmlContent,
            htmlHash: htmlHash,
            description: response.properties.描述.rich_text[0]?.plain_text || '',
            createdAt: response.created_time,
            shareUrl: response.properties.分享链接.rich_text[0]?.plain_text || '',
            pageId: response.properties.页面ID.rich_text[0]?.plain_text || ''
        };
        
        res.json(page);
    } catch (error) {
        console.error('获取页面详情失败:', error);
        res.status(500).json({ error: '无法获取页面详情' });
    }
});

// 4. 删除页面
app.delete('/api/deployments/:id', async (req, res) => {
    const pageId = req.params.id;
    
    try {
        // 首先获取页面信息
        const pageResponse = await notion.pages.retrieve({ page_id: pageId });
        const properties = pageResponse.properties;
        
        // 如果有哈希值字段，删除对应的HTML文件
        if (properties['HTML哈希值']) {
            const htmlHash = properties['HTML哈希值']?.rich_text[0]?.plain_text || '';
            if (htmlHash) {
                await deleteHtmlContent(htmlHash);
            }
        }
        
        // 归档Notion中的页面
        await notion.pages.update({
            page_id: pageId,
            archived: true
        });
        
        res.json({ success: true });
    } catch (error) {
        console.error('删除页面失败:', error);
        res.status(500).json({ error: '无法删除页面' });
    }
});

// 5. 通过哈希值直接查看HTML内容
app.get('/view/:hash', async (req, res) => {
    const hash = req.params.hash;
    
    try {
        const htmlContent = await getHtmlContent(hash);
        
        if (!htmlContent) {
            return res.status(404).send(`
                <!DOCTYPE html>
                <html lang="zh-CN">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>页面未找到</title>
                    <style>
                        body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
                        .error { color: #e74c3c; }
                    </style>
                </head>
                <body>
                    <h1 class="error">页面未找到</h1>
                    <p>请求的页面不存在或已被删除。</p>
                </body>
                </html>
            `);
        }
        
        res.send(htmlContent);
    } catch (error) {
        console.error('查看页面失败:', error);
        res.status(500).send('服务器错误');
    }
});

// 6. 处理favicon.ico请求
app.get('/favicon.ico', (req, res) => {
    res.status(204).end();
});

// 启动服务器
app.listen(port, () => {
    console.log(`服务器正在 http://localhost:${port} 运行`);
});
