---
sidebar_position: 5
toc_min_heading_level: 2
toc_max_heading_level: 5
description: 深入探索LUA智能决策在RTA SaaS中的应用！本文全面介绍LUA智能决策的系统函数、内置模块（如srta、string、time）、被调函数（一次请求main、二次请求second）以及代码调试方法（通过sRTA沙箱和hijack函数模拟数据）。为广告开发者提供详细的LUA编程指南，助力实现精准的广告决策逻辑。
keywords: [LUA智能决策, RTA SaaS, 系统函数, 内置模块, srta, string, time, 被调函数, main, second, 代码调试, sRTA沙箱, hijack函数]
---

# 5 LUA智能决策

## 5.1 系统函数列表

出于安全及性能原因，RTA SaaS禁用了大量不必要的 LUA功能。以下为支持的全局函数列表。

| 函数名 | 功能 |
| :-- | :-- |
| next | 对table进行遍历 |
| print | 打印信息（注：**在生产环境中该函数被设置为不输出**） |
| tonumber | 转换为数字 |
| tostring | 转换为文本 |
| type | 获取变量类型 |
| unpack | 将table 的元素解包为多值返回 |

## 5.2 内置模块srta

### 5.2.1 常量
服务内置了名为 srta 的模块，提供了访问数据的功能及相关常量。

**数据区**
| 常量名称 | 含义 | 适用函数或变量 |
| :-- | :-- | :-- |
| srta.DS_DID | 默认设备数据空间编号 | srta.get_dsdata() |
| srta.DS_WUID | 默认 WUID数据空间编号 | srta.get_dsdata() |

**字段区**
| 常量名称 | 含义 | 适用函数或变量 |
| :-- | :-- | :-- |
| srta.U8 | UINT8字段区 | dsdata |
| srta.U32 | UINT32字段区 | dsdata |
| srta.FLAG | FLAG字段区 | dsdata |

**操作系统**
| 常量名称 | 含义 | 适用函数或变量 |
| :-- | :-- | :-- |
| srta.OS_UNKNOWN | 未知操作系统 | srta.get_os() |
| srta.OS_IOS |  iOS | srta.get_os() |
| srta.OS_ANDROID | Android | srta.get_os() |
| srta.OS_OTHER | 其它操作系统 | srta.get_os() |

**站点集**
| 常量名称 | 含义 | 适用函数或变量 |
| :-- | :-- | :-- |
| srta.SITESET_UNION | 优量汇 | srta.get_siteset() |
| srta.SITESET_WECHAT | 微信| srta.get_siteset() |
| srta.SITESET_XQ | XQ | srta.get_siteset() |
| srta.SITESET_XS_NEWS | 腾讯新闻 | srta.get_siteset() |
| srta.SITESET_XS_VIDEO | 腾讯视频 | srta.get_siteset() |

**策略参数**
| 常量名称 | 含义 | 适用函数或变量 |
| :-- | :-- | :-- |
| srta.TARGETINFO_ENABLE | 策略参竞 | target_info |
| srta.TARGETINFO_CPC_PRICE | CPC出价 | target_info |
| srta.TARGETINFO_CPA_PRICE | CPA出价 | target_info |
| srta.TARGETINFO_USER_WEIGHT_FACTOR | 用户权重系数 | target_info |
| srta.TARGETINFO_CPC_FACTOR | CPC出价系数 | target_info |

### 5.2.2 函数列表

| 函数名 | 功能 |
| :-- | :-- |
| srta.get_dsdata | 获取数据空间数据 |
| srta.get_targets | 获取需决策的策略ID列表 |
| srta.get_apps | 获取App安装态(需授权) |
| srta.get_scores | 获取模型分(需授权) |
| srta.get_os | 获取终端操作系统 |
| srta.get_siteset | 获取站点集ID |
| srta.get_expid | 获取实验分桶ID |


### 5.2.3 srta.get_dsdata函数

