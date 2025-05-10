// 信息按钮模块
// 使用全局函数，不再导入
// import { openModal, closeModal } from './modal.js';

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
    if (!window.modalTimer) {
      window.modalTimer = setTimeout(closeModal, 300);
    }
  });

  // 初始状态隐藏，只在父元素悬停时显示
  infoBtn.style.opacity = '0';
  infoBtn.style.visibility = 'hidden';
  infoBtn.style.transition = 'opacity 0.3s, visibility 0.3s';

  return infoBtn;
}

// 改为全局函数
window.createInfoButton = createInfoButton; 