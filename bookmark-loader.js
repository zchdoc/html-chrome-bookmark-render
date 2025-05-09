// 这个脚本用于加载BookmarksDemo文件
document.addEventListener('DOMContentLoaded', function() {
    // 尝试异步加载BookmarksDemo文件
    fetch('BookmarksDemo')
        .then(response => {
            if (!response.ok) {
                throw new Error('无法加载BookmarksDemo文件');
            }
            return response.text();
        })
        .then(data => {
            try {
                // 解析JSON数据并存储到全局变量
                window.BookmarksDemo = JSON.parse(data);
                console.log('BookmarksDemo数据加载成功');
                
                // 如果页面上有初始化函数，调用它
                if (typeof initBookmarks === 'function') {
                    initBookmarks();
                }
            } catch (error) {
                console.error('解析BookmarksDemo数据失败:', error);
            }
        })
        .catch(error => {
            console.error('加载BookmarksDemo文件失败:', error);
        });
}); 