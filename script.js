/**
 * 通信领域智能问答系统 - 前端JavaScript代码
 * 主要功能：用户交互、消息处理、AI通信、数据上传、历史记录管理等
 */

// 全局变量
let chatHistory = []; // 存储聊天历史记录
let currentConversationId = null; // 当前对话的ID
let currentMessages = []; // 当前对话的所有消息
let uploadedFiles = []; // 存储上传的文件
let uploadedImages = []; // 存储上传的图片
let isExpandingKnowledge = false; // 知识延展状态标志，防止多次点击
const MAX_UPLOADS = 3; // 最大上传数量限制
const API_KEY = 'sk-3843d0eee8dd4955892a5b7d30cce10c'; // DeepSeek API密钥

// DOM加载完成后初始化
document.addEventListener('DOMContentLoaded', function () {
    // 初始化主题
    initTheme();

    // 初始化文件上传事件
    initFileUploads();

    // 加载历史记录
    loadHistory();

    // 添加回车发送功能
    initEnterKeyHandler();

    // 初始化数据源选择框样式
    initDataSourceDropdown();

    // 初始化新对话
    startNewConversation();

    // 初始化确认删除模态框事件
    initConfirmModal();
});

/**
 * 初始化确认删除模态框事件
 */
function initConfirmModal() {
    const modal = document.getElementById('confirm-delete-modal');
    modal.addEventListener('click', function (e) {
        if (e.target === modal) {
            closeModal('confirm-delete-modal');
        }
    });
}

/**
 * 初始化主题设置
 * 从localStorage读取用户主题偏好并应用
 */
function initTheme() {
    const isDarkMode = localStorage.getItem('darkMode') === 'true';
    if (isDarkMode) {
        document.body.classList.add('dark-mode');
        updateThemeIcon(true);
    }
}

/**
 * 初始化文件上传事件
 * 为文件上传和图片上传输入框添加change事件监听
 */
function initFileUploads() {
    document.getElementById('file-upload').addEventListener('change', handleFileUpload);
    document.getElementById('image-upload').addEventListener('change', handleImageUpload);
}

/**
 * 初始化回车键发送消息处理
 * 监听输入框的keypress事件，当按下回车时发送消息
 */
function initEnterKeyHandler() {
    const chatInput = document.getElementById('chat-input');
    chatInput.addEventListener('keydown', function (event) {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            sendMessage();
        }
    });
}

/**
 * 切换侧边栏显示/隐藏
 * 控制历史记录侧边栏的显示状态
 */
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    sidebar.classList.toggle('show');
}

/**
 * 更新主题图标
 * 根据当前主题模式更新主题切换按钮的图标
 * @param {boolean} isDarkMode 是否是深色模式
 */
function updateThemeIcon(isDarkMode) {
    const themeIcon = document.querySelector('.theme-toggle i');
    if (isDarkMode) {
        themeIcon.classList.remove('fa-moon');
        themeIcon.classList.add('fa-sun');
    } else {
        themeIcon.classList.remove('fa-sun');
        themeIcon.classList.add('fa-moon');
    }
}

/**
 * 切换主题
 * 在浅色和深色模式之间切换，并保存用户偏好
 */
function toggleTheme() {
    document.body.classList.toggle('dark-mode');
    const isDarkMode = document.body.classList.contains('dark-mode');
    localStorage.setItem('darkMode', isDarkMode);
    updateThemeIcon(isDarkMode);
}

/**
 * 加载历史记录
 * 从localStorage加载聊天历史记录并更新UI
 */
function loadHistory() {
    const savedHistory = localStorage.getItem('chatHistory');
    if (savedHistory) {
        try {
            chatHistory = JSON.parse(savedHistory);
        } catch (e) {
            console.error('Failed to parse chat history:', e);
            chatHistory = [];
        }
    }
    updateHistoryUI();
}

/**
 * 加载对话
 * 根据对话ID加载特定的历史对话
 * @param {string} conversationId 要加载的对话ID
 */
function loadConversation(conversationId) {
    const conversation = chatHistory.find(c => c.id === conversationId);
    if (!conversation) return;

    currentConversationId = conversationId;
    currentMessages = conversation.messages;

    const messagesContainer = document.getElementById('messages');
    messagesContainer.innerHTML = '';

    conversation.messages.forEach(message => {
        displayMessage(message.role, message.content, false);
    });

    toggleSidebar();
}

/**
 * 删除对话
 * 删除指定的历史对话记录
 * @param {string} conversationId 要删除的对话ID
 * @param {Event} event 点击事件（用于阻止冒泡）
 */
