// 侧边栏模块
// 使用全局函数，不再导入
// import { createInfoButton } from './infoButton.js';

// 渲染侧边栏
function renderSidebar() {
  const sidebarContent = document.getElementById("sidebar-content");
  sidebarContent.innerHTML = "";

  const rootFolder = window.bookmarksData.roots[window.currentRootFolder];
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
        window.currentPath = [index];
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

// 改为全局函数
window.renderSidebar = renderSidebar; 