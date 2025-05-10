# Chrome书签浏览器

这是一个基于Web的Chrome书签浏览工具，可以以多种视图模式浏览和搜索Chrome书签。

## 项目结构

项目已被重构为模块化结构，主要文件和目录如下：

```
./
├── index.html            # 主HTML文件
├── styles.css            # 样式文件
├── bookmark-loader.js    # 演示数据加载器
└── js/                   # JavaScript模块目录
    ├── main.js           # 主入口文件
    ├── theme.js          # 主题管理模块
    ├── modal.js          # 模态窗口功能
    ├── utils.js          # 实用工具函数
    ├── sidebar.js        # 侧边栏渲染
    ├── infoButton.js     # 信息按钮组件
    ├── breadcrumb.js     # 面包屑导航
    ├── search.js         # 搜索功能
    ├── fileHandler.js    # 文件处理
    ├── renderers.js      # 基础渲染器
    ├── renderersExtra.js # 扩展视图渲染
    └── preload.js        # 预加载脚本
```

## 模块划分

代码已根据功能划分为以下模块：

1. **主入口模块 (main.js)**：
   - 定义全局变量
   - 初始化应用
   - 设置事件监听器

2. **主题模块 (theme.js)**：
   - 处理暗/亮主题切换
   - 响应系统主题变化

3. **模态窗口模块 (modal.js)**：
   - 创建和管理详情模态窗口
   - 显示书签详细信息

4. **工具函数模块 (utils.js)**：
   - 提供日期格式化等通用功能

5. **侧边栏模块 (sidebar.js)**：
   - 渲染侧边栏书签文件夹

6. **信息按钮模块 (infoButton.js)**：
   - 创建信息按钮组件

7. **面包屑导航模块 (breadcrumb.js)**：
   - 管理页面导航路径

8. **搜索模块 (search.js)**：
   - 实现书签搜索功能

9. **文件处理模块 (fileHandler.js)**：
   - 处理书签文件上传和解析

10. **渲染器模块 (renderers.js & renderersExtra.js)**：
    - 渲染不同视图的书签内容
    - 提供瀑布流、科幻视图和星际视图

## 运行项目

直接在浏览器中打开`index.html`文件即可。上传Chrome书签文件后，可以浏览和搜索书签。 