返回的数据以 LUA Table 结构存在，定义如下
```lua
didData = srta.get_dsdata(srta.DS_DID) -- 获取设备数据

-- 以下为字段返回值示例
didData = {
    [1] = {0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, .... 0, 0, 0, 0, 0, 0, 0, 0},
    [2] = {0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0},
    [3] = {false, false, false, false,false, false, false, false}
}
```

### 5.2.4 srta.get_targets函数

返回的数据以 LUA Table 结构存在，定义如下

```lua
targets = srta.get_targets() -- 获取策略列表

-- 以下为字段返回值示例
targets = {"news", "music", "video_for_new"}
```

### 5.2.5 srta.get_apps函数

一次可以获得多个App安装态，每个返回值为 true(已安装)/false(未安装)/nil(无权限或不可靠)中的一个状态

```lua
app1, app2, app3 = srta.get_apps(app1hash, app2hash, app3hash) -- 获取App安装态，可支持多个。

-- 以下为字段返回值示例
app1 = true
app2 = false
app3 = nil
```

### 5.2.6 srta.get_scores函数

一次可以获得多个模型打分，每个返回值为数字/nil(无权限或不可靠)中的一个状态

```lua
score1, score2, score3 = srta.get_scores(model1, model2, model1) -- 获取模型分，可支持多个。
-- 以下为字段返回值示例
score1 = 0
score2 = 80
score3 = nil
```

### 5.2.7 srta.get_os函数

获取终端的操作系统。返回值参考[系统常量]

```lua
os = srta.get_os() -- 获取终端操作系统

-- 以下为返回值示例
1 -- 代表iOS，可以用srta常量进行判断
```

### 5.2.8 srta.get_siteset函数

获取媒体站点集ID。返回值参考[系统常量]

```lua
siteset = srta.get_siteset() -- 获取媒体站点集ID

-- 以下为返回值示例
21 -- 21代表微信，可以用srta常量进行判断
```

### 5.2.9 srta.get_expid函数

获取实验分桶编号。返回值为 0-10。1-10 每个分桶 UV 比例接近于 10%。由于系统原因，目前线上极少量的流量不会被分到任何实验分组，当分桶号为 0 时，代表流量未分桶。

```lua
expid = srta.get_expid() -- 获取实验分桶号

-- 以下为返回值示例
5 -- 代表5号分桶
```

## 5.3 内置模块string

string为字符串计算相关功能函数。

### 5.3.1 函数列表

| 函数名 | 功能 |
| :-- | :-- |
| string.split | 切割字符串 |

### 5.3.2 string.split函数

使用指定的分割符(sep)对字符串进行分割，并返回分割后的字符串数组。

```lua
str = "test,a,b"
strs = string.split(str, ",")
print("strs len" , #strs)
for i, item in ipairs(strs) do
    print(i, item)
end
-- 以下为字段返回示例
3
1   test
2   a
3   b
```

## 5.4 内置模块time

time为时间计算相关功能函数，系统使用uint32为基础格式，存放Unix Timestamp。

### 5.4.1 函数列表

| 函数名 | 功能 |
| :-- | :-- |
| time.now | 获取当前时间 |
| time.date | 获取日期，一次返回年月日 |
| time.hour | 获取小时 |
| time.minute | 获取分钟 |
| time.second | 获取秒 |
| time.weekday | 获取星期几，星期日为 0，星期一为 1，以此类推 |
| time.truncate | 向下取整，第二参数可指定取整类型 |
| time.addtime | 增减时间，可一次增减时分秒 |
| time.adddate | 增减日期，可一次增减年月日 |
| time.setdate | 设置日期，可一次设置年月日时分秒 |

### 5.4.2 time.now函数

函数获取当前时间戳，返回值为uint32类型。

```lua
now = time.now()
```

### 5.4.3 time.date函数

函数传入时间戳，一次返回年、月、日三个值。

```lua
now = time.now()
year, month, day = time.date(now)
```

### 5.4.4 time.hour函数

函数传入时间戳，返回小时。

```lua
now = time.now()
hour = time.hour(now)
```

### 5.4.5 time.minute函数

函数传入时间戳，返回分钟。

```lua
now = time.now()
minute = time.minute(now)
```

