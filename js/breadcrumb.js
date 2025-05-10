// 面包屑导航模块
// 使用全局函数，不再导入
// import { getRootFolderName } from './main.js';

// 更新面包屑导航
function updateBreadcrumb() {
  const breadcrumbElement = document.getElementById("breadcrumb");
  breadcrumbElement.innerHTML = "";

  // 添加根目录
  const rootElement = document.createElement("span");
  rootElement.textContent = getRootFolderName(window.currentRootFolder);
  rootElement.style.cursor = "pointer";
  rootElement.addEventListener("click", () => {
    window.currentPath = [];
    updateBreadcrumb();
    renderMainContent();
  });
  breadcrumbElement.appendChild(rootElement);

  // 添加当前路径
  let currentItems = window.bookmarksData.roots[window.currentRootFolder].children;
  let partialPath = [];

  window.currentPath.forEach((index, level) => {
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
        window.currentPath = thisPath;
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

// 改为全局函数
window.updateBreadcrumb = updateBreadcrumb; 