function deleteConversation(conversationId, event) {
    if (event) {
        event.stopPropagation(); // 阻止事件冒泡，避免触发加载对话
    }

    // 显示确认删除模态框
    const modal = document.getElementById('confirm-delete-modal');
    modal.classList.add('show');

    // 设置确认删除回调
    const confirmDeleteBtn = document.getElementById('confirm-delete-btn');
    const oldOnclick = confirmDeleteBtn.onclick;
    confirmDeleteBtn.onclick = function () {
        // 从历史记录中删除
        const index = chatHistory.findIndex(c => c.id === conversationId);
        if (index !== -1) {
            chatHistory.splice(index, 1);

            // 如果删除的是当前对话，则开始新对话
            if (currentConversationId === conversationId) {
                startNewConversation();
            }

            // 保存到localStorage
            saveHistoryToLocalStorage();

            // 更新UI
            updateHistoryUI();
        }

        // 关闭模态框
        closeModal('confirm-delete-modal');

        // 恢复原来的点击事件
        confirmDeleteBtn.onclick = oldOnclick;
    };
}

/**
 * 插入快速问题
 * 将预设问题插入输入框并聚焦
 * @param {string} question 要插入的问题文本
 */
function insertQuickQuestion(question) {
    document.getElementById('chat-input').value = question;
    document.getElementById('chat-input').focus();
}

/**
 * 开始新对话
 * 初始化一个新的对话会话
 */
function startNewConversation() {
    currentConversationId = 'conv-' + Date.now();
    currentMessages = [];

    document.getElementById('messages').innerHTML = '';

    const welcomeMsg = document.createElement('div');
    welcomeMsg.className = 'welcome-message';
    welcomeMsg.innerHTML = `
        <h3>欢迎使用通信领域智能问答系统</h3>
        <p>您可以询问任何关于通信技术的问题，包括5G/6G、网络协议、通信标准等。</p>
        <div class="quick-questions">
            <button onclick="insertQuickQuestion('什么是5G技术？')">什么是5G技术？</button>
            <button onclick="insertQuickQuestion('解释一下TCP/IP协议')">解释一下TCP/IP协议</button>
            <button onclick="insertQuickQuestion('6G与5G的主要区别是什么？')">6G与5G的主要区别是什么？</button>
        </div>
    `;

    document.getElementById('messages').appendChild(welcomeMsg);
    document.getElementById('post-answer-actions').style.display = 'none';

    uploadedFiles = [];
    uploadedImages = [];
    updateUploadsDisplay();
}

/**
 * 格式化消息文本
 * 将原始文本转换为带有HTML格式的文本
 * @param {string} text 原始消息文本
 * @returns {string} 格式化后的HTML
 */
function formatMessage(text) {
    if (!text) return '';

    let lines = text.split('\n');
    let formattedLines = lines.map(line => {
        line = line.replace(/\*\*(.*?)\*\*/g, '<span class="bold-text">$1</span>');
        return line;
    });

    let processedText = formattedLines.join('\n');
    let sections = processedText
        .split('###')
        .filter(section => section.trim())
        .map(section => {
            let lines = section.split('\n').filter(line => line.trim());
            if (lines.length === 0) return '';

            let result = '';
            let currentIndex = 0;

            while (currentIndex < lines.length) {
                let line = lines[currentIndex].trim();

                if (/^\d+\./.test(line)) {
                    result += `<p class="section-title">${line}</p>`;
                } else if (line.startsWith('-')) {
                    result += `<p class="subsection"><span class="bold-text">${line.replace(/^-/, '').trim()}</span></p>`;
                } else if (line.includes(':')) {
                    let [subtitle, content] = line.split(':').map(part => part.trim());
                    result += `<p><span class="subtitle">${subtitle}</span>: ${content}</p>`;
                } else {
                    result += `<p>${line}</p>`;
                }
                currentIndex++;
            }
            return result;
        });

    return sections.join('');
}

/**
 * 显示消息
 * 在聊天区域显示用户或AI的消息
 * @param {string} role 消息角色（'user'或'bot'）
 * @param {string} message 消息内容
 * @param {boolean} scrollToBottom 是否滚动到底部
 */
