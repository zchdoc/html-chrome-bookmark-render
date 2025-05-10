// 这个脚本用于加载BookmarksDemo文件
document.addEventListener('DOMContentLoaded', function() {
    console.log('开始加载书签数据...');
    
    // 尝试异步加载BookmarksDemo文件
    fetch('BookmarksDemo')
        .then(response => {
            if (!response.ok) {
                console.error(`加载失败: ${response.status} ${response.statusText}`);
                throw new Error('无法加载BookmarksDemo文件');
            }
            console.log('获取到书签文件，准备解析...');
            return response.text();
        })
        .then(data => {
            try {
                // 解析JSON数据并存储到全局变量
                window.BookmarksDemo = JSON.parse(data);
                console.log('BookmarksDemo数据加载成功', window.BookmarksDemo);
                console.log('书签数据大小: ' + data.length + ' 字节');
                
                // 验证数据结构
                if (!window.BookmarksDemo.roots) {
                    console.error('书签数据结构不正确，缺少roots属性');
                    displayError('书签数据结构不正确');
                    return;
                }
                
                // 检测根文件夹
                const roots = Object.keys(window.BookmarksDemo.roots);
                console.log('发现根文件夹:', roots);
                
                // 打印找到的书签根目录信息
                for (const rootKey of roots) {
                    const rootFolder = window.BookmarksDemo.roots[rootKey];
                    if (rootFolder && rootFolder.children) {
                        console.log(`${rootKey}: 包含 ${rootFolder.children.length} 个子项`);
                    }
                }
                
                // 如果页面上有初始化函数，调用它
                if (typeof initBookmarks === 'function') {
                    console.log('调用 initBookmarks() 初始化界面...');
                    initBookmarks();
                } else {
                    console.error('未找到 initBookmarks 函数');
                    displayError('初始化函数未定义');
                }
            } catch (error) {
                console.error('解析BookmarksDemo数据失败:', error);
                displayError('解析书签数据失败: ' + error.message);
            }
        })
        .catch(error => {
            console.error('加载BookmarksDemo文件失败:', error);
            displayError('加载书签文件失败: ' + error.message);
        });
        
    // 添加一个错误显示函数
    function displayError(message) {
        // 尝试在欢迎信息区域显示错误
        const welcomeInfo = document.getElementById("welcome-info");
        if (welcomeInfo) {
            const errorElement = document.createElement('div');
            errorElement.style.color = 'red';
            errorElement.style.padding = '10px';
            errorElement.style.marginTop = '10px';
            errorElement.style.backgroundColor = 'rgba(255,0,0,0.1)';
            errorElement.style.borderRadius = '5px';
            errorElement.innerHTML = `<strong>错误:</strong> ${message}<br><p>请检查控制台获取更多信息，或尝试重新上传书签文件。</p>`;
            welcomeInfo.appendChild(errorElement);
        }
    }
}); 