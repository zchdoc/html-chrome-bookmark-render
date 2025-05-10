// 主题管理模块

// 初始化主题
function initTheme() {
  // 检查本地存储中是否有保存的主题
  const savedTheme = localStorage.getItem('theme');
  // 检查系统主题设置
  const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)').matches;

  // 如果有保存的主题，使用保存的主题
  if (savedTheme) {
    document.documentElement.setAttribute('data-theme', savedTheme);
    document.getElementById('theme-toggle').checked = savedTheme === 'dark';
  } else if (prefersDarkScheme) {
    // 如果没有保存的主题但系统是暗色主题，使用暗色
    document.documentElement.setAttribute('data-theme', 'dark');
    document.getElementById('theme-toggle').checked = true;
  }

  // 监听系统主题变化
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
    if (!localStorage.getItem('theme')) {
      const newTheme = e.matches ? 'dark' : 'light';
      document.documentElement.setAttribute('data-theme', newTheme);
      document.getElementById('theme-toggle').checked = e.matches;
    }
  });
}

// 主题切换处理函数
function themeToggleHandler() {
  const themeToggle = document.getElementById('theme-toggle');
  if (themeToggle.checked) {
    document.documentElement.setAttribute('data-theme', 'dark');
    localStorage.setItem('theme', 'dark');
  } else {
    document.documentElement.setAttribute('data-theme', 'light');
    localStorage.setItem('theme', 'light');
  }
}

// 改为全局函数
window.initTheme = initTheme;
window.themeToggleHandler = themeToggleHandler; 