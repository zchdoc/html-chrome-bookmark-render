// 全局变量
let bookmarksData = null;
let currentRootFolder = "bookmark_bar";
let currentPath = [];
let currentDetailsItem = null;
let modalTimer = null; // 添加定时器变量，用于控制模态窗口显示/隐藏
let currentViewMode = "waterfall"; // 添加视图模式变量，默认为瀑布流

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

    // 创建视图切换控件
    const viewToggleContainer = document.createElement("div");
    viewToggleContainer.className = "view-toggle-container";
    
    const viewToggleLabel = document.createElement("div");
    viewToggleLabel.className = "view-toggle-label";
    viewToggleLabel.textContent = "视图切换:";
    viewToggleContainer.appendChild(viewToggleLabel);
    
    const viewToggleButtons = document.createElement("div");
    viewToggleButtons.className = "view-toggle-buttons";
    
    // 瀑布流按钮
    const waterfallButton = document.createElement("button");
    waterfallButton.className = "view-toggle-button" + (currentViewMode === "waterfall" ? " active" : "");
    waterfallButton.textContent = "经典视图";
    waterfallButton.addEventListener("click", () => {
      if (currentViewMode !== "waterfall") {
        currentViewMode = "waterfall";
        renderMainContent();
      }
    });
    viewToggleButtons.appendChild(waterfallButton);
    
    // 科幻视图按钮
    const scifiButton = document.createElement("button");
    scifiButton.className = "view-toggle-button" + (currentViewMode === "scifi" ? " active" : "");
    scifiButton.textContent = "科幻视图";
    scifiButton.addEventListener("click", () => {
      if (currentViewMode !== "scifi") {
        currentViewMode = "scifi";
        renderMainContent();
      }
    });
    viewToggleButtons.appendChild(scifiButton);
    
    viewToggleContainer.appendChild(viewToggleButtons);
    bookmarkContent.appendChild(viewToggleContainer);

    // 根据当前视图模式创建相应的容器
    if (currentViewMode === "waterfall") {
      // 创建瀑布流容器
      const waterfallContainer = document.createElement("div");
      waterfallContainer.className = "waterfall-container";
      bookmarkContent.appendChild(waterfallContainer);
      
      // 渲染当前层级的内容
      if (currentItems && currentItems.length > 0) {
        renderBookmarkItems(currentItems, waterfallContainer);
      } else {
        waterfallContainer.innerHTML = "<p>没有书签内容</p>";
      }
    } else if (currentViewMode === "scifi") {
      // 创建科幻视图容器
      const scifiContainer = document.createElement("div");
      scifiContainer.className = "scifi-container";
      bookmarkContent.appendChild(scifiContainer);
      
      // 渲染当前层级的内容
      if (currentItems && currentItems.length > 0) {
        renderScifiItems(currentItems, scifiContainer);
      } else {
        scifiContainer.innerHTML = "<p>没有书签内容</p>";
      }
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

  // 渲染科幻视图书签项目
  function renderScifiItems(items, container) {
    items.forEach((item, index) => {
      const scifiItem = document.createElement("div");
      scifiItem.className = "scifi-item " + (item.type === "folder" ? "scifi-folder" : "scifi-url");
      
      const scifiContent = document.createElement("div");
      scifiContent.className = "scifi-content";
      
      // 添加图标
      const iconElement = document.createElement("div");
      iconElement.className = "scifi-icon";
      iconElement.textContent = item.type === "folder" ? "📁" : "🔗";
      scifiContent.appendChild(iconElement);
      
      // 添加名称
      const nameElement = document.createElement("div");
      nameElement.className = "scifi-name";
      nameElement.textContent = item.name;
      scifiContent.appendChild(nameElement);
      
      // 如果是URL，添加URL文本
      if (item.type === "url") {
        const urlElement = document.createElement("div");
        urlElement.className = "scifi-url-text";
        // 显示简化的URL
        let displayUrl = item.url;
        try {
          const urlObj = new URL(item.url);
          displayUrl = urlObj.hostname;
        } catch (e) {
          // 如果解析URL失败，使用原始URL
        }
        urlElement.textContent = displayUrl;
        scifiContent.appendChild(urlElement);
      }
      
      scifiItem.appendChild(scifiContent);
      
      // 创建信息按钮
      const infoBtn = createInfoButton(item);
      scifiContent.appendChild(infoBtn);
      
      // 添加鼠标悬停事件显示信息按钮
      scifiItem.addEventListener('mouseenter', function() {
        const infoButton = this.querySelector('.info-button');
        if (infoButton) {
          infoButton.style.opacity = '1';
          infoButton.style.visibility = 'visible';
        }
      });
      
      // 鼠标离开时隐藏信息按钮
      scifiItem.addEventListener('mouseleave', function() {
        const infoButton = this.querySelector('.info-button');
        if (infoButton) {
          infoButton.style.opacity = '0';
          infoButton.style.visibility = 'hidden';
        }
      });
      
      // 添加点击事件
      if (item.type === "folder") {
        scifiItem.addEventListener("click", function(e) {
          // 如果点击的是信息按钮，不执行导航
          if (e.target.closest('.info-button')) {
            return;
          }
          // 获取当前层级的路径
          const newPath = [...currentPath, index];
          // 更新当前路径
          currentPath = newPath;
          updateBreadcrumb();
          // 渲染新内容
          renderMainContent();
        });
      } else if (item.type === "url") {
        scifiItem.addEventListener("click", function(e) {
          // 如果点击的是信息按钮，不执行打开链接
          if (e.target.closest('.info-button')) {
            return;
          }
          // 打开URL链接
          window.open(item.url, "_blank");
        });
      }
      
      container.appendChild(scifiItem);
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
      if (bookmarksData.roots[rootKey] && bookmarksData.roots[rootKey].children) {
        searchInItems(bookmarksData.roots[rootKey].children, [], rootKey);
      }
    });

    // 创建视图切换控件
    const viewToggleContainer = document.createElement("div");
    viewToggleContainer.className = "view-toggle-container";
    
    const viewToggleLabel = document.createElement("div");
    viewToggleLabel.className = "view-toggle-label";
    viewToggleLabel.textContent = "视图切换:";
    viewToggleContainer.appendChild(viewToggleLabel);
    
    const viewToggleButtons = document.createElement("div");
    viewToggleButtons.className = "view-toggle-buttons";
    
    // 瀑布流按钮
    const waterfallButton = document.createElement("button");
    waterfallButton.className = "view-toggle-button" + (currentViewMode === "waterfall" ? " active" : "");
    waterfallButton.textContent = "经典视图";
    waterfallButton.addEventListener("click", () => {
      if (currentViewMode !== "waterfall") {
        currentViewMode = "waterfall";
        searchBookmarks(searchTerm);
      }
    });
    viewToggleButtons.appendChild(waterfallButton);
    
    // 科幻视图按钮
    const scifiButton = document.createElement("button");
    scifiButton.className = "view-toggle-button" + (currentViewMode === "scifi" ? " active" : "");
    scifiButton.textContent = "科幻视图";
    scifiButton.addEventListener("click", () => {
      if (currentViewMode !== "scifi") {
        currentViewMode = "scifi";
        searchBookmarks(searchTerm);
      }
    });
    viewToggleButtons.appendChild(scifiButton);
    
    viewToggleContainer.appendChild(viewToggleButtons);
    bookmarkContent.appendChild(viewToggleContainer);

    // 显示结果数量
    const resultInfo = document.createElement("div");
    resultInfo.style.margin = "10px 0";
    resultInfo.textContent = `找到 ${results.length} 个结果`;
    bookmarkContent.appendChild(resultInfo);

    if (results.length === 0) {
      const noResults = document.createElement("p");
      noResults.textContent = "没有找到匹配的书签";
      bookmarkContent.appendChild(noResults);
      return;
    }

    // 根据视图模式显示结果
    if (currentViewMode === "waterfall") {
      // 创建瀑布流容器
      const searchResultContainer = document.createElement("div");
      searchResultContainer.className = "waterfall-container";
      bookmarkContent.appendChild(searchResultContainer);
      
      // 渲染搜索结果
      results.forEach((result) => {
        const searchResult = document.createElement("div");
        searchResult.className = "search-result";
        
        if (result.item.type === "folder") {
          const folderElement = document.createElement("div");
          folderElement.className = "folder-title";
          folderElement.textContent = result.item.name;
          
          // 添加信息按钮
          const infoBtn = createInfoButton(result.item);
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
            currentRootFolder = result.rootKey || currentRootFolder;
            currentPath = result.path;
            updateBreadcrumb();
            renderMainContent();
          });
          
          searchResult.appendChild(folderElement);
        } else if (result.item.type === "url") {
          const linkElement = document.createElement("a");
          linkElement.className = "bookmark-item";
          linkElement.href = result.item.url;
          linkElement.textContent = result.item.name;
          linkElement.target = "_blank";
          
          // 添加信息按钮
          const infoBtn = createInfoButton(result.item);
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
          
          searchResult.appendChild(linkElement);
        }
        
        searchResultContainer.appendChild(searchResult);
      });
    } else if (currentViewMode === "scifi") {
      // 创建科幻视图容器
      const scifiContainer = document.createElement("div");
      scifiContainer.className = "scifi-container";
      bookmarkContent.appendChild(scifiContainer);
      
      // 渲染搜索结果
      results.forEach((result) => {
        const scifiItem = document.createElement("div");
        scifiItem.className = "scifi-item " + (result.item.type === "folder" ? "scifi-folder" : "scifi-url");
        
        const scifiContent = document.createElement("div");
        scifiContent.className = "scifi-content";
        
        // 添加图标
        const iconElement = document.createElement("div");
        iconElement.className = "scifi-icon";
        iconElement.textContent = result.item.type === "folder" ? "📁" : "🔗";
        scifiContent.appendChild(iconElement);
        
        // 添加名称
        const nameElement = document.createElement("div");
        nameElement.className = "scifi-name";
        nameElement.textContent = result.item.name;
        scifiContent.appendChild(nameElement);
        
        // 如果是URL，添加URL文本
        if (result.item.type === "url") {
          const urlElement = document.createElement("div");
          urlElement.className = "scifi-url-text";
          // 显示简化的URL
          let displayUrl = result.item.url;
          try {
            const urlObj = new URL(result.item.url);
            displayUrl = urlObj.hostname;
          } catch (e) {
            // 如果解析URL失败，使用原始URL
          }
          urlElement.textContent = displayUrl;
          scifiContent.appendChild(urlElement);
        }
        
        scifiItem.appendChild(scifiContent);
        
        // 创建信息按钮
        const infoBtn = createInfoButton(result.item);
        scifiContent.appendChild(infoBtn);
        
        // 添加鼠标悬停事件显示信息按钮
        scifiItem.addEventListener('mouseenter', function() {
          const infoButton = this.querySelector('.info-button');
          if (infoButton) {
            infoButton.style.opacity = '1';
            infoButton.style.visibility = 'visible';
          }
        });
        
        // 鼠标离开时隐藏信息按钮
        scifiItem.addEventListener('mouseleave', function() {
          const infoButton = this.querySelector('.info-button');
          if (infoButton) {
            infoButton.style.opacity = '0';
            infoButton.style.visibility = 'hidden';
          }
        });
        
        // 添加点击事件
        if (result.item.type === "folder") {
          scifiItem.addEventListener("click", function(e) {
            // 如果点击的是信息按钮，不执行导航
            if (e.target.closest('.info-button')) {
              return;
            }
            // 导航到文件夹
            currentRootFolder = result.rootKey || currentRootFolder;
            currentPath = result.path;
            updateBreadcrumb();
            renderMainContent();
          });
        } else if (result.item.type === "url") {
          scifiItem.addEventListener("click", function(e) {
            // 如果点击的是信息按钮，不执行打开链接
            if (e.target.closest('.info-button')) {
              return;
            }
            // 打开URL链接
            window.open(result.item.url, "_blank");
          });
        }
        
        scifiContainer.appendChild(scifiItem);
      });
    }
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