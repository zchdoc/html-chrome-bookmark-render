// 预加载脚本，检查ES模块兼容性
(function() {
  // 检查浏览器是否支持ES模块
  const supportsModules = 'noModule' in HTMLScriptElement.prototype;
  
  if (!supportsModules) {
    // 如果不支持ES模块，显示一个友好的错误消息
    document.addEventListener('DOMContentLoaded', function() {
      const welcomeInfo = document.getElementById('welcome-info');
      if (welcomeInfo) {
        welcomeInfo.innerHTML = `
          <h2 style="color:red">浏览器不支持</h2>
          <p>您的浏览器不支持ES模块，请使用较新版本的浏览器：</p>
          <ul>
            <li>Chrome 61+</li>
            <li>Firefox 60+</li>
            <li>Safari 11+</li>
            <li>Edge 16+</li>
          </ul>
        `;
      }
    });
  }
})(); 