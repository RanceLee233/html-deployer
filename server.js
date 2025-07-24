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

// 1. 获取所有已部署的页面
app.get('/pages', async (req, res) => {
    try {
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

        res.json(pages);
    } catch (error) {
        console.error('获取页面失败:', error);
        res.status(500).json({ error: '无法从Notion获取页面' });
    }
});

// 2. 创建一个新页面
app.post('/pages', async (req, res) => {
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
        res.status(201).json(response);
    } catch (error) {
        console.error('创建页面失败:', error);
        res.status(500).json({ error: '无法在Notion中创建页面' });
    }
});

// 启动服务器
app.listen(port, () => {
    console.log(`服务器正在 http://localhost:${port} 运行`);
});