### 5.4.6 time.second函数

函数传入时间戳，返回秒。

```lua
now = time.now()
second = time.second(now)
```

### 5.4.7 time.weekday函数

函数传入时间戳，返回星期几。星期天为 0，星期一为 1，以此类推。

```lua
now = time.now()
weekday = time.weekday(now)
```

### 5.4.8 time.truncate函数

函数传入时间戳，及截断精度，返回截断后的时间戳。

时间精度可以是以下值：month、day、hour、minute。

```lua
now = time.now()
month_start = time.truncate(now, "month") -- 本月开始时间戳
today_start = time.truncate(now, "day") -- 今天开始时间戳
hour_start = time.truncate(now, "hour") -- 本小时开始时间戳
minute_start = time.truncate(now, "minute") -- 本分钟开始时间戳
```

### 5.4.9 time.addtime函数

函数传入时间戳，及增减时间（时分秒），时分秒可为 0 或 负值，返回增减后的时间戳。

```lua
now = time.now()
newstamp = time.addtime(now, -1, 1, 1) -- 前1小时，再增加1分1秒
```

### 5.4.10 time.adddate函数

函数传入时间戳，及增减日期（年月日），年月日可为 0 或 负值，返回增减后的时间戳。

```lua
now = time.now()
newstamp = time.adddate(now, -1, 1, 1) -- 去年，再增加1月1天
```

### 5.4.11 time.setdate函数

函数传入年月日时分秒，返回时间戳。

```lua
newstamp = time.setdate(2025, 6, 18, 12, 13, 14) -- 2025:06:18 12:13:14
```

## 5.5 被调函数

### 5.5.1 一次请求main

#### 5.5.1.1 调用

业务逻辑由使用方实现，为便于系统调用，约定使用main函数名。该函数无入口参数，后续所需数据通过调用内置函数获取

```lua
function main()
    didData = srta.get_dsdata(srta.DS_DID) -- 获取DID数据
    local results = {} -- 返回结果
    
    -- 客户逻辑
    ...

    return results
end
```

较为完整的使用示例

```lua
-- 客户自定义变量，便于理解
IDXU8_NEWS = 1
IDXU8_MUSIC = 2
IDXU8_VIDEO = 3

IDXFLAG_NEWS = 1
IDXFLAG_MUSIC = 2

function main()
    didData = srta.get_dsdata(srta.DS_DID) -- 获取DID数据
    targets = srta.get_targets()
    local results = {} -- 返回结果
    
    for i, targetid in ipairs(targets) do -- 遍历待决策策略ID
        if targetid == "news" then -- 新闻拉活策略
            local is_news_installed = didData[srta.U8][IDXU8_NEWS] == 1 -- 是否新闻已安装
            local is_news_touched = didData[srta.FLAG][IDXFLAG_NEWS] -- 是否新闻已完成当天唤起
            if is_news_installed and (not is_news_touched) then
                results[targetid] = { [srta.TARGETINFO_ENABLE] = true } -- 已安装未拉活，可出拉活广告
            end
        end

        if targetid == "music" then -- 音乐拉活策略
            local is_music_installed = didData[srta.U8][IDXU8_MUSIC] == 1 -- 是否音乐已安装
            local is_music_touched = didData[srta.FLAG][IDXFLAG_MUSIC] -- 是否音乐已完成当天唤起
            if is_music_installed and (not is_music_touched) then
                results[targetid] = { [srta.TARGETINFO_ENABLE] = true } -- 已安装未拉活，可出拉活广告
            end
        end
    
        if targetid == "video_for_new" then -- 视频拉新策略
            local is_video_not_installed = didData[srta.U8][IDXU8_VIDEO] == 0 -- 是否视频未安装
            if is_video_not_installed then
                results[targetid] = { [srta.TARGETINFO_ENABLE] = true } -- 未安装，可出拉新广告
            end
        end
    end

    return results
end
```

#### 5.5.1.2 返回

主函数返回一个结果，为table格式并可引用srta常量以设置以下成员编号

