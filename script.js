// 根据环境自动切换 API 地址
const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:3000/api'
    : '/api';

document.addEventListener('DOMContentLoaded', function() {
    loadDeployedPages();
    
    const deployForm = document.getElementById('deployForm');
    deployForm.addEventListener('submit', handleDeploy);
});

async function loadDeployedPages() {
    const loadingMessage = document.getElementById('loadingMessage');
    const errorMessage = document.getElementById('errorMessage');
    const deployedList = document.getElementById('deployedList');
    
    try {
        const response = await fetch(`${API_BASE_URL}/deployments`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const pages = await response.json();
        
        loadingMessage.style.display = 'none';
        deployedList.innerHTML = '';
        
        if (pages.length === 0) {
            deployedList.innerHTML = '<p style="text-align: center; color: #7f8c8d;">还没有部署任何页面</p>';
            return;
        }
        
        pages.forEach(page => {
            const pageElement = createPageElement(page);
            deployedList.appendChild(pageElement);
        });
        
    } catch (error) {
        console.error('加载页面时出错:', error);
        loadingMessage.style.display = 'none';
        errorMessage.style.display = 'block';
        errorMessage.textContent = '加载页面失败: ' + error.message;
    }
}

function createPageElement(page) {
    const card = document.createElement('div');
    card.className = 'page-card';
    card.dataset.pageId = page.id;
    
    const createdDate = new Date(page.createdAt).toLocaleString('zh-CN');
    
    // 生成页面预览图（使用iframe预览）
    const previewUrl = page.htmlHash ? `${API_BASE_URL.replace('/api', '')}/view/${page.htmlHash}` : '';
    
    card.innerHTML = `
        <div class="page-card-preview">
            ${page.htmlHash ? 
                `<iframe src="${previewUrl}" class="page-preview-frame" sandbox="allow-same-origin allow-scripts"></iframe>` :
                `<div class="preview-placeholder">页面预览</div>`
            }
        </div>
        <div class="page-card-content">
            <h3 class="page-title">${page.title || '无标题'}</h3>
            <p class="page-description">${page.description || '无描述'}</p>
            <div class="page-meta">
                <span class="create-time">${createdDate}</span>
            </div>
        </div>
        <div class="page-card-actions">
            <button class="btn-view" onclick="viewPageByHash('${page.htmlHash}')">
                <i>👁</i> 查看
            </button>
            <button class="btn-copy" onclick="copyShareLink('${page.shareUrl}')">
                <i>🔗</i> 复制
            </button>
            <button class="btn-delete" onclick="deletePage('${page.id}')">
                <i>🗑</i> 删除
            </button>
        </div>
    `;
    
    return card;
}

async function handleDeploy(event) {
    event.preventDefault();
    
    const submitButton = event.target.querySelector('button[type="submit"]');
    const originalText = submitButton.textContent;
    submitButton.disabled = true;
    submitButton.textContent = '部署中...';
    
    const formData = {
        title: document.getElementById('pageTitle').value,
        description: document.getElementById('pageDescription').value,
        htmlContent: document.getElementById('htmlCode').value
    };
    
    try {
        const response = await fetch(`${API_BASE_URL}/deploy`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData)
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        
        // 显示成功消息
        showSuccessMessage('页面部署成功！');
        
        // 清空表单
        event.target.reset();
        
        // 重新加载页面列表
        loadDeployedPages();
        
    } catch (error) {
        console.error('部署失败:', error);
        alert('部署失败: ' + error.message);
    } finally {
        submitButton.disabled = false;
        submitButton.textContent = originalText;
    }
}

async function viewPageByHash(htmlHash) {
    if (!htmlHash) {
        alert('页面哈希值无效');
        return;
    }
    
    const viewUrl = `/view/${htmlHash}`;
    window.open(viewUrl, '_blank');
}

async function viewPage(pageId) {
    try {
        const response = await fetch(`${API_BASE_URL}/deployments/${pageId}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const pageData = await response.json();
        const htmlHash = pageData.htmlHash;
        
        if (!htmlHash) {
            alert('此页面没有 HTML 内容');
            return;
        }
        
        // 使用哈希值直接访问页面
        viewPageByHash(htmlHash);
        
    } catch (error) {
        console.error('查看页面时出错:', error);
        alert('无法查看页面: ' + error.message);
    }
}

async function copyShareLink(shareUrl) {
    if (!shareUrl) {
        alert('分享链接无效');
        return;
    }
    
    try {
        await navigator.clipboard.writeText(shareUrl);
        showSuccessMessage('分享链接已复制到剪贴板！');
    } catch (error) {
        console.error('复制链接失败:', error);
        // 降级方案
        const textArea = document.createElement('textarea');
        textArea.value = shareUrl;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        showSuccessMessage('分享链接已复制到剪贴板！');
    }
}

async function deletePage(pageId) {
    if (!confirm('确定要删除这个页面吗？此操作不可撤销。')) {
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/deployments/${pageId}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        // 显示成功消息
        showSuccessMessage('页面已删除');
        
        // 重新加载页面列表
        loadDeployedPages();
        
    } catch (error) {
        console.error('删除页面时出错:', error);
        alert('删除失败: ' + error.message);
    }
}

function showSuccessMessage(message) {
    const errorMessage = document.getElementById('errorMessage');
    errorMessage.style.display = 'none';
    
    const successDiv = document.createElement('div');
    successDiv.className = 'success-message';
    successDiv.textContent = message;
    
    const listSection = document.querySelector('.list-section');
    listSection.insertBefore(successDiv, listSection.firstChild);
    
    setTimeout(() => {
        successDiv.remove();
    }, 3000);
}