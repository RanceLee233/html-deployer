require('dotenv').config();
const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const cors = require('cors');
const crypto = require('crypto');

const app = express();
const port = process.env.PORT || 3000;

// 初始化Supabase客户端
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

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

// --- API 路由 ---

// 健康检查端点
app.get('/api/health', async (req, res) => {
    try {
        // 测试数据库连接
        const { data, error } = await supabase
            .from('html_deployer_pages')
            .select('id')
            .limit(1);
        
        if (error) {
            throw error;
        }

        res.json({
            status: 'ok',
            timestamp: new Date().toISOString(),
            environment: {
                hasSupabaseUrl: !!process.env.SUPABASE_URL,
                hasSupabaseKey: !!process.env.SUPABASE_ANON_KEY,
                supabaseUrl: process.env.SUPABASE_URL || 'not set'
            },
            database: {
                name: 'html_deployer_pages',
                connected: true
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
        if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
            console.error('环境变量缺失:', {
                hasUrl: !!process.env.SUPABASE_URL,
                hasKey: !!process.env.SUPABASE_ANON_KEY
            });
            return res.status(500).json({ 
                error: '服务器配置错误：缺少必需的环境变量',
                details: {
                    hasUrl: !!process.env.SUPABASE_URL,
                    hasKey: !!process.env.SUPABASE_ANON_KEY
                }
            });
        }

        console.log('尝试连接Supabase数据库...');
        const { data: pages, error } = await supabase
            .from('html_deployer_pages')
            .select('*')
            .order('sort_order', { ascending: true })
            .order('created_at', { ascending: false });

        if (error) {
            throw error;
        }

        // 格式化返回的数据，保持与原来API的兼容性
        const formattedPages = pages.map(page => ({
            id: page.id,
            title: page.title || '无标题',
            htmlHash: page.html_hash || '',
            htmlContent: '', // 不在列表中显示HTML内容，以提高性能
            description: page.description || '',
            createdAt: page.created_at,
            shareUrl: page.share_url || '',
            pageId: page.page_id || '',
            sort: page.sort_order || null,
        }));

        console.log(`成功获取 ${formattedPages.length} 个页面`);
        res.json(formattedPages);
    } catch (error) {
        console.error('获取页面失败:', error);
        res.status(500).json({ 
            error: '无法从数据库获取页面',
            details: error.message,
            code: error.code
        });
    }
});

// 批量更新排序
app.post('/api/deployments/order', async (req, res) => {
    try {
        const { order } = req.body || {};
        if (!Array.isArray(order)) {
            return res.status(400).json({ error: '参数错误：order 需为数组（页面ID数组）' });
        }

        // 简单重排：10,20,30...
        const results = [];
        for (let i = 0; i < order.length; i++) {
            const pageId = order[i];
            try {
                const sortValue = (i + 1) * 10;
                const { error } = await supabase
                    .from('html_deployer_pages')
                    .update({ sort_order: sortValue })
                    .eq('id', pageId);
                
                if (error) throw error;
                
                results.push({ id: pageId, ok: true, sort: sortValue });
            } catch (e) {
                results.push({ id: pageId, ok: false, error: e.message });
            }
        }
        res.json({ success: true, results });
    } catch (error) {
        console.error('批量更新排序失败:', error);
        res.status(500).json({ error: '批量更新排序失败', details: error.message });
    }
});

// 批量更新分享链接为自定义域名
app.post('/api/deployments/update-share-urls', async (req, res) => {
    try {
        const customDomain = process.env.CUSTOM_DOMAIN;
        if (!customDomain) {
            return res.status(400).json({ 
                error: '未配置自定义域名环境变量 CUSTOM_DOMAIN' 
            });
        }

        // 获取所有页面
        const { data: pages, error } = await supabase
            .from('html_deployer_pages')
            .select('*');
        
        if (error) throw error;

        const results = [];
        let updatedCount = 0;

        for (const page of pages) {
            try {
                if (page.html_hash) {
                    const newShareUrl = `${customDomain}/view/${page.html_hash}`;
                    
                    // 只有当链接确实需要更新时才更新
                    if (page.share_url !== newShareUrl) {
                        const { error: updateError } = await supabase
                            .from('html_deployer_pages')
                            .update({ share_url: newShareUrl })
                            .eq('id', page.id);
                        
                        if (updateError) throw updateError;
                        
                        updatedCount++;
                        results.push({
                            id: page.id,
                            title: page.title || '无标题',
                            oldUrl: page.share_url,
                            newUrl: newShareUrl,
                            success: true
                        });
                    } else {
                        results.push({
                            id: page.id,
                            title: page.title || '无标题',
                            skipped: true,
                            reason: '链接已经是正确的域名'
                        });
                    }
                } else {
                    results.push({
                        id: page.id,
                        title: page.title || '无标题',
                        skipped: true,
                        reason: '页面没有哈希值'
                    });
                }
            } catch (error) {
                results.push({
                    id: page.id,
                    title: page.title || '无标题',
                    success: false,
                    error: error.message
                });
            }
        }

        res.json({
            success: true,
            message: `成功更新 ${updatedCount} 个页面的分享链接`,
            customDomain: customDomain,
            totalPages: pages.length,
            updatedCount: updatedCount,
            results: results
        });

    } catch (error) {
        console.error('批量更新分享链接失败:', error);
        res.status(500).json({ 
            error: '批量更新分享链接失败', 
            details: error.message 
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
        
        // 使用自定义域名或当前域名生成分享URL
        const customDomain = process.env.CUSTOM_DOMAIN;
        const baseUrl = customDomain || `${req.protocol}://${req.get('host')}`;
        const shareUrl = `${baseUrl}/view/${htmlHash}`;
        
        // 查询现有页面的最小排序值，新页面排在最前面
        let newSortValue = 5; // 默认值
        try {
            const { data: existingPages, error } = await supabase
                .from('html_deployer_pages')
                .select('sort_order')
                .order('sort_order', { ascending: true })
                .limit(1);
            
            if (!error && existingPages.length > 0) {
                const currentMinSort = existingPages[0].sort_order || 10;
                newSortValue = Math.max(1, currentMinSort - 5); // 确保新页面排在最前面
            }
        } catch (sortError) {
            console.log('获取排序值失败，使用默认值:', sortError.message);
        }
        
        // 在Supabase中创建记录
        const { data: newPage, error } = await supabase
            .from('html_deployer_pages')
            .insert([
                {
                    title: title,
                    html_content: htmlContent,
                    html_hash: htmlHash,
                    description: description || '',
                    page_id: pageId,
                    share_url: shareUrl,
                    sort_order: newSortValue
                }
            ])
            .select()
            .single();
        
        if (error) throw error;
        
        // 返回格式化的响应
        res.status(201).json({
            success: true,
            id: newPage.id,
            pageId: pageId,
            htmlHash: htmlHash,
            shareUrl: shareUrl,
            message: '页面创建成功'
        });
    } catch (error) {
        console.error('创建页面失败:', error);
        res.status(500).json({ 
            error: '无法在数据库中创建页面',
            details: error.message,
            code: error.code
        });
    }
});

// 3. 获取单个页面详情
app.get('/api/deployments/:id', async (req, res) => {
    const pageId = req.params.id;
    
    try {
        const { data: page, error } = await supabase
            .from('html_deployer_pages')
            .select('*')
            .eq('id', pageId)
            .single();
        
        if (error) {
            if (error.code === 'PGRST116') {
                return res.status(404).json({ error: '页面不存在' });
            }
            throw error;
        }
        
        // 格式化返回的数据，保持与原来API的兼容性
        const formattedPage = {
            id: page.id,
            title: page.title || '无标题',
            htmlContent: page.html_content || '',
            htmlHash: page.html_hash || '',
            description: page.description || '',
            createdAt: page.created_at,
            shareUrl: page.share_url || '',
            pageId: page.page_id || ''
        };
        
        res.json(formattedPage);
    } catch (error) {
        console.error('获取页面详情失败:', error);
        res.status(500).json({ error: '无法获取页面详情', details: error.message });
    }
});

// 更新单个页面（标题/描述/HTML）
app.put('/api/deployments/:id', async (req, res) => {
    const pageId = req.params.id;
    const { title, description, htmlContent } = req.body || {};
    
    if (!title || !htmlContent) {
        return res.status(400).json({ error: '标题与HTML内容不能为空' });
    }
    
    try {
        const { error } = await supabase
            .from('html_deployer_pages')
            .update({
                title: title,
                description: description || '',
                html_content: htmlContent
            })
            .eq('id', pageId);
        
        if (error) throw error;

        res.json({ success: true });
    } catch (error) {
        console.error('更新页面失败:', error);
        res.status(500).json({ error: '更新页面失败', details: error.message });
    }
});

// 4. 删除页面
app.delete('/api/deployments/:id', async (req, res) => {
    const pageId = req.params.id;
    
    try {
        const { error } = await supabase
            .from('html_deployer_pages')
            .delete()
            .eq('id', pageId);
        
        if (error) throw error;
        
        res.json({ success: true });
    } catch (error) {
        console.error('删除页面失败:', error);
        res.status(500).json({ error: '无法删除页面', details: error.message });
    }
});

// 5. 通过哈希值或标题直接查看HTML内容
app.get('/view/:hash', async (req, res) => {
    const hash = req.params.hash;
    
    try {
        // 首先尝试用哈希值查找
        let { data: pages, error } = await supabase
            .from('html_deployer_pages')
            .select('*')
            .eq('html_hash', hash);
        
        if (error) throw error;
        
        // 如果没找到，尝试用标题生成哈希值查找
        if (pages.length === 0) {
            const titleHash = generateHashFromTitle(decodeURIComponent(hash));
            const { data: titlePages, error: titleError } = await supabase
                .from('html_deployer_pages')
                .select('*')
                .eq('html_hash', titleHash);
            
            if (titleError) throw titleError;
            pages = titlePages;
        }
        
        if (pages.length === 0) {
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
        
        const page = pages[0];
        const htmlContent = page.html_content;
        
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
                    <p>请检查数据库页面是否包含HTML内容。</p>
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
    console.log(`Supabase连接状态: ${supabaseUrl ? '已配置' : '未配置'}`);
});