| 成员 | 类型 | 功能 |
| :-- | :-- | :-- |
| srta.TARGETINFO_ENABLE | bool | 策略是否参竞 |
| srta.TARGETINFO_CPC_PRICE | int | 策略CPC出价 |
| srta.TARGETINFO_CPA_PRICE | int | 策略CPA出价 |
| srta.TARGETINFO_USER_WEIGHT_FACTOR | float | 策略用户权重系数 |
| srta.TARGETINFO_CPC_FACTOR | float | 策略CPC出价系数 |


### 5.5.2 二次请求second

#### 5.5.2.1 调用

待更新

#### 5.5.2.2 返回

待更新

## 5.6 代码调试

sRTA 创建了完全独立的 LUA 运行时，有自己的生态库及机密数据依赖，所以`无法在IDE内调试`。需要通过 [API接口](./api.md#scriptrun) 提交代码`在服务端沙箱运行并返回结果`。

根据数据源的不同，在沙箱运行有不同的限制。

| 引用数据源 | 真实数据 | 沙箱数据 | 说明 |
| :--: | :--: | :--: | :-- |
| 一方 | 可 | 可 | 可通过 API 参数传递 did/openid 信息，沙箱在运行 srta.get_dsdata 时自动读取存储于服务端的用户数据。<br/>也可用hijack模拟 |
| 二方 | 否 | 可 | 通过hijack模拟返回 |
| 三方 | 否 | 可 | 通过hijack模拟返回 |

### 5.6.1 沙箱函数hijack

#### 5.6.1.1 入口

约定使用hijack函数名并由使用方实现，在该函数内可以劫持部分系统模块功能调用，以桩数据内容返回。该函数无入口参数。

```lua
function hijack()
    local sandbox = {}
    -- 数据模拟

    return sandbox
end
```


#### 5.6.1.2 返回

hijack函数返回一个沙箱结果集合。

较为完整的使用示例
```lua
function hijack()
    print("hijack run")
    local sandbox = {
    srta_get_dsdata = {
        [srta.DS_DID] = {[srta.U8] = {[1] = 100},
            [srta.U32] = {[2] = 99},
            [srta.FLAG] = {[1] = true}}
        },
        srta_get_targets = {"t1", "t2", "t3"},
        srta_get_apps = {
            [13717681] = true,
            [3704767080] = true
        },
        srta_get_scores = {
            [200701123] = 10,
            [200701129] = 50
        },
        srta_get_os = srta.OS_IOS,
        srta_get_expid = 1,
        srta_get_siteset = srta.SITESET_WECHAT,
        time_now = 1755414905
    }

    return sandbox
end
```

**返回约定：**
+ 一级成员变量：使用 `模块名_函数`。例如 `srta.get_dsdata` 函数，在 table 中命名为 `srta_get_dsdata`
+ 无参数函数：使用对应 `模块名_函数` 成员的值。例如 `srta.get_os()`，在上述例子中将返回 `srta.OS_IOS`
+ 单参数函数：使用对应 `模块名_函数` 成员的 `以函数参数为索引的` 次级值。例如 `srta_get_dsdata(srta.DS_DID)`，在上述例子中将返回 `srta_get_dsdata[srta.DS_DID]`的 value。
+ 多参数多返回函数：使用对应 `模块名_函数` 成员的 `以函数参数为索引的` 次级值。例如 `srta_get_scores(1,3)`，在上述例子中将返回 `{10,50}`。

**hijack未填字段默认行为：**

| 函数  | 说明 |
| :-- | :-- |
| srta_get_dsdata | 未指定则使用srta.get_dsdata获取对应用户的真实一方数据。只有部分字段指定时，由指定字段覆盖原DS对应值 |
| srta_get_targets | 使用srta.get_targets获取真实的策略列表 |
| srta_get_apps | 返回nil |
| srta_get_scores | 返回nil |
| srta_get_os | 使用ScriptRun接口调用的 os 字段，如调用接口未指定则为 srta.OS_ANDROID |
| srta_get_expid | 0 |
| srta_get_siteset | 0 |
| time_now | 使用time.now获取真实的系统时间 |
