// 主入口文件 - 使用全局函数而不是ES模块

// 全局变量
window.bookmarksData = null;
window.currentRootFolder = "bookmark_bar";
window.currentPath = [];
window.currentDetailsItem = null;
window.modalTimer = null; // 添加定时器变量，用于控制模态窗口显示/隐藏
window.currentViewMode = "waterfall"; // 添加视图模式变量，默认为瀑布流
window.spaceBookmarksPositions = {}; // 存储每个书签在空间中的位置
window.spaceAutoRotate = true; // 星际视图自动旋转控制

// 统计书签总数
function countBookmarks() {
  let count = 0;

  function countInItems(items) {
    if (!items) return;

    items.forEach((item) => {
      if (item.type === "url") {
        count++;
      }

      if (item.children) {
        countInItems(item.children);
      }
    });
  }

  // 在所有根文件夹中计数
  ["bookmark_bar", "other", "synced"].forEach((rootKey) => {
    const rootFolder = window.bookmarksData.roots[rootKey];
    if (rootFolder && rootFolder.children) {
      countInItems(rootFolder.children);
    }
  });

  return count;
}

// 获取根文件夹的显示名称
function getRootFolderName(rootKey) {
  switch (rootKey) {
    case "bookmark_bar":
      return "书签栏";
    case "other":
      return "其他书签";
    case "synced":
      return "同步的书签";
    default:
      return rootKey;
  }
}

// 初始化书签
function initBookmarks() {
  console.log('初始化书签内容...');
  
  // 从全局变量获取书签数据
  if (!window.BookmarksDemo) {
    console.error('错误: BookmarksDemo 数据未定义');
    return;
  }
  
  // 将BookmarksDemo数据赋值给bookmarksData
  window.bookmarksData = window.BookmarksDemo;
  console.log('书签数据加载成功，初始化界面');
  
  // 清除欢迎信息
  const welcomeInfo = document.getElementById("welcome-info");
  if (welcomeInfo) {
    welcomeInfo.style.display = "none";
  }

  // 统计书签总数
  const totalCount = countBookmarks();
  console.log(`找到 ${totalCount} 个书签`);

  // 清空当前路径
  window.currentPath = [];
  updateBreadcrumb();

  // 更新标题显示总数
  document.title = `Chrome书签浏览器 (${totalCount}个书签)`;

  // 渲染侧边栏
  renderSidebar();

  // 渲染主内容区域（默认显示第一个一级目录的内容）
  console.log('渲染主内容区域...');
  renderMainContent();
  
  console.log('初始化完成');
}

// DOM元素加载完成后的初始化
document.addEventListener('DOMContentLoaded', function() {
  const fileInput = document.getElementById("file-input");
  const uploadButton = document.getElementById("upload-button");
  const searchInput = document.querySelector(".search-input");
  const tabButtons = document.querySelectorAll(".tab-button");
  const dropZone = document.getElementById("drop-zone");
  const themeToggle = document.getElementById("theme-toggle");

  // 创建模态窗口
  createModal();

  // 初始化主题
  initTheme();

  // 主题切换按钮事件
  themeToggle.addEventListener('change', themeToggleHandler);

  // 文件上传按钮点击事件
  uploadButton.addEventListener("click", () => {
    // 设置默认打开路径（注意：这在Web环境中不起作用，仅作为提示）
    fileInput.nwworkingdir =
      "C:\\Users\\zchcpy\\AppData\\Local\\Google\\Chrome\\User Data\\Default\\";
    fileInput.click();
  });

  fileInput.addEventListener("change", (event) => {
    const file = event.target.files[0];
    if (!file) return;
    handleFile(file);
  });

  // 拖拽上传功能
  document.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('active');
  });

  document.addEventListener('dragleave', (e) => {
    e.preventDefault();
    if (e.relatedTarget === null || e.relatedTarget.nodeName === 'HTML') {
      dropZone.classList.remove('active');
    }
  });

  dropZone.addEventListener('dragleave', (e) => {
    e.preventDefault();
    dropZone.classList.remove('active');
  });

  document.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('active');

    if (e.dataTransfer.files.length) {
      const file = e.dataTransfer.files[0];
      handleFile(file);
    }
  });

  // 搜索功能
  searchInput.addEventListener("input", (e) => {
    const searchTerm = e.target.value.toLowerCase();
    if (searchTerm.length < 2) {
      // 如果搜索词少于2个字符，恢复正常显示
      initBookmarks();
      return;
    }
    searchBookmarks(searchTerm);
  });

  // 标签页切换功能
  tabButtons.forEach((button) => {
    button.addEventListener("click", () => {
      tabButtons.forEach((btn) => btn.classList.remove("active"));
      button.classList.add("active");
      window.currentRootFolder = button.dataset.target;
      window.currentPath = [];
      initBookmarks();
    });
  });

  // 为演示目的，加载demo数据
  if (typeof BookmarksDemo !== "undefined") {
    window.bookmarksData = BookmarksDemo;
    initBookmarks();
  }
});

// 导出为全局函数
window.countBookmarks = countBookmarks;
window.getRootFolderName = getRootFolderName;
window.initBookmarks = initBookmarks; 