/**
 * CSS迁移脚本 - 将原始的styles.css文件迁移到新的模块化结构
 */
const fs = require('fs');
const path = require('path');

// 确保css目录存在
if (!fs.existsSync('css')) {
  fs.mkdirSync('css');
  console.log('✅ 创建css目录');
}

// 检查原始样式文件是否存在
if (fs.existsSync('styles.css')) {
  // 备份原始样式文件
  fs.copyFileSync('styles.css', 'css/styles-old.css');
  console.log('✅ 备份原始styles.css到css/styles-old.css');
  
  // 如果需要，可以删除原始文件
  // fs.unlinkSync('styles.css');
  // console.log('✅ 删除原始styles.css文件');
} else {
  console.log('❌ 原始styles.css文件不存在');
}

// 检查是否所有分割后的CSS文件都存在
const requiredFiles = [
  'styles.css',
  'base.css',
  'layout.css',
  'components.css',
  'views-waterfall.css',
  'views-scifi.css',
  'views-space.css',
  'modal.css',
  'animations.css'
];

let allFilesExist = true;
for (const file of requiredFiles) {
  const filePath = path.join('css', file);
  if (!fs.existsSync(filePath)) {
    console.log(`❌ 缺少文件: ${filePath}`);
    allFilesExist = false;
  }
}

if (allFilesExist) {
  console.log('✅ 所有CSS文件已就绪');
  console.log('✅ CSS模块化重构完成！');
} else {
  console.log('❌ 有文件缺失，请检查上述错误信息');
}

console.log('\n提示：刷新浏览器以验证CSS样式是否正常工作。');
console.log('如果样式出现问题，可以临时将index.html中的CSS引用改回为styles.css，');
console.log('并解决问题后再次尝试迁移。'); 