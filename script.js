// 全局变量
let bookmarksData = null;
let currentRootFolder = "bookmark_bar";
let currentPath = [];

// DOM元素
document.addEventListener('DOMContentLoaded', function() {
  const fileInput = document.getElementById("file-input");
  const uploadButton = document.getElementById("upload-button");
  const searchInput = document.querySelector(".search-input");
  const tabButtons = document.querySelectorAll(".tab-button");
  const sidebarContent = document.getElementById("sidebar-content");
  const bookmarkContent = document.getElementById("bookmark-content");
  const breadcrumbElement = document.getElementById("breadcrumb");
  const dropZone = document.getElementById("drop-zone");
  const themeToggle = document.getElementById("theme-toggle");

  // 主题切换功能
  function initTheme() {
    // 检查本地存储中是否有保存的主题
    const savedTheme = localStorage.getItem('theme');
    // 检查系统主题设置
    const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    // 如果有保存的主题，使用保存的主题
    if (savedTheme) {
      document.documentElement.setAttribute('data-theme', savedTheme);
      themeToggle.checked = savedTheme === 'dark';
    } else if (prefersDarkScheme) {
      // 如果没有保存的主题但系统是暗色主题，使用暗色
      document.documentElement.setAttribute('data-theme', 'dark');
      themeToggle.checked = true;
    }

    // 监听系统主题变化
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
      if (!localStorage.getItem('theme')) {
        const newTheme = e.matches ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', newTheme);
        themeToggle.checked = e.matches;
      }
    });
  }

  // 主题切换按钮事件
  themeToggle.addEventListener('change', () => {
    if (themeToggle.checked) {
      document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.setAttribute('data-theme', 'light');
      localStorage.setItem('theme', 'light');
    }
  });

  // 初始化主题
  initTheme();

  // 事件监听
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

  searchInput.addEventListener("input", (e) => {
    const searchTerm = e.target.value.toLowerCase();
    if (searchTerm.length < 2) {
      // 如果搜索词少于2个字符，恢复正常显示
      initBookmarks();
      return;
    }
    searchBookmarks(searchTerm);
  });

  tabButtons.forEach((button) => {
    button.addEventListener("click", () => {
      tabButtons.forEach((btn) => btn.classList.remove("active"));
      button.classList.add("active");
      currentRootFolder = button.dataset.target;
      currentPath = [];
      initBookmarks();
    });
  });

  // 初始化书签
  function initBookmarks() {
    if (!bookmarksData) return;

    // 清除欢迎信息
    const welcomeInfo = document.getElementById("welcome-info");
    if (welcomeInfo) {
      welcomeInfo.style.display = "none";
    }

    // 统计书签总数
    const totalCount = countBookmarks();

    // 清空当前路径
    currentPath = [];
    updateBreadcrumb();

    // 更新标题显示总数
    document.title = `Chrome书签浏览器 (${totalCount}个书签)`;

    // 渲染侧边栏
    renderSidebar();

    // 渲染主内容区域（默认显示第一个一级目录的内容）
    renderMainContent();
  }

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
      const rootFolder = bookmarksData.roots[rootKey];
      if (rootFolder && rootFolder.children) {
        countInItems(rootFolder.children);
      }
    });

    return count;
  }

  // 渲染侧边栏
  function renderSidebar() {
    sidebarContent.innerHTML = "";

    const rootFolder = bookmarksData.roots[currentRootFolder];
    if (!rootFolder || !rootFolder.children) {
      sidebarContent.innerHTML = "<p>没有找到书签内容</p>";
      return;
    }

    // 渲染一级目录
    rootFolder.children.forEach((item, index) => {
      if (item.type === "folder") {
        const folderElement = document.createElement("div");
        folderElement.className = "folder-title";
        folderElement.textContent = item.name;
        folderElement.title = item.name; // 添加标题属性用于提示
        folderElement.dataset.index = index;

        folderElement.addEventListener("click", () => {
          currentPath = [index];
          updateBreadcrumb();
          renderMainContent();

          // 高亮选中的文件夹
          document.querySelectorAll(".folder-title").forEach((el) => {
            el.classList.remove("active");
          });
          folderElement.classList.add("active");
        });

        sidebarContent.appendChild(folderElement);
      }
    });

    // 默认选中第一个文件夹
    if (rootFolder.children.length > 0) {
      const firstFolder = sidebarContent.querySelector(".folder-title");
      if (firstFolder) {
        firstFolder.click();
      }
    }
  }

  // 渲染主内容区域
  function renderMainContent() {
    bookmarkContent.innerHTML = "";

    if (!bookmarksData) return;

    let currentItems = bookmarksData.roots[currentRootFolder].children;

    // 根据当前路径获取要显示的items
    for (const index of currentPath) {
      if (currentItems[index] && currentItems[index].children) {
        currentItems = currentItems[index].children;
      } else {
        break;
      }
    }

    // 创建瀑布流容器
    const waterfallContainer = document.createElement("div");
    waterfallContainer.className = "waterfall-container";
    bookmarkContent.appendChild(waterfallContainer);

    // 渲染当前层级的内容
    if (currentItems && currentItems.length > 0) {
      renderBookmarkItems(currentItems, waterfallContainer);
    } else {
      bookmarkContent.innerHTML = "<p>没有书签内容</p>";
    }
  }

  // 渲染书签项目
  function renderBookmarkItems(items, container) {
    items.forEach((item, index) => {
      if (item.type === "folder") {
        const folderElement = document.createElement("div");
        folderElement.className = "folder-title";
        folderElement.textContent = item.name;
        folderElement.title = item.name; // 添加标题属性用于提示

        folderElement.addEventListener("click", () => {
          // 获取当前层级的路径
          const newPath = [...currentPath, index];

          // 更新当前路径
          currentPath = newPath;
          updateBreadcrumb();

          // 渲染新内容
          renderMainContent();
        });

        container.appendChild(folderElement);
      } else if (item.type === "url") {
        const linkElement = document.createElement("a");
        linkElement.className = "bookmark-item";
        linkElement.href = item.url;
        linkElement.textContent = item.name;
        linkElement.title = `${item.name}\n${item.url}`; // 添加标题和URL作为提示
        linkElement.target = "_blank";
        container.appendChild(linkElement);
      }
    });
  }

  // 更新面包屑导航
  function updateBreadcrumb() {
    breadcrumbElement.innerHTML = "";

    // 添加根目录
    const rootElement = document.createElement("span");
    rootElement.textContent = getRootFolderName(currentRootFolder);
    rootElement.style.cursor = "pointer";
    rootElement.addEventListener("click", () => {
      currentPath = [];
      updateBreadcrumb();
      renderMainContent();
    });
    breadcrumbElement.appendChild(rootElement);

    // 添加当前路径
    let currentItems = bookmarksData.roots[currentRootFolder].children;
    let partialPath = [];

    currentPath.forEach((index, level) => {
      breadcrumbElement.appendChild(document.createTextNode(" > "));

      const item = currentItems[index];
      if (item) {
        partialPath.push(index);

        const pathElement = document.createElement("span");
        pathElement.textContent = item.name;
        pathElement.style.cursor = "pointer";

        // 为路径元素添加点击事件
        const thisPath = [...partialPath];
        pathElement.addEventListener("click", () => {
          currentPath = thisPath;
          updateBreadcrumb();
          renderMainContent();
        });

        breadcrumbElement.appendChild(pathElement);

        // 更新当前items以便获取下一级
        if (item.children) {
          currentItems = item.children;
        }
      }
    });
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

  // 搜索书签
  function searchBookmarks(searchTerm) {
    bookmarkContent.innerHTML = "";
    breadcrumbElement.innerHTML = `搜索结果: "${searchTerm}"`;

    const results = [];

    // 递归搜索书签
    function searchInItems(items, path = []) {
      if (!items) return;

      items.forEach((item, index) => {
        const currentPath = [...path, index];

        if (
          (item.name && item.name.toLowerCase().includes(searchTerm)) ||
          (item.url && item.url.toLowerCase().includes(searchTerm))
        ) {
          results.push({
            item,
            path: currentPath,
          });
        }

        if (item.children) {
          searchInItems(item.children, currentPath);
        }
      });
    }

    // 在所有三个根文件夹中搜索
    ["bookmark_bar", "other", "synced"].forEach((rootKey) => {
      const rootFolder = bookmarksData.roots[rootKey];
      if (rootFolder && rootFolder.children) {
        searchInItems(rootFolder.children, [rootKey]);
      }
    });

    // 创建瀑布流容器展示搜索结果
    const waterfallContainer = document.createElement("div");
    waterfallContainer.className = "waterfall-container";
    bookmarkContent.appendChild(waterfallContainer);

    // 显示搜索结果
    if (results.length === 0) {
      bookmarkContent.innerHTML = "<p>没有找到匹配的书签</p>";
      return;
    }

    results.forEach((result) => {
      const { item, path } = result;

      if (item.type === "url") {
        const link = document.createElement("a");
        link.href = item.url;
        link.className = "bookmark-item";
        link.textContent = item.name;
        link.title = `${item.name}\n${item.url}`; // 添加标题和URL作为提示
        link.target = "_blank";
        waterfallContainer.appendChild(link);
      } else {
        const folderLink = document.createElement("div");
        folderLink.className = "folder-title";
        folderLink.textContent = item.name;
        folderLink.title = item.name; // 添加标题属性用于提示

        folderLink.addEventListener("click", () => {
          const rootKey = path[0];
          const folderPath = path.slice(1);

          // 切换到对应的根文件夹
          document
            .querySelector(`.tab-button[data-target="${rootKey}"]`)
            .click();

          // 设置当前路径到搜索结果的路径
          currentPath = folderPath;
          updateBreadcrumb();
          renderMainContent();
        });

        waterfallContainer.appendChild(folderLink);
      }
    });
  }

  // 处理文件函数
  function handleFile(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        bookmarksData = JSON.parse(e.target.result);
        initBookmarks();
      } catch (error) {
        alert("解析书签文件失败，请确保文件格式正确");
        console.error("解析书签文件失败", error);
      }
    };
    reader.readAsText(file);
  }

  // 为演示目的，加载demo数据
  if (typeof BookmarksDemo !== "undefined") {
    bookmarksData = BookmarksDemo;
    initBookmarks();
  }
}); 