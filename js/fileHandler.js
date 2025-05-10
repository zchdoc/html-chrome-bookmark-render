// 文件处理模块
// 使用全局函数，不再导入
// import { initBookmarks } from './main.js';

// 处理文件函数
function handleFile(file) {
  console.log(`处理文件: ${file.name}, 大小: ${file.size} 字节`);
  if (file) {
    const reader = new FileReader();
    reader.onload = function(e) {
      try {
        console.log('文件读取完成，解析内容...');
        const data = JSON.parse(e.target.result);
        
        // 检查数据结构
        if (!data.roots) {
          console.error('书签文件无效: 缺少roots属性');
          alert('书签文件无效，请确保上传的是Chrome导出的书签文件');
          return;
        }
        
        // 检查根目录
        const roots = Object.keys(data.roots);
        if (!roots.includes('bookmark_bar') && !roots.includes('other') && !roots.includes('synced')) {
          console.warn('书签文件可能不完整: 没有找到标准的根目录');
        }
        
        console.log('书签解析成功，找到根目录:', roots);
        
        // 将数据赋值给全局变量
        window.BookmarksDemo = data;
        window.bookmarksData = data;
        
        // 初始化书签界面
        initBookmarks();
      } catch (error) {
        console.error('解析书签文件失败:', error);
        alert('解析书签文件失败: ' + error.message);
      }
    };
    reader.onerror = function(e) {
      console.error('读取文件失败:', e);
      alert('读取文件失败');
    };
    reader.readAsText(file);
  }
}

// 改为全局函数
window.handleFile = handleFile; 