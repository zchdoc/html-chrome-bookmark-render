// 工具函数模块

// 辅助函数：格式化Chrome时间戳（微秒）为人类可读日期
function formatChromeTimestamp(chromeTimestamp) {
  if (!chromeTimestamp || chromeTimestamp === "0") {
    return "从未";
  }

  try {
    // Chrome书签使用的是17位时间戳，表示从1601年1月1日起的微秒数

    // 首先确保时间戳是数字
    let timestamp = typeof chromeTimestamp === 'string' ?
      parseInt(chromeTimestamp, 10) : chromeTimestamp;

    // 1. 将微秒转换为秒 (除以1,000,000)
    let timestampInSeconds = timestamp / 1000000;

    // 2. 计算1601-01-01到1970-01-01之间的总秒数
    // 这个值是固定的：11644473600秒 (369年)
    const secondsBetween1601And1970 = 11644473600;

    // 3. 转换为Unix时间戳 (1970年为起点的秒数)
    let unixTimestamp = timestampInSeconds - secondsBetween1601And1970;

    // 打印调试信息
    console.log('时间戳调试:', {
      原始时间戳: chromeTimestamp,
      微秒转秒: timestampInSeconds,
      Unix时间戳: unixTimestamp,
      日期对象: new Date(unixTimestamp * 1000).toISOString()
    });

    // 4. 转换为JavaScript日期对象 (毫秒为单位)
    const jsDate = new Date(unixTimestamp * 1000);

    // 验证日期是否有效
    if (isNaN(jsDate.getTime())) {
      console.error("无效的时间戳:", chromeTimestamp);
      return "无效日期";
    }

    // 格式化为本地日期时间字符串
    return jsDate.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  } catch (error) {
    console.error("时间戳解析错误:", error, chromeTimestamp);
    return "无法解析时间";
  }
}

// 简化的时间戳格式化函数，用于提示信息
function formatChromeTimestampSimple(chromeTimestamp) {
  if (!chromeTimestamp || chromeTimestamp === "0") {
    return "未知时间";
  }

  try {
    let timestamp = typeof chromeTimestamp === 'string' ?
      parseInt(chromeTimestamp, 10) : chromeTimestamp;

    let timestampInSeconds = timestamp / 1000000;
    const secondsBetween1601And1970 = 11644473600;
    let unixTimestamp = timestampInSeconds - secondsBetween1601And1970;

    const jsDate = new Date(unixTimestamp * 1000);

    if (isNaN(jsDate.getTime())) {
      return "未知时间";
    }

    // 简化的日期格式
    return jsDate.toLocaleDateString('zh-CN');
  } catch (error) {
    return "未知时间";
  }
}

// 改为全局函数
window.formatChromeTimestamp = formatChromeTimestamp;
window.formatChromeTimestampSimple = formatChromeTimestampSimple; 