// 模态窗口模块
// 使用全局函数，不再导入
// import { formatChromeTimestamp } from './utils.js';

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
  if (window.modalTimer) {
    clearTimeout(window.modalTimer);
    window.modalTimer = null;
  }

  window.currentDetailsItem = item;
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
    if (window.modalTimer) {
      clearTimeout(window.modalTimer);
      window.modalTimer = null;
    }
  });

  // 添加鼠标离开模态窗口事件，延迟关闭
  modalOverlay.addEventListener('mouseleave', function() {
    if (!window.modalTimer) {
      window.modalTimer = setTimeout(closeModal, 300);
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
  window.currentDetailsItem = null;

  // 清除定时器
  if (window.modalTimer) {
    clearTimeout(window.modalTimer);
    window.modalTimer = null;
  }
}

// 改为全局函数
window.createModal = createModal;
window.openModal = openModal;
window.closeModal = closeModal;
window.addDetailRow = addDetailRow; 