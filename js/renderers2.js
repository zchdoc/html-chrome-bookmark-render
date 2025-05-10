// 渲染器模块 - 第二部分
// 使用全局函数，不再导入
// import { createInfoButton } from './infoButton.js';
// import { formatChromeTimestampSimple } from './utils.js';
// import { updateBreadcrumb } from './breadcrumb.js';

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
        const newPath = [...window.currentPath, index];
        // 更新当前路径
        window.currentPath = newPath;
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
  window.spaceBookmarksPositions = {};
  
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
    if (!window.spaceAutoRotate) {
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
    window.spaceBookmarksPositions[index] = { left, top };

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
      if (!window.modalTimer) {
        window.modalTimer = setTimeout(closeModal, 300);
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
        const newPath = [...window.currentPath, index];
        window.currentPath = newPath;
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
  rotateBtn.textContent = window.spaceAutoRotate ? "暂停轨道" : "播放轨道";
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
    window.spaceAutoRotate = !window.spaceAutoRotate;
    this.textContent = window.spaceAutoRotate ? "暂停轨道" : "播放轨道";
    
    // 更新所有轨道的旋转状态
    document.querySelectorAll('.space-orbit').forEach(orbit => {
      orbit.style.animationPlayState = window.spaceAutoRotate ? "running" : "paused";
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

// 改为全局函数
window.renderScifiItems = renderScifiItems;
window.renderSpaceItems = renderSpaceItems; 