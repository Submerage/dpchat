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
const API_KEY = 'sk-3843d0eee8dd4955892a5b7d30cce10c'; // DeepSeek API密钥（实际项目中应从环境变量获取）

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
});

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

// /**
//  * 初始化回车键发送消息处理
//  * 监听输入框的keypress事件，当按下回车时发送消息
//  * 修复：确保回车键能正确触发发送消息
//  */
// function initEnterKeyHandler() {
//     const chatInput = document.getElementById('chat-input');

//     chatInput.addEventListener('keydown', function (event) {
//         // 检查是否按下回车键且没有同时按下Shift键
//         if (event.key === 'Enter' && !event.shiftKey) {
//             event.preventDefault(); // 阻止默认行为（如换行）
//             sendMessage(); // 调用发送消息函数
//         }
//     });
// }

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
    // 从本地存储获取历史记录
    const savedHistory = localStorage.getItem('chatHistory');
    if (savedHistory) {
        try {
            chatHistory = JSON.parse(savedHistory);
        } catch (e) {
            console.error('Failed to parse chat history:', e);
            chatHistory = [];
        }
    }

    // 更新UI
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

    // 设置当前对话
    currentConversationId = conversationId;
    currentMessages = conversation.messages;

    // 清空消息区域
    const messagesContainer = document.getElementById('messages');
    messagesContainer.innerHTML = '';

    // 显示所有消息
    conversation.messages.forEach(message => {
        displayMessage(message.role, message.content, false);
    });

    // 关闭侧边栏
    toggleSidebar();
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
 * 修改：不再自动生成历史记录，只有发送消息后才生成
 */
