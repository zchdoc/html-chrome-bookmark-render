// 渲染器模块
// 使用全局函数，不再导入
// import { createInfoButton } from './infoButton.js';
// import { getRootFolderName } from './main.js';
// import { formatChromeTimestampSimple } from './utils.js';
// import { updateBreadcrumb } from './breadcrumb.js';
// import { renderScifiItems, renderSpaceItems } from './renderers2.js';
// import { openModal, closeModal } from './modal.js';

// 渲染主内容区域
function renderMainContent() {
  const bookmarkContent = document.getElementById("bookmark-content");
  console.log('渲染主内容 - 当前视图模式:', window.currentViewMode);
  bookmarkContent.innerHTML = "";

  if (!window.bookmarksData) {
    console.error('错误: bookmarksData 未定义');
    bookmarkContent.innerHTML = "<p class='error'>书签数据未加载</p>";
    return;
  }

  if (!window.bookmarksData.roots) {
    console.error('错误: bookmarksData.roots 未定义');
    bookmarkContent.innerHTML = "<p class='error'>书签数据结构不正确</p>";
    return;
  }

  if (!window.bookmarksData.roots[window.currentRootFolder]) {
    console.error(`错误: 根文件夹 ${window.currentRootFolder} 不存在`);
    bookmarkContent.innerHTML = `<p class='error'>根文件夹 ${window.currentRootFolder} 不存在</p>`;
    return;
  }

  console.log(`获取 ${window.currentRootFolder} 的子项...`);
  let currentItems = window.bookmarksData.roots[window.currentRootFolder].children;
  
  if (!currentItems) {
    console.error(`错误: ${window.currentRootFolder} 没有子项`);
    bookmarkContent.innerHTML = `<p class='error'>${getRootFolderName(window.currentRootFolder)} 没有子项</p>`;
    return;
  }

  // 根据当前路径获取要显示的items
  console.log('当前路径:', window.currentPath);
  for (const index of window.currentPath) {
    if (currentItems[index] && currentItems[index].children) {
      currentItems = currentItems[index].children;
    } else {
      console.error(`错误: 无法按路径 ${window.currentPath} 导航`);
      break;
    }
  }
  
  console.log(`找到 ${currentItems.length} 个项目用于显示`);

  // 创建视图切换控件
  createViewToggle(bookmarkContent);

  // 根据当前视图模式创建相应的容器
  if (window.currentViewMode === "waterfall") {
    renderWaterfallView(currentItems, bookmarkContent);
  } else if (window.currentViewMode === "scifi") {
    renderScifiView(currentItems, bookmarkContent);
  } else if (window.currentViewMode === "space") {
    renderSpaceView(currentItems, bookmarkContent);
  }
}

// 创建视图切换控件
function createViewToggle(container) {
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
      renderMainContent();
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
      renderMainContent();
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
      renderMainContent();
    }
  });
  viewToggleButtons.appendChild(spaceButton);

  viewToggleContainer.appendChild(viewToggleButtons);
  container.appendChild(viewToggleContainer);
}

// 渲染瀑布流视图
function renderWaterfallView(items, parentContainer) {
  // 创建瀑布流容器
  const waterfallContainer = document.createElement("div");
  waterfallContainer.className = "waterfall-container";
  parentContainer.appendChild(waterfallContainer);

  // 渲染当前层级的内容
  if (items && items.length > 0) {
    renderBookmarkItems(items, waterfallContainer);
  } else {
    waterfallContainer.innerHTML = "<p>没有书签内容</p>";
  }
}

// 渲染科幻视图
function renderScifiView(items, parentContainer) {
  // 创建科幻视图容器
  const scifiContainer = document.createElement("div");
  scifiContainer.className = "scifi-container";
  parentContainer.appendChild(scifiContainer);

  // 渲染当前层级的内容
  if (items && items.length > 0) {
    renderScifiItems(items, scifiContainer);
  } else {
    scifiContainer.innerHTML = "<p>没有书签内容</p>";
  }
}

// 渲染星际视图
function renderSpaceView(items, parentContainer) {
  // 创建星际空间视图容器
  const spaceContainer = document.createElement("div");
  spaceContainer.className = "space-container";
  parentContainer.appendChild(spaceContainer);

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
  let pathText = getRootFolderName(window.currentRootFolder);
  window.currentPath.forEach((index, level) => {
    const pathItem = window.bookmarksData.roots[window.currentRootFolder].children;
    let currentItems = pathItem;

    for (let i = 0; i <= level; i++) {
      if (i === level) {
        pathText += " > " + currentItems[window.currentPath[i]].name;
      } else if (currentItems[window.currentPath[i]] && currentItems[window.currentPath[i]].children) {
        currentItems = currentItems[window.currentPath[i]].children;
      }
    }
  });
  spacePath.textContent = pathText;
  spaceContainer.appendChild(spacePath);

  // 渲染当前层级的内容
  if (items && items.length > 0) {
    renderSpaceItems(items, spaceContainer);
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

// 渲染书签项目 (瀑布流视图)
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
        const newPath = [...window.currentPath, index];

        // 更新当前路径
        window.currentPath = newPath;
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

// 改为全局函数
window.renderMainContent = renderMainContent;
window.renderBookmarkItems = renderBookmarkItems; 