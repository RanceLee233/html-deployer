const API_BASE_URL = 'http://localhost:3000/api';

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
    const div = document.createElement('div');
    div.className = 'deployed-item';
    div.dataset.pageId = page.id;
    
    const createdDate = new Date(page.properties['创建时间'].created_time).toLocaleString('zh-CN');
    
    div.innerHTML = `
        <h3>${page.properties['页面标题'].title[0]?.plain_text || '无标题'}</h3>
        <p class="description">${page.properties['描述']?.rich_text[0]?.plain_text || '无描述'}</p>
        <p class="meta">创建时间: ${createdDate}</p>
        <div class="item-actions">
            <button class="btn-secondary" onclick="viewPage('${page.id}')">查看页面</button>
            <button class="btn-danger" onclick="deletePage('${page.id}')">删除</button>
        </div>
    `;
    
    return div;
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
        html: document.getElementById('htmlCode').value
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

async function viewPage(pageId) {
    try {
        const response = await fetch(`${API_BASE_URL}/deployments/${pageId}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const pageData = await response.json();
        const htmlContent = pageData.properties['HTML代码']?.rich_text[0]?.plain_text;
        
        if (!htmlContent) {
            alert('此页面没有 HTML 内容');
            return;
        }
        
        // 在新窗口中打开 HTML 内容
        const newWindow = window.open('', '_blank');
        newWindow.document.write(htmlContent);
        newWindow.document.close();
        
    } catch (error) {
        console.error('查看页面时出错:', error);
        alert('无法查看页面: ' + error.message);
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