function startNewConversation() {
    // 生成新的对话ID
    currentConversationId = 'conv-' + Date.now();
    currentMessages = [];

    // 清空消息区域
    document.getElementById('messages').innerHTML = '';

    // 显示欢迎消息
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

    // 隐藏后续操作按钮
    document.getElementById('post-answer-actions').style.display = 'none';

    // 清空上传文件
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

    // 处理标题和换行
    let lines = text.split('\n');
    let formattedLines = lines.map(line => {
        // 处理标题（**文本**）
        line = line.replace(/\*\*(.*?)\*\*/g, '<span class="bold-text">$1</span>');
        return line;
    });

    // 将 ### 替换为换行，并确保每个部分都是一个段落
    let processedText = formattedLines.join('\n');
    let sections = processedText
        .split('###')
        .filter(section => section.trim())
        .map(section => {
            // 移除多余的换行和空格
            let lines = section.split('\n').filter(line => line.trim());

            if (lines.length === 0) return '';

            // 处理每个部分
            let result = '';
            let currentIndex = 0;

            while (currentIndex < lines.length) {
                let line = lines[currentIndex].trim();

                // 如果是数字开头（如 "1.")
                if (/^\d+\./.test(line)) {
                    result += `<p class="section-title">${line}</p>`;
                }
                // 如果是小标题（以破折号开头）
                else if (line.startsWith('-')) {
                    result += `<p class="subsection"><span class="bold-text">${line.replace(/^-/, '').trim()}</span></p>`;
                }
                // 如果是正文（包含冒号的行）
                else if (line.includes(':')) {
                    let [subtitle, content] = line.split(':').map(part => part.trim());
                    result += `<p><span class="subtitle">${subtitle}</span>: ${content}</p>`;
                }
                // 普通文本
                else {
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

    // 如果是第一条消息，移除欢迎消息
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

    // 滚动到底部
    if (scrollToBottom) {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    // 如果是机器人消息，显示后续操作按钮
    if (role === 'bot') {
        document.getElementById('post-answer-actions').style.display = 'flex';
    }
}

/**
 * 发送消息
 * 处理用户发送消息的逻辑，包括显示消息、调用API和更新历史记录
 * 修改：只有在发送消息后才生成历史记录
 */
function sendMessage() {
    const inputElement = document.getElementById('chat-input');
    const message = inputElement.value.trim();
    if (!message) return;

    // 获取选择的数据源
    const dataSource = document.getElementById('data-source').value;

    // 显示用户消息
    displayMessage('user', message);

    // 添加到当前消息列表
    currentMessages.push({
        role: 'user',
        content: message,
        timestamp: new Date().toISOString()
    });

    inputElement.value = '';

    // 显示加载动画
    const loadingElement = document.getElementById('loading');
    loadingElement.style.display = 'flex';

    // 隐藏后续操作按钮
    document.getElementById('post-answer-actions').style.display = 'none';

    // 根据数据源选择不同的处理方式
    if (dataSource === 'local' && (uploadedFiles.length === 0 && uploadedImages.length === 0)) {
        // 如果没有上传文件但选择了本地数据源，提示用户
        loadingElement.style.display = 'none';
        displayMessage('bot', '您选择了"仅本地上传数据"但尚未上传任何文件，请上传文件后再试。');
        return;
    }

    // 构建API请求
    let endpoint, payload;

    if (dataSource === 'local') {
        // 使用本地数据回答 - 这里需要后端API支持
        endpoint = '/api/local-query'; // 假设的后端端点
        payload = {
            question: message,
            files: uploadedFiles.map(f => f.name),
            images: uploadedImages.map(img => img.name)
        };

        // 显示提示信息（实际项目中应调用API）
        loadingElement.style.display = 'none';
        displayMessage('bot', '本地数据回答功能需要后端API支持。当前演示环境无法直接实现此功能。');
        return;
    } else {
        // 使用DeepSeek API或其他数据源
        endpoint = 'https://api.deepseek.com/chat/completions';
        let prompt = message;

        // 根据数据源调整prompt
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
            // 隐藏加载动画
            loadingElement.style.display = 'none';

            if (data.choices && data.choices.length > 0) {
                const answer = data.choices[0].message.content;
                displayMessage('bot', answer);

                // 添加到当前消息列表
                currentMessages.push({
                    role: 'bot',
                    content: answer,
                    timestamp: new Date().toISOString()
                });

                // 更新历史记录（只有发送消息后才生成记录）
                updateConversationHistory();
            } else {
                displayMessage('bot', '出错了，未能获取有效回答。');
            }
        })
        .catch(error => {
            // 隐藏加载动画
            loadingElement.style.display = 'none';
            displayMessage('bot', '出错了，请稍后再试。');
            console.error('Error:', error);
        });
}

/**
 * 更新对话历史记录
 * 将当前对话添加到历史记录中并保存到localStorage
 * 修改：只有在有消息时才生成历史记录
 */
function updateConversationHistory() {
    // 如果没有消息，则不生成历史记录
    if (currentMessages.length === 0) {
        return;
    }

    // 查找当前对话是否已存在于历史记录中
    const existingConversationIndex = chatHistory.findIndex(c => c.id === currentConversationId);

    if (existingConversationIndex !== -1) {
        // 更新现有对话
        chatHistory[existingConversationIndex] = {
            id: currentConversationId,
            title: getConversationTitle(),
            messages: currentMessages,
            timestamp: new Date().toISOString()
        };
    } else {
        // 创建新的对话记录
        chatHistory.unshift({
            id: currentConversationId,
            title: getConversationTitle(),
            messages: [...currentMessages],
            timestamp: new Date().toISOString()
        });
    }

    // 保存到localStorage
    saveHistoryToLocalStorage();

    // 更新UI
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

        // 显示对话的第一条问题和日期
        const firstQuestion = conversation.messages.find(m => m.role === 'user');
        const date = new Date(conversation.timestamp).toLocaleString();

        historyItem.innerHTML = `
            <div class="history-question">${firstQuestion ? (firstQuestion.content.length > 30 ? firstQuestion.content.substring(0, 30) + '...' : firstQuestion.content) : '无问题'}</div>
            <div class="history-date">${date}</div>
            <div class="history-count">${conversation.messages.length} 条消息</div>
        `;

        historyItem.onclick = () => loadConversation(conversation.id);
        historyList.appendChild(historyItem);
    });
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
        // 如果localStorage满了，删除最旧的一条记录
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
    // 获取当前对话的最后一条机器人消息
    const lastBotMessage = [...currentMessages].reverse().find(m => m.role === 'bot');
    if (!lastBotMessage) return;

    // 显示模态框
    const modal = document.getElementById('graph-modal');
    modal.classList.add('show');

    // 显示加载状态
    const graphContainer = document.getElementById('graph-container');
    graphContainer.innerHTML = `
        <div class="loading-spinner"></div>
        <p>正在生成知识图谱...</p>
    `;

    // 构建知识图谱生成请求
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

    // 简单渲染 - 实际项目应使用ECharts或其他可视化库
    let html = '<div class="graph-visualization">';
    html += '<h4>知识图谱可视化</h4>';
    html += '<div class="graph-nodes">';

    // 渲染节点
    graphData.nodes.forEach(node => {
        html += `<div class="graph-node" data-id="${node.id}">${node.name}</div>`;
    });

    html += '</div>';
    html += '<div class="graph-relations">';

    // 渲染关系
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
 * 修改：添加按钮禁用状态，防止重复点击
 */
function expandKnowledge() {
    // 检查是否已经在进行知识延展
    if (isExpandingKnowledge) {
        return;
    }

    // 获取当前对话的最后一条机器人消息
    const lastBotMessage = [...currentMessages].reverse().find(m => m.role === 'bot');
    if (!lastBotMessage) return;

    // 设置标志防止多次点击
    isExpandingKnowledge = true;

    // 禁用知识延展按钮
    const expandBtn = document.querySelector('.action-btn[onclick="expandKnowledge()"]');
    expandBtn.disabled = true;
    expandBtn.style.opacity = '0.6';
    expandBtn.style.cursor = 'not-allowed';

    // 显示加载动画
    const loadingElement = document.getElementById('loading');
    loadingElement.style.display = 'flex';

    // 构建知识延展请求
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
            // 隐藏加载动画
            loadingElement.style.display = 'none';

            // 重置标志
            isExpandingKnowledge = false;

            // 重新启用知识延展按钮
            expandBtn.disabled = false;
            expandBtn.style.opacity = '1';
            expandBtn.style.cursor = 'pointer';

            if (data.choices && data.choices.length > 0) {
                const answer = data.choices[0].message.content;
                displayMessage('bot', answer);

                // 添加到当前消息列表
                currentMessages.push({
                    role: 'bot',
                    content: answer,
                    timestamp: new Date().toISOString()
                });

                // 更新历史记录
                updateConversationHistory();
            } else {
                displayMessage('bot', '知识延展失败，请稍后再试。');
            }
        })
        .catch(error => {
            // 隐藏加载动画
            loadingElement.style.display = 'none';

            // 重置标志
            isExpandingKnowledge = false;

            // 重新启用知识延展按钮
            expandBtn.disabled = false;
            expandBtn.style.opacity = '1';
            expandBtn.style.cursor = 'pointer';

            // displayMessage('bot', '知识延展失败: ' + error.message);
            // console.error('Error expanding knowledge:', error);
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

    // 检查上传数量限制
    const remainingSlots = MAX_UPLOADS - uploadedFiles.length;
    if (remainingSlots <= 0) {
        alert(`最多只能上传${MAX_UPLOADS}个文件`);
        event.target.value = '';
        return;
    }

    // 只处理剩余可上传的文件
    const filesToUpload = files.slice(0, remainingSlots);

    // 显示加载状态
    const loadingElement = document.getElementById('loading');
    loadingElement.style.display = 'flex';

    // 模拟上传处理
    setTimeout(() => {
        loadingElement.style.display = 'none';

        // 添加到已上传文件列表
        filesToUpload.forEach(file => {
            uploadedFiles.push({
                name: file.name,
                size: file.size,
                type: file.type
            });
        });

        // 更新上传文件显示区域
        updateUploadsDisplay();

        // 显示成功消息
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

    // 检查上传数量限制
    const remainingSlots = MAX_UPLOADS - uploadedImages.length;
    if (remainingSlots <= 0) {
        alert(`最多只能上传${MAX_UPLOADS}张图片`);
        event.target.value = '';
        return;
    }

    // 只处理剩余可上传的图片
    const filesToUpload = files.slice(0, remainingSlots);

    // 显示加载状态
    const loadingElement = document.getElementById('loading');
    loadingElement.style.display = 'flex';

    // 处理图片上传
    let processedCount = 0;
    filesToUpload.forEach(file => {
        const reader = new FileReader();
        reader.onload = function (e) {
            // 添加到已上传图片列表
            uploadedImages.push({
                name: file.name,
                size: file.size,
                type: file.type,
                dataUrl: e.target.result
            });

            processedCount++;

            // 当所有图片都处理完成
            if (processedCount === filesToUpload.length) {
                loadingElement.style.display = 'none';

                // 更新上传文件显示区域
                updateUploadsDisplay();

                // 显示成功消息
                displayMessage('bot', `已成功上传${filesToUpload.length}张图片:\n${filesToUpload.map(f => f.name).join('\n')}`);

                // 显示第一张图片
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

    // 移除现有的上传文件显示区域（如果有）
    const existingDisplay = document.getElementById('uploads-display');
    if (existingDisplay) {
        uploadsContainer.parentNode.removeChild(existingDisplay);
    }

    // 如果没有上传文件，则不显示
    if (uploadedFiles.length === 0 && uploadedImages.length === 0) {
        return;
    }

    // 创建新的上传文件显示区域
    const uploadsDisplay = document.createElement('div');
    uploadsDisplay.id = 'uploads-display';
    uploadsDisplay.className = 'uploads-display';

    // 添加上传的文件
    uploadedFiles.forEach((file, index) => {
        const fileItem = document.createElement('div');
        fileItem.className = 'upload-item';
        fileItem.innerHTML = `
            <span class="file-name">${file.name}</span>
            <button class="remove-upload" onclick="removeUpload('file', ${index})">
                <i class="fas fa-times"></i>
            </button>
        `;
        uploadsDisplay.appendChild(fileItem);
    });

    // 添加上传的图片
    uploadedImages.forEach((img, index) => {
        const imgItem = document.createElement('div');
        imgItem.className = 'upload-item';
        imgItem.innerHTML = `
            <span class="file-name">${img.name}</span>
            <button class="remove-upload" onclick="removeUpload('image', ${index})">
                <i class="fas fa-times"></i>
            </button>
        `;
        uploadsDisplay.appendChild(imgItem);
    });

    // 插入到上传按钮下方
    uploadsContainer.parentNode.insertBefore(uploadsDisplay, uploadsContainer.nextSibling);
}

/**
 * 移除上传的文件或图片
 * 从上传列表中删除指定的文件或图片
 * @param {string} type 类型（'file'或'image'）
 * @param {number} index 索引
 */
function removeUpload(type, index) {
    if (type === 'file') {
        uploadedFiles.splice(index, 1);
    } else {
        uploadedImages.splice(index, 1);
    }

    // 更新显示
    updateUploadsDisplay();

    // 显示提示消息
    displayMessage('bot', `已移除${type === 'file' ? '文件' : '图片'}`);
}

/**
 * 关闭模态框
 * 隐藏指定的模态框
 * @param {string} modalId 模态框ID
 */
function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('show');
}