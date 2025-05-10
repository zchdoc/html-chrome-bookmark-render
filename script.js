// 全局变量
let bookmarksData = null;
let currentRootFolder = "bookmark_bar";
let currentPath = [];
let currentDetailsItem = null;
let modalTimer = null; // 添加定时器变量，用于控制模态窗口显示/隐藏
let currentViewMode = "waterfall"; // 添加视图模式变量，默认为瀑布流
let spaceBookmarksPositions = {}; // 存储每个书签在空间中的位置
let spaceAutoRotate = true; // 星际视图自动旋转控制

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
    console.log('初始化书签内容...');
    
    // 从全局变量获取书签数据
    if (!window.BookmarksDemo) {
      console.error('错误: BookmarksDemo 数据未定义');
      return;
    }
    
    // 将BookmarksDemo数据赋值给bookmarksData
    bookmarksData = window.BookmarksDemo;
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
    currentPath = [];
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
    console.log('渲染主内容 - 当前视图模式:', currentViewMode);
    bookmarkContent.innerHTML = "";

    if (!bookmarksData) {
      console.error('错误: bookmarksData 未定义');
      bookmarkContent.innerHTML = "<p class='error'>书签数据未加载</p>";
      return;
    }

    if (!bookmarksData.roots) {
      console.error('错误: bookmarksData.roots 未定义');
      bookmarkContent.innerHTML = "<p class='error'>书签数据结构不正确</p>";
      return;
    }

    if (!bookmarksData.roots[currentRootFolder]) {
      console.error(`错误: 根文件夹 ${currentRootFolder} 不存在`);
      bookmarkContent.innerHTML = `<p class='error'>根文件夹 ${currentRootFolder} 不存在</p>`;
      return;
    }

    console.log(`获取 ${currentRootFolder} 的子项...`);
    let currentItems = bookmarksData.roots[currentRootFolder].children;
    
    if (!currentItems) {
      console.error(`错误: ${currentRootFolder} 没有子项`);
      bookmarkContent.innerHTML = `<p class='error'>${getRootFolderName(currentRootFolder)} 没有子项</p>`;
      return;
    }

    // 根据当前路径获取要显示的items
    console.log('当前路径:', currentPath);
    for (const index of currentPath) {
      if (currentItems[index] && currentItems[index].children) {
        currentItems = currentItems[index].children;
      } else {
        console.error(`错误: 无法按路径 ${currentPath} 导航`);
        break;
      }
    }
    
    console.log(`找到 ${currentItems.length} 个项目用于显示`);

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

    // 星际视图按钮
    const spaceButton = document.createElement("button");
    spaceButton.className = "view-toggle-button" + (currentViewMode === "space" ? " active" : "");
    spaceButton.textContent = "星际视图";
    spaceButton.addEventListener("click", () => {
      if (currentViewMode !== "space") {
        currentViewMode = "space";
        renderMainContent();
      }
    });
    viewToggleButtons.appendChild(spaceButton);

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
    } else if (currentViewMode === "space") {
      // 创建星际空间视图容器
      const spaceContainer = document.createElement("div");
      spaceContainer.className = "space-container";
      bookmarkContent.appendChild(spaceContainer);

      // 添加星空背景
      const spaceStars = document.createElement("div");
      spaceStars.className = "space-stars";
      spaceContainer.appendChild(spaceStars);

      // 添加网格背景
      const spaceGrid = document.createElement("div");
      spaceGrid.className = "space-grid";
      spaceContainer.appendChild(spaceGrid);

      // 添加当前路径显示
      const spacePath = document.createElement("div");
      spacePath.className = "space-active-path";
      let pathText = getRootFolderName(currentRootFolder);
      currentPath.forEach((index, level) => {
        const pathItem = bookmarksData.roots[currentRootFolder].children;
        let currentItems = pathItem;

        for (let i = 0; i <= level; i++) {
          if (i === level) {
            pathText += " > " + currentItems[currentPath[i]].name;
          } else if (currentItems[currentPath[i]] && currentItems[currentPath[i]].children) {
            currentItems = currentItems[currentPath[i]].children;
          }
        }
      });
      spacePath.textContent = pathText;
      spaceContainer.appendChild(spacePath);

      // 渲染当前层级的内容
      if (currentItems && currentItems.length > 0) {
        renderSpaceItems(currentItems, spaceContainer);
      } else {
        const noContent = document.createElement("div");
        noContent.style.color = "white";
        noContent.style.textAlign = "center";
        noContent.style.marginTop = "30vh";
        noContent.style.fontSize = "18px";
        noContent.textContent = "没有书签内容";
        spaceContainer.appendChild(noContent);
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

  // 渲染星际视图书签项目
  function renderSpaceItems(items, container) {
    // 清除之前的位置数据
    spaceBookmarksPositions = {};
    
    // 调试信息 - 检查是否有项目传入
    console.log(`星际视图渲染: 接收到 ${items.length} 个项目`);
    
    // 在容器上直接添加一个标记，表示这是一个星际视图
    container.setAttribute('data-view', 'space');
    
    // 创建轨道
    const maxOrbit = Math.min(5, Math.ceil(items.length / 5));
    console.log(`创建 ${maxOrbit} 个轨道`);
    const orbits = [];

    for (let i = 0; i < maxOrbit; i++) {
      const orbit = document.createElement("div");
      orbit.className = "space-orbit";
      const size = 300 + (i * 150); // 轨道大小递增
      orbit.style.width = size + "px";
      orbit.style.height = size + "px";
      orbit.style.animationDuration = (80 + i * 20) + "s"; // 外层轨道旋转慢一些
      
      // 确保轨道显示
      orbit.style.border = "2px dashed rgba(67, 97, 238, 0.5)";
      orbit.style.boxSizing = "border-box";

      // 仅根据全局设置决定轨道是否旋转
      if (!spaceAutoRotate) {
        orbit.style.animationPlayState = "paused";
      } else {
        orbit.style.animationPlayState = "running";
      }

      container.appendChild(orbit);
      orbits.push(orbit);
    }

    // 创建一个中心球体作为参考点
    const centerOrb = document.createElement("div");
    centerOrb.className = "center-orb";
    centerOrb.style.position = "absolute";
    centerOrb.style.width = "20px";
    centerOrb.style.height = "20px";
    centerOrb.style.backgroundColor = "rgba(255, 255, 255, 0.8)";
    centerOrb.style.borderRadius = "50%";
    centerOrb.style.top = "50%";
    centerOrb.style.left = "50%";
    centerOrb.style.transform = "translate(-50%, -50%)";
    centerOrb.style.zIndex = "10";
    centerOrb.style.boxShadow = "0 0 10px rgba(255, 255, 255, 0.8)";
    container.appendChild(centerOrb);

    // 创建书签布局
    items.forEach((item, index) => {
      // 为每个项目分配一个轨道
      const orbitIndex = index % maxOrbit;
      const orbit = orbits[orbitIndex];
      const orbitSize = 300 + (orbitIndex * 150);
      
      console.log(`项目 ${index}: ${item.name} - 分配到轨道 ${orbitIndex}`);

      // 计算轨道上的位置角度 (均匀分布)
      const itemsInCurrentOrbit = Math.ceil(items.length / maxOrbit);
      const angleStep = 360 / itemsInCurrentOrbit;
      const itemIndexInOrbit = Math.floor(index / maxOrbit);
      const angle = itemIndexInOrbit * angleStep;

      // 创建书签项目元素
      const spaceItem = document.createElement("div");
      spaceItem.className = "space-item";
      spaceItem.setAttribute("data-index", index);
      spaceItem.setAttribute("data-name", item.name);
      spaceItem.setAttribute("data-type", item.type);

      // 根据角度计算位置
      const radians = angle * (Math.PI / 180);
      const radius = orbitSize / 2;
      // 调整计算方式，确保球体显示在轨道上
      const left = 50 + Math.cos(radians) * (radius / orbitSize * 100) / 2;
      const top = 50 + Math.sin(radians) * (radius / orbitSize * 100) / 2;

      // 存储位置信息
      spaceBookmarksPositions[index] = { left, top };

      // 设置位置
      spaceItem.style.left = left + "%";
      spaceItem.style.top = top + "%";
      spaceItem.style.transform = `translateX(-50%) translateY(-50%)`;
      // 确保球体显示
      spaceItem.style.zIndex = 10 + (maxOrbit - orbitIndex);

      // 创建球体
      const spaceOrb = document.createElement("div");
      spaceOrb.className = `space-orb ${item.type === "folder" ? "folder" : "url"}`;
      // 增大球体尺寸
      spaceOrb.style.width = "160px";
      spaceOrb.style.height = "160px";
      // 增加发光效果
      spaceOrb.style.boxShadow = "0 0 30px 5px rgba(67, 97, 238, 0.7), inset 0 0 30px rgba(255, 255, 255, 0.7)";

      // 添加目标标记
      const targetElement = document.createElement("div");
      targetElement.className = "space-target";
      targetElement.style.opacity = "0.8"; // 使目标标记更明显
      spaceOrb.appendChild(targetElement);

      // 添加图标
      const iconElement = document.createElement("div");
      iconElement.className = "space-icon";
      iconElement.textContent = item.type === "folder" ? "📁" : "🔗";
      iconElement.style.fontSize = "36px"; // 增大图标
      spaceOrb.appendChild(iconElement);

      // 添加名称
      const nameElement = document.createElement("div");
      nameElement.className = "space-name";
      nameElement.textContent = item.name;
      nameElement.style.fontSize = "16px"; // 增大字体
      nameElement.style.maxWidth = "140px"; // 增加宽度
      spaceOrb.appendChild(nameElement);

      // 如果是URL，添加URL指示器
      if (item.type === "url") {
        const urlIndicator = document.createElement("div");
        urlIndicator.className = "space-url-indicator";
        // 显示简化的URL
        let displayUrl = item.url;
        try {
          const urlObj = new URL(item.url);
          displayUrl = urlObj.hostname;
        } catch (e) {
          // 如果解析URL失败，使用原始URL
        }
        urlIndicator.textContent = displayUrl;
        urlIndicator.style.opacity = "1"; // 始终显示URL
        urlIndicator.style.background = "rgba(0, 0, 0, 0.5)";
        spaceOrb.appendChild(urlIndicator);
      }

      // 添加查看提示
      const hintElement = document.createElement("div");
      hintElement.className = "space-view-hint";
      hintElement.textContent = item.type === "folder" ? "点击查看文件夹" : "点击打开链接";
      hintElement.style.opacity = "0.7"; // 默认显示提示
      hintElement.style.background = "rgba(67, 97, 238, 0.5)"; 
      spaceOrb.appendChild(hintElement);

      // 添加光晕
      const glowElement = document.createElement("div");
      glowElement.className = "space-glow";
      glowElement.style.opacity = "0.5"; // 增强光晕效果
      spaceOrb.appendChild(glowElement);

      // 添加光环
      const ringElement = document.createElement("div");
      ringElement.className = "space-ring";
      ringElement.style.opacity = "0.8"; // 增强光环效果
      spaceOrb.appendChild(ringElement);

      // 添加信息按钮
      const infoBtn = document.createElement("div");
      infoBtn.className = "space-info-btn";
      infoBtn.textContent = "i";
      infoBtn.style.opacity = "0.8"; // 默认显示信息按钮
      infoBtn.addEventListener("mouseenter", (e) => {
        e.stopPropagation();
        openModal(item);
      });
      infoBtn.addEventListener("mouseleave", (e) => {
        e.stopPropagation();
        if (!modalTimer) {
          modalTimer = setTimeout(closeModal, 300);
        }
      });
      spaceOrb.appendChild(infoBtn);

      // 添加悬停提示工具提示
      const tooltip = document.createElement("div");
      tooltip.className = "space-tooltip";

      const tooltipTitle = document.createElement("div");
      tooltipTitle.className = "space-tooltip-title";
      tooltipTitle.textContent = item.name;
      tooltip.appendChild(tooltipTitle);

      if (item.type === "url") {
        const tooltipUrl = document.createElement("div");
        tooltipUrl.className = "space-tooltip-url";
        tooltipUrl.textContent = item.url;
        tooltip.appendChild(tooltipUrl);
      }

      const tooltipInfo = document.createElement("div");
      tooltipInfo.className = "space-tooltip-info";
      tooltipInfo.textContent = `添加时间: ${formatChromeTimestampSimple(item.date_added)}`;
      tooltip.appendChild(tooltipInfo);

      spaceItem.appendChild(tooltip);

      // 鼠标悬停事件
      spaceItem.addEventListener('mouseenter', function() {
        console.log(`悬停在项目上: ${item.name}`);
        // 调整提示框位置
        const rect = spaceItem.getBoundingClientRect();
        tooltip.style.left = "150%";
        tooltip.style.top = "0";

        // 确保提示框不超出容器
        const tooltipRect = tooltip.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();

        if (tooltipRect.right > containerRect.right) {
          tooltip.style.left = "auto";
          tooltip.style.right = "150%";
        }

        if (tooltipRect.bottom > containerRect.bottom) {
          tooltip.style.top = "auto";
          tooltip.style.bottom = "0";
        }
      });
      
      // 鼠标离开时恢复轨道旋转
      spaceItem.addEventListener('mouseleave', function() {
        // 不做任何特殊处理
      });

      // 添加点击事件
      if (item.type === "folder") {
        // 添加脉冲效果表示可以点击
        spaceOrb.classList.add("pulse");

        spaceOrb.addEventListener("click", function(e) {
          console.log(`点击文件夹: ${item.name}`);
          // 如果点击的是信息按钮，不执行导航
          if (e.target.closest('.space-info-btn')) {
            return;
          }

          // 导航到文件夹
          const newPath = [...currentPath, index];
          currentPath = newPath;
          updateBreadcrumb();
          renderMainContent();
        });
      } else if (item.type === "url") {
        spaceOrb.addEventListener("click", function(e) {
          console.log(`点击链接: ${item.name}, URL: ${item.url}`);
          // 如果点击的是信息按钮，不执行打开链接
          if (e.target.closest('.space-info-btn')) {
            return;
          }

          // 打开URL链接
          window.open(item.url, "_blank");
        });
      }

      // 组装并添加到DOM
      spaceItem.appendChild(spaceOrb);
      
      // 直接添加到container，不是orbit
      container.appendChild(spaceItem);
      
      // 在轨道上也添加一个参考点，表示书签位置
      const orbitMarker = document.createElement("div");
      orbitMarker.className = "orbit-marker";
      orbitMarker.style.position = "absolute";
      orbitMarker.style.width = "8px";
      orbitMarker.style.height = "8px";
      orbitMarker.style.backgroundColor = item.type === "folder" ? "gold" : "skyblue";
      orbitMarker.style.borderRadius = "50%";
      orbitMarker.style.boxShadow = "0 0 5px rgba(255, 255, 255, 0.8)";
      orbitMarker.style.top = "50%";
      orbitMarker.style.left = "50%";
      orbitMarker.style.transform = `rotate(${angle}deg) translateX(${radius/2}px) rotate(-${angle}deg)`;
      orbit.appendChild(orbitMarker);
    });
    
    // 添加视觉提示，说明如何使用星际视图
    const helpText = document.createElement("div");
    helpText.className = "space-help-text";
    helpText.textContent = "🔍 点击球体打开书签或文件夹";
    helpText.style.position = "absolute";
    helpText.style.top = "60px";
    helpText.style.right = "20px";
    helpText.style.color = "white";
    helpText.style.background = "rgba(0, 0, 0, 0.5)";
    helpText.style.padding = "8px 15px";
    helpText.style.borderRadius = "20px";
    helpText.style.zIndex = "100";
    container.appendChild(helpText);
    
    // 添加轨道旋转控制按钮
    const rotateBtn = document.createElement("div");
    rotateBtn.className = "space-rotate-btn";
    rotateBtn.textContent = spaceAutoRotate ? "暂停轨道" : "播放轨道";
    rotateBtn.style.position = "absolute";
    rotateBtn.style.bottom = "30px";
    rotateBtn.style.right = "30px";
    rotateBtn.style.backgroundColor = "rgba(0, 0, 0, 0.6)";
    rotateBtn.style.color = "white";
    rotateBtn.style.padding = "10px 15px";
    rotateBtn.style.borderRadius = "20px";
    rotateBtn.style.cursor = "pointer";
    rotateBtn.style.zIndex = "100";
    rotateBtn.style.boxShadow = "0 0 10px rgba(67, 97, 238, 0.7)";
    rotateBtn.style.transition = "background-color 0.3s";
    
    rotateBtn.addEventListener("click", function() {
      spaceAutoRotate = !spaceAutoRotate;
      this.textContent = spaceAutoRotate ? "暂停轨道" : "播放轨道";
      
      // 更新所有轨道的旋转状态
      document.querySelectorAll('.space-orbit').forEach(orbit => {
        orbit.style.animationPlayState = spaceAutoRotate ? "running" : "paused";
      });
    });
    
    // 鼠标悬停效果
    rotateBtn.addEventListener("mouseenter", function() {
      this.style.backgroundColor = "rgba(67, 97, 238, 0.8)";
    });
    
    rotateBtn.addEventListener("mouseleave", function() {
      this.style.backgroundColor = "rgba(0, 0, 0, 0.6)";
    });
    
    container.appendChild(rotateBtn);
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

  // 简化的时间戳格式化函数，用于提示信息
  function formatChromeTimestampSimple(chromeTimestamp) {
    if (!chromeTimestamp || chromeTimestamp === "0") {
      return "未知时间";
    }

    try {
      let timestamp = typeof chromeTimestamp === 'string' ?
        parseInt(chromeTimestamp, 10) : chromeTimestamp;

      let timestampInSeconds = timestamp / 1000000;
      const secondsBetween1601And1970 = 11644473600;
      let unixTimestamp = timestampInSeconds - secondsBetween1601And1970;

      const jsDate = new Date(unixTimestamp * 1000);

      if (isNaN(jsDate.getTime())) {
        return "未知时间";
      }

      // 简化的日期格式
      return jsDate.toLocaleDateString('zh-CN');
    } catch (error) {
      return "未知时间";
    }
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
    function searchInItems(items, path = [], rootKey) {
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
            rootKey
          });
        }

        if (item.children) {
          searchInItems(item.children, currentPath, rootKey);
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

    // 星际视图按钮
    const spaceButton = document.createElement("button");
    spaceButton.className = "view-toggle-button" + (currentViewMode === "space" ? " active" : "");
    spaceButton.textContent = "星际视图";
    spaceButton.addEventListener("click", () => {
      if (currentViewMode !== "space") {
        currentViewMode = "space";
        searchBookmarks(searchTerm);
      }
    });
    viewToggleButtons.appendChild(spaceButton);

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
    } else if (currentViewMode === "space") {
      // 创建星际空间视图容器
      const spaceContainer = document.createElement("div");
      spaceContainer.className = "space-container";
      bookmarkContent.appendChild(spaceContainer);

      // 添加星空背景
      const spaceStars = document.createElement("div");
      spaceStars.className = "space-stars";
      spaceContainer.appendChild(spaceStars);

      // 添加网格背景
      const spaceGrid = document.createElement("div");
      spaceGrid.className = "space-grid";
      spaceContainer.appendChild(spaceGrid);

      // 添加搜索结果路径显示
      const spacePath = document.createElement("div");
      spacePath.className = "space-active-path";
      spacePath.textContent = `搜索结果: "${searchTerm}" (${results.length}个)`;
      spaceContainer.appendChild(spacePath);

      // 渲染搜索结果
      if (results.length > 0) {
        renderSpaceItems(results.map(result => result.item), spaceContainer);
      } else {
        const noContent = document.createElement("div");
        noContent.style.color = "white";
        noContent.style.textAlign = "center";
        noContent.style.marginTop = "30vh";
        noContent.style.fontSize = "18px";
        noContent.textContent = "没有找到匹配的书签";
        spaceContainer.appendChild(noContent);
      }
    }
  }

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
          bookmarksData = data;
          
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

  // 为演示目的，加载demo数据
  if (typeof BookmarksDemo !== "undefined") {
    bookmarksData = BookmarksDemo;
    initBookmarks();
  }
});