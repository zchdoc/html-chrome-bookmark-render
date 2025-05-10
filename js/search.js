// 搜索模块
// 使用全局函数，不再导入
// import { createInfoButton } from './infoButton.js';
// import { getRootFolderName } from './main.js';
// import { formatChromeTimestampSimple } from './utils.js';

// 搜索书签
function searchBookmarks(searchTerm) {
  const bookmarkContent = document.getElementById("bookmark-content");
  const breadcrumbElement = document.getElementById("breadcrumb");
  
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
    if (window.bookmarksData.roots[rootKey] && window.bookmarksData.roots[rootKey].children) {
      searchInItems(window.bookmarksData.roots[rootKey].children, [], rootKey);
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
  waterfallButton.className = "view-toggle-button" + (window.currentViewMode === "waterfall" ? " active" : "");
  waterfallButton.textContent = "经典视图";
  waterfallButton.addEventListener("click", () => {
    if (window.currentViewMode !== "waterfall") {
      window.currentViewMode = "waterfall";
      searchBookmarks(searchTerm);
    }
  });
  viewToggleButtons.appendChild(waterfallButton);

  // 科幻视图按钮
  const scifiButton = document.createElement("button");
  scifiButton.className = "view-toggle-button" + (window.currentViewMode === "scifi" ? " active" : "");
  scifiButton.textContent = "科幻视图";
  scifiButton.addEventListener("click", () => {
    if (window.currentViewMode !== "scifi") {
      window.currentViewMode = "scifi";
      searchBookmarks(searchTerm);
    }
  });
  viewToggleButtons.appendChild(scifiButton);

  // 星际视图按钮
  const spaceButton = document.createElement("button");
  spaceButton.className = "view-toggle-button" + (window.currentViewMode === "space" ? " active" : "");
  spaceButton.textContent = "星际视图";
  spaceButton.addEventListener("click", () => {
    if (window.currentViewMode !== "space") {
      window.currentViewMode = "space";
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
  if (window.currentViewMode === "waterfall") {
    renderWaterfallSearchResults(results, bookmarkContent);
  } else if (window.currentViewMode === "scifi") {
    renderScifiSearchResults(results, bookmarkContent);
  } else if (window.currentViewMode === "space") {
    renderSpaceSearchResults(results, bookmarkContent, searchTerm);
  }
}

// 渲染瀑布流搜索结果
function renderWaterfallSearchResults(results, container) {
  // 创建瀑布流容器
  const searchResultContainer = document.createElement("div");
  searchResultContainer.className = "waterfall-container";
  container.appendChild(searchResultContainer);

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
        window.currentRootFolder = result.rootKey || window.currentRootFolder;
        window.currentPath = result.path;
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
}

// 渲染科幻视图搜索结果
function renderScifiSearchResults(results, container) {
  // 创建科幻视图容器
  const scifiContainer = document.createElement("div");
  scifiContainer.className = "scifi-container";
  container.appendChild(scifiContainer);

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
        window.currentRootFolder = result.rootKey || window.currentRootFolder;
        window.currentPath = result.path;
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

// 渲染星际视图搜索结果
function renderSpaceSearchResults(results, container, searchTerm) {
  // 创建星际空间视图容器
  const spaceContainer = document.createElement("div");
  spaceContainer.className = "space-container";
  container.appendChild(spaceContainer);

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
    // 直接调用全局函数渲染星际视图
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

// 改为全局函数
window.searchBookmarks = searchBookmarks; 