function displayMessage(role, message, scrollToBottom = true) {
    const messagesContainer = document.getElementById('messages');

    if (messagesContainer.querySelector('.welcome-message') && currentMessages.length === 0) {
        messagesContainer.innerHTML = '';
    }

    const messageElement = document.createElement('div');
    messageElement.className = `message ${role}`;

    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    avatar.innerHTML = role === 'user' ? '<i class="fas fa-user"></i>' : '<i class="fas fa-robot"></i>';

    const messageContent = document.createElement('div');
    messageContent.className = 'message-content';
    messageContent.innerHTML = role === 'user' ? message : formatMessage(message);

    messageElement.appendChild(avatar);
    messageElement.appendChild(messageContent);
    messagesContainer.appendChild(messageElement);

    if (scrollToBottom) {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    if (role === 'bot') {
        document.getElementById('post-answer-actions').style.display = 'flex';
    }
}

/**
 * 发送消息
 * 处理用户发送消息的逻辑，包括显示消息、调用API和更新历史记录
 */
function sendMessage() {
    const inputElement = document.getElementById('chat-input');
    const message = inputElement.value.trim();
    if (!message) return;

    const dataSource = document.getElementById('data-source').value;

    displayMessage('user', message);

    currentMessages.push({
        role: 'user',
        content: message,
        timestamp: new Date().toISOString()
    });

    inputElement.value = '';

    const loadingElement = document.getElementById('loading');
    loadingElement.style.display = 'flex';
    document.getElementById('post-answer-actions').style.display = 'none';

    if (dataSource === 'local' && (uploadedFiles.length === 0 && uploadedImages.length === 0)) {
        loadingElement.style.display = 'none';
        displayMessage('bot', '您选择了"仅本地上传数据"但尚未上传任何文件，请上传文件后再试。');
        return;
    }

    let endpoint, payload;
    if (dataSource === 'local') {
        endpoint = '/api/local-query';
        payload = {
            question: message,
            files: uploadedFiles.map(f => f.name),
            images: uploadedImages.map(img => img.name)
        };

        loadingElement.style.display = 'none';
        displayMessage('bot', '本地数据回答功能需要后端API支持。当前演示环境无法直接实现此功能。');
        return;
    } else {
        endpoint = 'https://api.deepseek.com/chat/completions';
        let prompt = message;

        if (dataSource === 'crawler') {
            prompt = "[使用爬虫数据回答] " + message;
        } else if (dataSource === 'deepseek') {
            prompt = "[使用DeepSeek API回答] " + message;
        } else if (dataSource === 'all') {
            prompt = "[使用全部数据源融合回答] " + message;
        }

        payload = {
            model: "deepseek-chat",
            messages: [
                {
                    role: "system",
                    content: "你是一个通信领域专家，请根据用户选择的数据源提供专业回答。"
                },
                { role: "user", content: prompt }
            ],
            stream: false
        };
    }

    fetch(endpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${API_KEY}`
        },
        body: JSON.stringify(payload)
    })
        .then(response => response.json())
        .then(data => {
            loadingElement.style.display = 'none';
            if (data.choices && data.choices.length > 0) {
                const answer = data.choices[0].message.content;
                displayMessage('bot', answer);
                currentMessages.push({
                    role: 'bot',
                    content: answer,
                    timestamp: new Date().toISOString()
                });
                updateConversationHistory();
            } else {
                displayMessage('bot', '出错了，未能获取有效回答。');
            }
        })
        .catch(error => {
            loadingElement.style.display = 'none';
        });
}

/**
 * 更新对话历史记录
 * 将当前对话添加到历史记录中并保存到localStorage
 */
function updateConversationHistory() {
    if (currentMessages.length === 0) {
        return;
    }

    const existingConversationIndex = chatHistory.findIndex(c => c.id === currentConversationId);
    if (existingConversationIndex !== -1) {
        chatHistory[existingConversationIndex] = {
            id: currentConversationId,
            title: getConversationTitle(),
            messages: currentMessages,
            timestamp: new Date().toISOString()
        };
    } else {
        chatHistory.unshift({
            id: currentConversationId,
            title: getConversationTitle(),
            messages: [...currentMessages],
            timestamp: new Date().toISOString()
        });
    }

    saveHistoryToLocalStorage();
    updateHistoryUI();
}

/**
 * 获取对话标题
 * 使用第一条用户消息作为对话标题
 * @returns {string} 对话标题
 */
function getConversationTitle() {
    const firstQuestion = currentMessages.find(m => m.role === 'user');
    return firstQuestion ? firstQuestion.content : '新对话';
}

/**
 * 更新历史记录UI
 * 根据chatHistory更新侧边栏的历史记录列表
 */
function updateHistoryUI() {
    const historyList = document.getElementById('history-list');
    historyList.innerHTML = '';

    chatHistory.forEach(conversation => {
        const historyItem = document.createElement('div');
        historyItem.className = 'history-item';
        historyItem.setAttribute('data-id', conversation.id);

        const firstQuestion = conversation.messages.find(m => m.role === 'user');
        const date = new Date(conversation.timestamp).toLocaleString();
        const messageCount = conversation.messages.length;

        historyItem.innerHTML = `
            <div class="history-item-content">
                <div class="history-item-header">
                    <div class="history-question">${firstQuestion ?
                (firstQuestion.content.length > 30 ?
                    firstQuestion.content.substring(0, 30) + '...' :
                    firstQuestion.content) : '无问题'}</div>
                    <button class="history-delete-btn" onclick="deleteConversation('${conversation.id}', event)">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
                <div class="history-meta">
                    <span class="history-date">${date}</span>
                    <span class="history-count">${messageCount} 条消息</span>
                </div>
            </div>
        `;

        historyItem.onclick = () => loadConversation(conversation.id);
        historyList.appendChild(historyItem);
    });

    // 如果没有历史记录，显示提示信息
    if (chatHistory.length === 0) {
        historyList.innerHTML = `
            <div class="empty-history">
                <i class="fas fa-history"></i>
                <p>暂无历史记录</p>
            </div>
        `;
    }
}

/**
 * 将历史记录保存到localStorage
 * 处理可能的存储空间不足情况
 */
function saveHistoryToLocalStorage() {
    try {
        localStorage.setItem('chatHistory', JSON.stringify(chatHistory));
    } catch (e) {
        console.error('Failed to save chat history:', e);
        if (e.name === 'QuotaExceededError') {
            chatHistory.pop();
            saveHistoryToLocalStorage();
        }
    }
}

/**
 * 生成知识图谱
 * 基于最后一条机器人消息生成知识图谱
 */
function generateKnowledgeGraph() {
    const lastBotMessage = [...currentMessages].reverse().find(m => m.role === 'bot');
    if (!lastBotMessage) return;

    const modal = document.getElementById('graph-modal');
    modal.classList.add('show');

    const graphContainer = document.getElementById('graph-container');
    graphContainer.innerHTML = `
        <div class="loading-spinner"></div>
        <p>正在生成知识图谱...</p>
    `;

    const endpoint = 'https://api.deepseek.com/chat/completions';
    const prompt = `请从以下通信领域内容中提取关键概念和关系，以JSON格式返回适合生成知识图谱的结构化数据：

要求格式:
{
    "nodes": [
        {"id": "1", "name": "概念名称", "category": "类别"},
        ...
    ],
    "links": [
        {"source": "源节点ID", "target": "目标节点ID", "relation": "关系描述"},
        ...
    ]
}

内容: ${lastBotMessage.content}`;

    const payload = {
        model: "deepseek-chat",
        messages: [
            { role: "system", content: "你是一个知识图谱专家，请按要求提取结构化数据。" },
            { role: "user", content: prompt }
        ],
        stream: false
    };

    fetch(endpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${API_KEY}`
        },
        body: JSON.stringify(payload)
    })
        .then(response => response.json())
        .then(data => {
            if (data.choices && data.choices.length > 0) {
                try {
                    const graphData = JSON.parse(data.choices[0].message.content);
                    renderKnowledgeGraph(graphData);
                } catch (e) {
                    graphContainer.innerHTML = `
                    <div class="error-message">
                        <i class="fas fa-exclamation-triangle"></i>
                        <p>知识图谱生成失败，格式解析错误</p>
                    </div>
                `;
                    console.error('Error parsing graph data:', e);
                }
            } else {
                graphContainer.innerHTML = `
                <div class="error-message">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>知识图谱生成失败，未获取有效数据</p>
                </div>
            `;
            }
        })
        .catch(error => {
            graphContainer.innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-triangle"></i>
                <p>知识图谱生成失败: ${error.message}</p>
            </div>
        `;
            console.error('Error generating graph:', error);
        });
}

/**
 * 渲染知识图谱
 * 将知识图谱数据渲染到UI上
 * @param {object} graphData 知识图谱数据
 */
function renderKnowledgeGraph(graphData) {
    const graphContainer = document.getElementById('graph-container');
    if (!graphData.nodes || !graphData.links) {
        graphContainer.innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-triangle"></i>
                <p>获取的知识图谱数据格式不正确</p>
            </div>
        `;
        return;
    }

    let html = '<div class="graph-visualization">';
    html += '<h4>知识图谱可视化</h4>';
    html += '<div class="graph-nodes">';

    graphData.nodes.forEach(node => {
        html += `<div class="graph-node" data-id="${node.id}">${node.name}</div>`;
    });

    html += '</div>';
    html += '<div class="graph-relations">';

    graphData.links.forEach(link => {
        html += `<div class="graph-relation">
            <span class="source">${getNodeName(graphData.nodes, link.source)}</span>
            <span class="relation">${link.relation}</span>
            <span class="target">${getNodeName(graphData.nodes, link.target)}</span>
        </div>`;
    });

    html += '</div></div>';
    graphContainer.innerHTML = html;
}

