// 全局变量
let bookmarksData = null;
let currentRootFolder = "bookmark_bar";
let currentPath = [];
let currentDetailsItem = null;
let modalTimer = null; // 添加定时器变量，用于控制模态窗口显示/隐藏

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

  // 创建模态窗口
  createModal();

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

  // 创建模态窗口
  function createModal() {
    // 如果已经存在模态窗口，不重复创建
    if (document.getElementById('details-modal')) return;

    const modalOverlay = document.createElement('div');
    modalOverlay.className = 'modal-overlay';
    modalOverlay.id = 'modal-overlay';

    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'details-modal';

    // 模态窗口头部
    const modalHeader = document.createElement('div');
    modalHeader.className = 'modal-header';
    
    const modalTitle = document.createElement('h3');
    modalTitle.id = 'modal-title';
    modalTitle.textContent = '书签详细信息';
    
    const closeButton = document.createElement('button');
    closeButton.className = 'modal-close';
    closeButton.innerHTML = '&times;';
    closeButton.addEventListener('click', closeModal);
    
    modalHeader.appendChild(modalTitle);
    modalHeader.appendChild(closeButton);
    
    // 模态窗口内容
    const modalBody = document.createElement('div');
    modalBody.className = 'modal-body';
    modalBody.id = 'modal-body';
    
    // 模态窗口底部
    const modalFooter = document.createElement('div');
    modalFooter.className = 'modal-footer';
    
    const closeBtn = document.createElement('button');
    closeBtn.className = 'modal-button';
    closeBtn.textContent = '关闭';
    closeBtn.addEventListener('click', closeModal);
    
    modalFooter.appendChild(closeBtn);
    
    // 组装模态窗口
    modal.appendChild(modalHeader);
    modal.appendChild(modalBody);
    modal.appendChild(modalFooter);
    modalOverlay.appendChild(modal);
    
    // 添加到DOM
    document.body.appendChild(modalOverlay);
    
    // 点击遮罩层关闭模态窗口
    modalOverlay.addEventListener('click', function(e) {
      if (e.target === modalOverlay) {
        closeModal();
      }
    });
    
    // ESC键关闭模态窗口
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') {
        closeModal();
      }
    });
  }

  // 打开模态窗口
  function openModal(item) {
    // 清除可能存在的关闭定时器
    if (modalTimer) {
      clearTimeout(modalTimer);
      modalTimer = null;
    }

    currentDetailsItem = item;
    const modalTitle = document.getElementById('modal-title');
    const modalBody = document.getElementById('modal-body');
    const modalOverlay = document.getElementById('modal-overlay');
    
    // 设置标题
    modalTitle.textContent = item.type === 'url' ? '书签详细信息' : '文件夹详细信息';
    
    // 清空模态窗口内容
    modalBody.innerHTML = '';
    
    // 添加基本信息组
    const basicGroup = document.createElement('div');
    basicGroup.className = 'detail-group';
    
    // 添加基本信息
    addDetailRow(basicGroup, '名称', item.name);
    addDetailRow(basicGroup, '类型', item.type === 'url' ? '网址书签' : '文件夹');
    
    if (item.id) {
      addDetailRow(basicGroup, 'ID', item.id);
    }
    
    if (item.guid) {
      addDetailRow(basicGroup, 'GUID', item.guid);
    }
    
    modalBody.appendChild(basicGroup);
    
    // 添加时间信息组
    const timeGroup = document.createElement('div');
    timeGroup.className = 'detail-group';
    
    addDetailRow(timeGroup, '添加时间', formatChromeTimestamp(item.date_added));
    addDetailRow(timeGroup, '最后使用', formatChromeTimestamp(item.date_last_used));
    
    if (item.type === 'folder' && item.date_modified) {
      addDetailRow(timeGroup, '修改时间', formatChromeTimestamp(item.date_modified));
    }
    
    modalBody.appendChild(timeGroup);
    
    // 添加URL信息（如果是书签）
    if (item.type === 'url' && item.url) {
      const urlGroup = document.createElement('div');
      urlGroup.className = 'detail-group';
      
      const urlRow = document.createElement('div');
      urlRow.className = 'detail-row';
      
      const urlLabel = document.createElement('div');
      urlLabel.className = 'detail-label';
      urlLabel.textContent = 'URL:';
      
      const urlValue = document.createElement('div');
      urlValue.className = 'detail-value special-value';
      
      // 创建可点击的URL
      const urlLink = document.createElement('a');
      urlLink.href = item.url;
      urlLink.target = '_blank';
      urlLink.textContent = item.url;
      urlLink.style.textDecoration = 'none';
      urlLink.style.color = 'inherit';
      
      urlValue.appendChild(urlLink);
      urlRow.appendChild(urlLabel);
      urlRow.appendChild(urlValue);
      urlGroup.appendChild(urlRow);
      
      modalBody.appendChild(urlGroup);
    }
    
    // 显示模态窗口
    modalOverlay.classList.add('active');
    
    // 添加鼠标进入模态窗口事件，清除关闭定时器
    modalOverlay.addEventListener('mouseenter', function() {
      if (modalTimer) {
        clearTimeout(modalTimer);
        modalTimer = null;
      }
    });
    
    // 添加鼠标离开模态窗口事件，延迟关闭
    modalOverlay.addEventListener('mouseleave', function() {
      if (!modalTimer) {
        modalTimer = setTimeout(closeModal, 300);
      }
    });
  }
  
  // 添加详情行
  function addDetailRow(container, label, value) {
    const row = document.createElement('div');
    row.className = 'detail-row';
    
    const labelEl = document.createElement('div');
    labelEl.className = 'detail-label';
    labelEl.textContent = label + ':';
    
    const valueEl = document.createElement('div');
    valueEl.className = 'detail-value';
    valueEl.textContent = value;
    
    row.appendChild(labelEl);
    row.appendChild(valueEl);
    container.appendChild(row);
  }
  
  // 关闭模态窗口
  function closeModal() {
    const modalOverlay = document.getElementById('modal-overlay');
    modalOverlay.classList.remove('active');
    currentDetailsItem = null;
    
    // 清除定时器
    if (modalTimer) {
      clearTimeout(modalTimer);
      modalTimer = null;
    }
  }

  // 辅助函数：格式化Chrome时间戳（微秒）为人类可读日期
  function formatChromeTimestamp(chromeTimestamp) {
    if (!chromeTimestamp || chromeTimestamp === "0") {
      return "从未";
    }
    
    try {
      // Chrome书签使用的是17位时间戳，表示从1601年1月1日起的微秒数
      
      // 首先确保时间戳是数字
      let timestamp = typeof chromeTimestamp === 'string' ? 
        parseInt(chromeTimestamp, 10) : chromeTimestamp;
      
      // 1. 将微秒转换为秒 (除以1,000,000)
      let timestampInSeconds = timestamp / 1000000;
      
      // 2. 计算1601-01-01到1970-01-01之间的总秒数
      // 这个值是固定的：11644473600秒 (369年)
      const secondsBetween1601And1970 = 11644473600;
      
      // 3. 转换为Unix时间戳 (1970年为起点的秒数)
      let unixTimestamp = timestampInSeconds - secondsBetween1601And1970;
      
      // 打印调试信息
      console.log('时间戳调试:', {
        原始时间戳: chromeTimestamp,
        微秒转秒: timestampInSeconds,
        Unix时间戳: unixTimestamp,
        日期对象: new Date(unixTimestamp * 1000).toISOString()
      });
      
      // 4. 转换为JavaScript日期对象 (毫秒为单位)
      const jsDate = new Date(unixTimestamp * 1000);
      
      // 验证日期是否有效
      if (isNaN(jsDate.getTime())) {
        console.error("无效的时间戳:", chromeTimestamp);
        return "无效日期";
      }
      
      // 格式化为本地日期时间字符串
      return jsDate.toLocaleString('zh-CN', { 
        year: 'numeric', 
        month: '2-digit', 
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    } catch (error) {
      console.error("时间戳解析错误:", error, chromeTimestamp);
      return "无法解析时间";
    }
  }

  // 创建信息按钮
  function createInfoButton(item) {
    const infoBtn = document.createElement('span');
    infoBtn.className = 'info-button';
    infoBtn.innerHTML = 'i';
    infoBtn.title = '查看详细信息';
    
    // 改为鼠标悬停事件（替代点击事件）
    infoBtn.addEventListener('mouseenter', function(e) {
      e.stopPropagation();
      openModal(item);
    });
    
    // 添加鼠标离开事件，延迟关闭模态窗口
    infoBtn.addEventListener('mouseleave', function(e) {
      e.stopPropagation();
      if (!modalTimer) {
        modalTimer = setTimeout(closeModal, 300);
      }
    });
    
    // 初始状态隐藏，只在父元素悬停时显示
    infoBtn.style.opacity = '0';
    infoBtn.style.visibility = 'hidden';
    infoBtn.style.transition = 'opacity 0.3s, visibility 0.3s';
    
    return infoBtn;
  }

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
        folderElement.dataset.index = index;
        
        // 添加信息按钮
        const infoBtn = createInfoButton(item);
        folderElement.appendChild(infoBtn);
        
        // 添加鼠标悬停事件显示信息按钮
        folderElement.addEventListener('mouseenter', function() {
          const infoButton = this.querySelector('.info-button');
          if (infoButton) {
            infoButton.style.opacity = '1';
            infoButton.style.visibility = 'visible';
          }
        });
        
        // 鼠标离开时隐藏信息按钮
        folderElement.addEventListener('mouseleave', function() {
          const infoButton = this.querySelector('.info-button');
          if (infoButton) {
            infoButton.style.opacity = '0';
            infoButton.style.visibility = 'hidden';
          }
        });

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
        
        // 添加信息按钮
        const infoBtn = createInfoButton(item);
        folderElement.appendChild(infoBtn);
        
        // 添加鼠标悬停事件显示信息按钮
        folderElement.addEventListener('mouseenter', function() {
          const infoButton = this.querySelector('.info-button');
          if (infoButton) {
            infoButton.style.opacity = '1';
            infoButton.style.visibility = 'visible';
          }
        });
        
        // 鼠标离开时隐藏信息按钮
        folderElement.addEventListener('mouseleave', function() {
          const infoButton = this.querySelector('.info-button');
          if (infoButton) {
            infoButton.style.opacity = '0';
            infoButton.style.visibility = 'hidden';
          }
        });

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
        linkElement.target = "_blank";
        
        // 添加信息按钮
        const infoBtn = createInfoButton(item);
        linkElement.appendChild(infoBtn);
        
        // 添加鼠标悬停事件显示信息按钮
        linkElement.addEventListener('mouseenter', function() {
          const infoButton = this.querySelector('.info-button');
          if (infoButton) {
            infoButton.style.opacity = '1';
            infoButton.style.visibility = 'visible';
          }
        });
        
        // 鼠标离开时隐藏信息按钮
        linkElement.addEventListener('mouseleave', function() {
          const infoButton = this.querySelector('.info-button');
          if (infoButton) {
            infoButton.style.opacity = '0';
            infoButton.style.visibility = 'hidden';
          }
        });

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
        link.target = "_blank";
        
        // 添加信息按钮
        const infoBtn = createInfoButton(item);
        link.appendChild(infoBtn);
        
        // 添加鼠标悬停事件显示信息按钮
        link.addEventListener('mouseenter', function() {
          const infoButton = this.querySelector('.info-button');
          if (infoButton) {
            infoButton.style.opacity = '1';
            infoButton.style.visibility = 'visible';
          }
        });
        
        // 鼠标离开时隐藏信息按钮
        link.addEventListener('mouseleave', function() {
          const infoButton = this.querySelector('.info-button');
          if (infoButton) {
            infoButton.style.opacity = '0';
            infoButton.style.visibility = 'hidden';
          }
        });

        waterfallContainer.appendChild(link);
      } else {
        const folderLink = document.createElement("div");
        folderLink.className = "folder-title";
        folderLink.textContent = item.name;
        
        // 添加信息按钮
        const infoBtn = createInfoButton(item);
        folderLink.appendChild(infoBtn);
        
        // 添加鼠标悬停事件显示信息按钮
        folderLink.addEventListener('mouseenter', function() {
          const infoButton = this.querySelector('.info-button');
          if (infoButton) {
            infoButton.style.opacity = '1';
            infoButton.style.visibility = 'visible';
          }
        });
        
        // 鼠标离开时隐藏信息按钮
        folderLink.addEventListener('mouseleave', function() {
          const infoButton = this.querySelector('.info-button');
          if (infoButton) {
            infoButton.style.opacity = '0';
            infoButton.style.visibility = 'hidden';
          }
        });

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