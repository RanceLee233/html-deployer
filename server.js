require('dotenv').config();
const express = require('express');
const { Client } = require('@notionhq/client');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3000;

// 初始化Notion客户端
const notion = new Client({ auth: process.env.NOTION_API_KEY });
const databaseId = process.env.NOTION_DATABASE_ID;

// 中间件
app.use(cors());
app.use(express.json());

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

        // 格式化返回的数据
        const pages = response.results.map(page => {
            return {
                id: page.id,
                title: page.properties.页面标题.title[0]?.plain_text || '无标题',
                htmlContent: page.properties.HTML代码.rich_text[0]?.plain_text || '',
                description: page.properties.描述.rich_text[0]?.plain_text || '',
                createdAt: page.created_time,
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
        const response = await notion.pages.create({
            parent: { database_id: databaseId },
            properties: {
                '页面标题': {
                    title: [
                        {
                            text: {
                                content: title,
                            },
                        },
                    ],
                },
                'HTML代码': {
                    rich_text: [
                        {
                            text: {
                                content: htmlContent,
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
            },
        });
        
        // 返回格式化的响应
        res.status(201).json({
            success: true,
            id: response.id,
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
        
        // 格式化返回的数据，保持与列表API一致
        const page = {
            id: response.id,
            title: response.properties.页面标题.title[0]?.plain_text || '无标题',
            htmlContent: response.properties.HTML代码.rich_text[0]?.plain_text || '',
            description: response.properties.描述.rich_text[0]?.plain_text || '',
            createdAt: response.created_time,
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

// 启动服务器
app.listen(port, () => {
    console.log(`服务器正在 http://localhost:${port} 运行`);
});
