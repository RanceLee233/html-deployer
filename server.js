require('dotenv').config();
const express = require('express');
const { Client } = require('@notionhq/client');
const cors = require('cors');
const crypto = require('crypto');

const app = express();
const port = process.env.PORT || 3000;

// 初始化Notion客户端
const notion = new Client({ auth: process.env.NOTION_API_KEY });
const databaseId = process.env.NOTION_DATABASE_ID;

// 中间件
app.use(cors());
app.use(express.json());



// 生成HTML内容的哈希值（支持用标题生成）
function generateHash(content) {
    // 如果内容太长，用前100字符+时间戳生成哈希
    const hashSource = content.length > 100 ? content.substring(0, 100) + Date.now() : content;
    return crypto.createHash('md5').update(hashSource).digest('hex').substring(0, 8);
}

// 从标题生成哈希值
function generateHashFromTitle(title) {
    return crypto.createHash('md5').update(title).digest('hex').substring(0, 8);
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
            
            // 1. 优先从页面正文中获取HTML内容
            try {
                const pageContent = await notion.blocks.children.list({
                    block_id: page.id
                });
                
                // 查找第一个代码块或文本块作为HTML内容
                for (const block of pageContent.results) {
                    if (block.type === 'code' && block.code) {
                        return block.code.rich_text[0]?.plain_text || '';
                    }
                    if (block.type === 'paragraph' && block.paragraph) {
                        return block.paragraph.rich_text[0]?.plain_text || '';
                    }
                }
            } catch (contentError) {
                console.log('页面正文读取失败，尝试字段读取');
            }
            
            // 2. 从属性字段中获取HTML
            const content = page.properties['完整HTML内容']?.rich_text[0]?.plain_text;
            if (content) {
                return content;
            }
            
            // 3. 如果没有完整HTML内容字段，尝试旧字段
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
app.get('/api/health', async (req, res) => {
    try {
        // 测试数据库连接
        const db = await notion.databases.retrieve({ database_id: databaseId });
        
        res.json({
            status: 'ok',
            timestamp: new Date().toISOString(),
            environment: {
                hasNotionApiKey: !!process.env.NOTION_API_KEY,
                hasNotionDatabaseId: !!process.env.NOTION_DATABASE_ID,
                notionDatabaseId: process.env.NOTION_DATABASE_ID || 'not set',
                databaseName: db.title[0]?.plain_text || '未知'
            },
            database: {
                title: db.title[0]?.plain_text || '无标题',
                properties: Object.keys(db.properties)
            }
        });
    } catch (error) {
        console.error('健康检查失败:', error);
        res.status(500).json({
            status: 'error',
            timestamp: new Date().toISOString(),
            error: error.message,
            code: error.code
        });
    }
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
            
            // 兼容旧和新数据库结构
            const hasNewStructure = properties['HTML哈希值'] !== undefined;
            const hasOldStructure = properties['HTML代码'] !== undefined;
            
            return {
                id: page.id,
                title: properties.页面标题?.title[0]?.plain_text || '无标题',
                htmlHash: hasNewStructure ? properties['HTML哈希值']?.rich_text[0]?.plain_text || '' : '',
                htmlContent: '', // 不在列表中显示HTML内容，以提高性能
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
        // 生成HTML内容的哈希值
        const htmlHash = generateHash(htmlContent);
        
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
        
        // 新架构：使用哈希值，HTML内容存储在页面正文中
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
            // 不再在字段中存储HTML内容，改为存储在页面正文
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
        
        // 如果是新架构，将HTML内容添加到页面正文中
        if (hasNewStructure) {
            try {
                // 如果HTML内容过长，分段存储
                const maxChunkSize = 2000; // Notion单个文本块限制
                const htmlChunks = [];
                
                for (let i = 0; i < htmlContent.length; i += maxChunkSize) {
                    htmlChunks.push(htmlContent.substring(i, i + maxChunkSize));
                }
                
                console.log(`HTML内容长度: ${htmlContent.length}, 分为 ${htmlChunks.length} 段`);
                
                const children = [];
                
                // 添加标题说明
                children.push({
                    object: 'block',
                    type: 'heading_3',
                    heading_3: {
                        rich_text: [{
                            type: 'text',
                            text: { content: 'HTML内容' }
                        }]
                    }
                });
                
                // 将每个分段作为段落添加
                htmlChunks.forEach((chunk, index) => {
                    children.push({
                        object: 'block',
                        type: 'paragraph',
                        paragraph: {
                            rich_text: [{
                                type: 'text',
                                text: {
                                    content: chunk
                                }
                            }]
                        }
                    });
                });
                
                // 批量添加到页面
                await notion.blocks.children.append({
                    block_id: response.id,
                    children: children
                });
                
                console.log(`HTML内容已成功添加到页面正文（${htmlChunks.length}个分段）`);
            } catch (blockError) {
                console.error('添加页面正文失败:', blockError);
                console.error('详细错误:', JSON.stringify(blockError, null, 2));
                
                // 如果添加正文失败，回退到字段存储（截断）
                try {
                    console.log('尝试回退到字段存储方案...');
                    const truncatedHtml = htmlContent.substring(0, 1900) + '... [内容过长，已截断]';
                    
                    await notion.pages.update({
                        page_id: response.id,
                        properties: {
                            '完整HTML内容': {
                                rich_text: [{
                                    text: {
                                        content: truncatedHtml
                                    }
                                }]
                            }
                        }
                    });
                    
                    console.log('已回退到截断存储方案');
                } catch (fallbackError) {
                    console.error('回退方案也失败:', fallbackError);
                }
            }
        }
        
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
            // 新结构：从页面正文中获取HTML内容
            htmlHash = properties['HTML哈希值']?.rich_text[0]?.plain_text || '';
            
            // 从页面正文中读取HTML内容
            try {
                const pageContent = await notion.blocks.children.list({
                    block_id: response.id
                });
                
                // 合并所有段落内容作为HTML
                const contentParts = [];
                let foundHtmlSection = false;
                
                for (const block of pageContent.results) {
                    // 跳过标题，查找段落内容
                    if (block.type === 'heading_3' && block.heading_3) {
                        const headingText = block.heading_3.rich_text[0]?.plain_text || '';
                        if (headingText === 'HTML内容') {
                            foundHtmlSection = true;
                            continue;
                        }
                    }
                    
                    // 在HTML内容区域中收集段落
                    if (foundHtmlSection && block.type === 'paragraph' && block.paragraph) {
                        const text = block.paragraph.rich_text[0]?.plain_text || '';
                        if (text) {
                            contentParts.push(text);
                        }
                    }
                    
                    // 兼容旧的代码块格式
                    if (block.type === 'code' && block.code) {
                        contentParts.push(block.code.rich_text[0]?.plain_text || '');
                    }
                }
                
                if (contentParts.length > 0) {
                    htmlContent = contentParts.join('');
                    console.log(`从页面正文读取到HTML内容，总长度: ${htmlContent.length}`);
                }
            } catch (contentError) {
                console.error('从页面正文读取HTML失败:', contentError);
                
                // 尝试从字段中读取（回退方案）
                if (response.properties['完整HTML内容']) {
                    htmlContent = response.properties['完整HTML内容']?.rich_text[0]?.plain_text || '';
                    console.log('从回退字段读取到HTML内容');
                }
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
            description: response.properties.描述?.rich_text[0]?.plain_text || '',
            createdAt: response.created_time,
            shareUrl: response.properties['分享链接']?.rich_text[0]?.plain_text || '',
            pageId: response.properties['页面ID']?.rich_text[0]?.plain_text || ''
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
        
        // 直接归档Notion中的页面（不再需要删除文件）
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

// 5. 通过哈希值或标题直接查看HTML内容
app.get('/view/:hash', async (req, res) => {
    const hash = req.params.hash;
    
    try {
        // 首先尝试用哈希值查找
        let response = await notion.databases.query({
            database_id: databaseId,
            filter: {
                property: 'HTML哈希值',
                rich_text: {
                    equals: hash
                }
            }
        });
        
        // 如果没找到，尝试用标题生成哈希值查找
        if (response.results.length === 0) {
            const titleHash = generateHashFromTitle(decodeURIComponent(hash));
            response = await notion.databases.query({
                database_id: databaseId,
                filter: {
                    property: 'HTML哈希值',
                    rich_text: {
                        equals: titleHash
                    }
                }
            });
        }
        
        if (response.results.length === 0) {
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
                    <p>请检查页面标题或哈希值是否正确。</p>
                </body>
                </html>
            `);
        }
        
        const page = response.results[0];
        let htmlContent = '';
        
        // 1. 优先从页面正文中获取HTML内容
        try {
            const pageContent = await notion.blocks.children.list({
                block_id: page.id
            });
            
            // 合并所有文本内容作为HTML
            const contentParts = [];
            let foundHtmlSection = false;
            
            for (const block of pageContent.results) {
                // 跳过标题，查找段落内容
                if (block.type === 'heading_3' && block.heading_3) {
                    const headingText = block.heading_3.rich_text[0]?.plain_text || '';
                    if (headingText === 'HTML内容') {
                        foundHtmlSection = true;
                        continue;
                    }
                }
                
                // 在HTML内容区域中收集段落
                if (foundHtmlSection && block.type === 'paragraph' && block.paragraph) {
                    const text = block.paragraph.rich_text[0]?.plain_text || '';
                    if (text) {
                        contentParts.push(text);
                    }
                }
                
                // 兼容旧的代码块格式
                if (block.type === 'code' && block.code) {
                    contentParts.push(block.code.rich_text[0]?.plain_text || '');
                }
            }
            
            if (contentParts.length > 0) {
                htmlContent = contentParts.join('');
                console.log(`从页面正文读取到HTML内容，总长度: ${htmlContent.length}`);
            }
        } catch (contentError) {
            console.log('页面正文读取失败，尝试字段读取');
        }
        
        // 2. 如果没有从正文获取到内容，从属性字段中获取
        if (!htmlContent) {
            if (page.properties['完整HTML内容']) {
                htmlContent = page.properties['完整HTML内容']?.rich_text[0]?.plain_text || '';
            } else if (page.properties['HTML代码']) {
                htmlContent = page.properties['HTML代码']?.rich_text[0]?.plain_text || '';
            }
        }
        
        if (!htmlContent) {
            return res.status(404).send(`
                <!DOCTYPE html>
                <html lang="zh-CN">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>页面内容为空</title>
                    <style>
                        body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
                        .warning { color: #f39c12; }
                    </style>
                </head>
                <body>
                    <h1 class="warning">页面内容为空</h1>
                    <p>请检查Notion页面是否包含HTML内容。</p>
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
