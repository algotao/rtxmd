---
sidebar_position: 6
toc_min_heading_level: 2
toc_max_heading_level: 5
description: 以SaaS的方式，让广告客户能够以低门槛、高灵活度的方式使用RTA能力。广告客户可以免除对接整套RTA时涉及到的工程投入、基建投入，专注在策略开发中；同时由于RTA-SaaS部署在平台域内，数据安全和合规性获得更强保障，进而可以衍生出更多玩法，解决更多业务问题。
keywords: [RTA, sRTA, SaaS]
---

# 6 数据底座

## 6.1 一方数据

以下是一方数据存储中的结构示意.

### 6.1.1 命名空间

每个客户可以有 1 个（设备号存储区）或 2 个（设备号+wuid存储区）命名空间。

![sRTA 存储](/img/srta_store1.png)

### 6.1.2 命名空间内存储

存储区有三种类型的字段，可满足不同场景的诉求。

![sRTA 存储结构](/img/srta_store2.png)

uint8 共 128 个		uint32 共 16 个		flagWithExpire 共 8 个

### 6.1.3 字段使用

每个数组的一个值可视为 `一列` 或 `一个维度`,每一列存贮什么内容由使用方自由发挥。

### 6.1.4 使用示例

例如我们可将uint8 的第 0列用于App 的已安装状态，当该值为 1 时，即表示已安装。

![sRTA 存储结构](/img/srta_store3.png)

### 6.1.5 底层存储示意

```c
// 仅作伪代码示意，非真实存储结构
#include <stdint.h>
#include <stdbool.h>

struct FlagWithExpire {
    bool flag;                                 // 标志位
    bool default_flag;                         // 默认值
    uint32_t expire;                           // 过期时间戳
};

struct StoreValue{
    uint8_t bytes[128];                        // byte型存储
    uint32_t uint32s[16];                      // uint32型存储
    struct FlagWithExpire flag_with_expire[8]; // flag型存储
};
```


### 6.1.6 默认值
+ uint8默认值：0
+ uint32默认值：0
+ flagWighExpire默认值为：flag = false, default_flag = false，expire = 0


## 6.2 二方数据

二方数据通过 srta 库函数获取。
 
### 6.2.1 获取安装态
 一次可以获得多个App安装态，每个返回值为 true(已安装)/false(未安装)/nil(无权限或不可靠)中的一个状态，参考函数[srta.get_apps](./lua.md#525-srtaget_apps函数)。

## 6.3 三方数据

三方数据通过 srta 库函数获取，每个维度的数据均需要独立授权。有些数据需要收费，由数据提供方收取。

### 6.3.1 获取打分

一次可以获得多个模型打分，每个返回值为数字/nil(无权限或不可靠)中的一个状态，参考函数[srta.get_scores](./lua.md#526-srtaget_scores函数)。

| 编号 | 模型 | 收费模式 |
| :--- | :--- | :--- |
| 1 | 个贷意愿分 | 金融行业免费 |
| 2 | 金融质量分 | 金融行业免费 |
| 3 | 金融通过分 | 金融行业免费 |
| 4 | 金融提现分 | 金融行业免费 |
| 5 | 新版逾期分 | 金融行业免费 |
| 10 | 企业主资质分 | 金融行业免费 |
| 11 | 企业贷意愿分 | 金融行业免费 |
| 20 | 保险续保分 | 金融行业免费 |