/**
 * 根据ID获取节点名称
 * @param {array} nodes 节点数组
 * @param {string} id 节点ID
 * @returns {string} 节点名称
 */
function getNodeName(nodes, id) {
    const node = nodes.find(n => n.id === id);
    return node ? node.name : id;
}

/**
 * 知识延展
 * 基于最后一条机器人消息扩展相关知识
 */
function expandKnowledge() {
    if (isExpandingKnowledge) {
        return;
    }

    const lastBotMessage = [...currentMessages].reverse().find(m => m.role === 'bot');
    if (!lastBotMessage) return;

    isExpandingKnowledge = true;
    const expandBtn = document.querySelector('.action-btn[onclick="expandKnowledge()"]');
    expandBtn.disabled = true;
    expandBtn.style.opacity = '0.6';
    expandBtn.style.cursor = 'not-allowed';

    const loadingElement = document.getElementById('loading');
    loadingElement.style.display = 'flex';

    const endpoint = 'https://api.deepseek.com/chat/completions';
    const prompt = `请基于以下通信领域内容进行知识延展，提供相关技术、最新研究和未来趋势：

当前内容: ${lastBotMessage.content}

要求格式:

### 相关技术
- 技术1: 描述
- 技术2: 描述

### 最新研究
- 研究1: 描述
- 研究2: 描述

### 未来趋势
- 趋势1: 描述
- 趋势2: 描述`;

    const payload = {
        model: "deepseek-chat",
        messages: [
            { role: "system", content: "你是一个通信领域专家，请按要求扩展知识。" },
            { role: "user", content: prompt }
        ],
        stream: false
    };

    fetch(endpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${API_KEY}`
        },
        body: JSON.stringify(payload)
    })
        .then(response => response.json())
        .then(data => {
            loadingElement.style.display = 'none';
            isExpandingKnowledge = false;
            expandBtn.disabled = false;
            expandBtn.style.opacity = '1';
            expandBtn.style.cursor = 'pointer';

            if (data.choices && data.choices.length > 0) {
                const answer = data.choices[0].message.content;
                displayMessage('bot', answer);
                currentMessages.push({
                    role: 'bot',
                    content: answer,
                    timestamp: new Date().toISOString()
                });
                updateConversationHistory();
            } else {
                displayMessage('bot', '知识延展失败，请稍后再试。');
            }
        })
        .catch(error => {
            loadingElement.style.display = 'none';
            isExpandingKnowledge = false;
            expandBtn.disabled = false;
            expandBtn.style.opacity = '1';
            expandBtn.style.cursor = 'pointer';
        });
}

/**
 * 处理文件上传
 * 处理用户上传的文件并更新UI
 * @param {Event} event 文件上传事件
 */
function handleFileUpload(event) {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;

    const remainingSlots = MAX_UPLOADS - uploadedFiles.length;
    if (remainingSlots <= 0) {
        alert(`最多只能上传${MAX_UPLOADS}个文件`);
        event.target.value = '';
        return;
    }

    const filesToUpload = files.slice(0, remainingSlots);
    const loadingElement = document.getElementById('loading');
    loadingElement.style.display = 'flex';

    setTimeout(() => {
        loadingElement.style.display = 'none';
        filesToUpload.forEach(file => {
            uploadedFiles.push({
                name: file.name,
                size: file.size,
                type: file.type
            });
        });
        updateUploadsDisplay();
        displayMessage('bot', `已成功上传${filesToUpload.length}个文件:\n${filesToUpload.map(f => f.name).join('\n')}`);
    }, 1500);

    event.target.value = '';
}

/**
 * 处理图片上传
 * 处理用户上传的图片并更新UI
 * @param {Event} event 图片上传事件
 */
function handleImageUpload(event) {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;

    const remainingSlots = MAX_UPLOADS - uploadedImages.length;
    if (remainingSlots <= 0) {
        alert(`最多只能上传${MAX_UPLOADS}张图片`);
        event.target.value = '';
        return;
    }

    const filesToUpload = files.slice(0, remainingSlots);
    const loadingElement = document.getElementById('loading');
    loadingElement.style.display = 'flex';

    let processedCount = 0;
    filesToUpload.forEach(file => {
        const reader = new FileReader();
        reader.onload = function (e) {
            uploadedImages.push({
                name: file.name,
                size: file.size,
                type: file.type,
                dataUrl: e.target.result
            });
            processedCount++;

            if (processedCount === filesToUpload.length) {
                loadingElement.style.display = 'none';
                updateUploadsDisplay();
                displayMessage('bot', `已成功上传${filesToUpload.length}张图片:\n${filesToUpload.map(f => f.name).join('\n')}`);
                displayMessage('user', `<img src="${uploadedImages[uploadedImages.length - 1].dataUrl}" style="max-width: 100%; border-radius: 8px;" alt="上传的图片">`);
            }
        };
        reader.readAsDataURL(file);
    });

    event.target.value = '';
}

/**
 * 更新上传文件显示区域
 * 在UI上显示已上传的文件和图片
 */
function updateUploadsDisplay() {
    const uploadsContainer = document.querySelector('.file-upload-buttons');
    const existingDisplay = document.getElementById('uploads-display');
    if (existingDisplay) {
        uploadsContainer.parentNode.removeChild(existingDisplay);
    }

    if (uploadedFiles.length === 0 && uploadedImages.length === 0) {
        return;
    }

    const displayElement = document.createElement('div');
    displayElement.id = 'uploads-display';
    displayElement.className = 'uploads-display';

    let html = '<div class="uploads-header">已上传:</div>';
    html += '<div class="uploads-list">';

    uploadedFiles.forEach((file, index) => {
        html += `<div class="upload-item">
            <i class="fas fa-file"></i>
            <span class="upload-name">${file.name}</span>
            <button class="remove-upload" onclick="removeUpload('file', ${index})">
                <i class="fas fa-times"></i>
            </button>
        </div>`;
    });

    uploadedImages.forEach((image, index) => {
        html += `<div class="upload-item">
            <i class="fas fa-image"></i>
            <span class="upload-name">${image.name}</span>
            <button class="remove-upload" onclick="removeUpload('image', ${index})">
                <i class="fas fa-times"></i>
            </button>
        </div>`;
    });

    html += '</div>';
    displayElement.innerHTML = html;
    uploadsContainer.parentNode.insertBefore(displayElement, uploadsContainer.nextSibling);
}

/**
 * 移除上传的文件或图片
 * 从已上传列表中移除指定的文件或图片
 * @param {string} type 类型（'file'或'image'）
 * @param {number} index 要移除的索引
 */
function removeUpload(type, index) {
    if (type === 'file') {
        uploadedFiles.splice(index, 1);
    } else {
        uploadedImages.splice(index, 1);
    }
    updateUploadsDisplay();
}

/**
 * 关闭模态框
 * 关闭指定的模态对话框
 * @param {string} modalId 模态框的ID
 */
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.classList.remove('show');
}

/**
 * 初始化数据源下拉框样式
 * 为数据源选择下拉框添加样式处理
 */
function initDataSourceDropdown() {
    const select = document.getElementById('data-source');
    select.addEventListener('change', function () {
        this.style.color = this.value === 'all' ? '#4361ee' :
            this.value === 'deepseek' ? '#7209b7' :
                this.value === 'crawler' ? '#f72585' : '#4cc9f0';
    });
    select.dispatchEvent(new Event('change'));
}

// 添加确认删除模态框到HTML中（通过JS动态添加）
document.addEventListener('DOMContentLoaded', function () {
    const confirmModal = document.createElement('div');
    confirmModal.id = 'confirm-delete-modal';
    confirmModal.className = 'confirm-modal';
    confirmModal.innerHTML = `
        <div class="confirm-modal-content">
            <div class="confirm-modal-header">
                <h3>确认删除</h3>
            </div>
            <div class="confirm-modal-body">
                <p>您确定要删除这条历史记录吗？此操作无法撤销。</p>
            </div>
            <div class="confirm-modal-actions">
                <button class="confirm-btn cancel" onclick="closeModal('confirm-delete-modal')">取消</button>
                <button class="confirm-btn delete" id="confirm-delete-btn">删除</button>
            </div>
        </div>
    `;
    document.body.appendChild(confirmModal);
});