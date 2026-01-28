---
sidebar_position: 2
toc_min_heading_level: 2
toc_max_heading_level: 5
description: 探索sRTA的奥秘，开启程序化广告新篇章！本文深入介绍sRTA产品，阐述其以SaaS方式助力广告客户低门槛、高灵活度运用RTA能力的定位，详述适用行业与客户场景、产品对比优势。同时，涵盖使用流程、模块一览、对接协议与文档等关键内容，为广告客户带来全新体验与更多业务可能。
keywords: [sRTA, 程序化广告, RTA能力, SaaS方式, 广告客户, 数据管理, 策略管理, 产品对比, 使用流程, 对接协议]
---

# 2 对接流程

sRTA 平台支持两种角色的数据上传和使用模式：

**客户模式**：将自有数据上传到 sRTA 平台，sRTA 在每次广告决策时通过 Lua 脚本引用客户数据，实现广告决策干预。

**服务商模式**：将自有数据上传到 sRTA 平台，通过授权机制授权给客户使用，帮助客户提升广告效果。

**整体过程可描述为**：账号申请-->数据生产-->数据写入-->脚本编写-->脚本测试-->脚本上线-->效果验证

## 2.1 客户模式简述

本示例演示如何通过 sRTA 平台实现根据用户设备ID的安装状态决策拉活拉新，并根据活跃用户级别调节竞争力系数。

**客户拥有最为全面准确的已安装状态及价值数据，该类信息需要客户上传。**

**示例用户**

| 用户ID | 已安装态 | 用户级别 |
|--------|---------|---------|
| 张三 | 已安装 | 低价值 |
| 李四 | 已安装 | 中价值 |
| 王五 | 已安装 | 高价值 |
| 其他 | 未安装 | -- |


**策略：** acitve=拉活，new=拉新

**逻辑：**
- 拉活广告：未安装用户不出。低价值用户降权、中等价值用户维持、高价值用户提权。无价值分数用户以不调节作为兜底。
- 拉新广告：未安装可出。

### 数据准备：准备 JSONL 数据文件

**数据定义规划**

- 数据空间（DS）：`did`
- 字节1：已安装态（0=未安装/未知，1=已安装）
- 字节2：用户级别（1=低价值、2=中等价值、3=高价值、0=未知）

由客户规划各编号字段所指代的意义，生产 `users.jsonl` 文件，每行包含一个用户的数据：

例如下面将 U8区第1字节作为已安装态，第2字节作为用户级别

```json
{"userid":"张三","bytesKv":{"1":1,"2":1}}
{"userid":"李四","bytesKv":{"1":1,"2":2}}
{"userid":"王五","bytesKv":{"1":1,"2":3}}
```

**数据格式说明**

- `userid`：设备号（MD5值小写）
- `bytesKv`：字节数据映射表（key为字节索引1-64，value为字节值0-255）
  - `{"1":1,"2":1}`：字节索引1=1（已安装），字节索引2=1（低价值）
  - `{"1":1,"2":2}`：字节索引1=1（已安装），字节索引2=2（中等价值）
  - `{"1":1,"2":3}`：字节索引1=1（已安装），字节索引2=3（高价值）

### 数据准备：通过 saastool 写入服务端

使用命令行工具将数据写入 sRTA 平台：

`write` 功能用于少量数据写入，如需大量数据写入，请使用 `saastool task` 能力。

```sh
saastool write -ds did -source ./users.jsonl
```

**输出示例**

在全部正确写入的状态下，输出为空字典：
```
{}
```

### 数据准备：DS 中的数据存储

写入成功后，数据在 Redis 中的存储格式为字节数据。sRTA lua在查询时会自动取出当前用户下的数据转换为 dataspace Table变量 供 Lua 脚本使用：

```lua
"张三" = {[srta.U8] = {[1] = 1, [2] = 1}} --字节索引1=1 (已安装），字节索引2=1（低价值）
"李四" = {[srta.U8] = {[1] = 1, [2] = 2}} --字节索引1=1（已安装），字节索引2=2（中价值）
"王五" = {[srta.U8] = {[1] = 1, [2] = 3}} --字节索引1=1（已安装），字节索引2=3（高价值）
```

### 脚本：编写 Lua 实现拉活与调权

创建 `sample.lua` 脚本，实现根据用户安装态及级别判断的拉活和调节系数：

```lua
-- sample.lua:
-- 已安装：根据用户级别调节系数
-- 未安装：出拉新广告

IDXU8_USER_INSTALLED = 1      -- 字节索引1：已安装态
IDXU8_USER_LEVEL = 2          -- 字节索引2：用户级别

-- 主函数：在每次用户决策时被调用
function main()
    -- 从DID数据空间获取用户信息，此处无须填写用户ID，该映射关系由sRTA平台自动处理为当前用户
    didData = srta.get_dsdata(srta.DS_DID)
    installed = didData[srta.U8][IDXU8_USER_INSTALLED] == 1 -- 是否已安装
    userLevel = didData[srta.U8][IDXU8_USER_LEVEL] == 1 -- 用户级别
    
    local results = {} -- 定义返回结果

    local targets = srta.get_targets() -- 获取所有策略ID

    for _, targetid in ipairs(targets) do
        print("installed", installed) -- 打印已安装状态。在手工调试时会输出，在正式运行时自动被禁止。

        if targetid == "dau" and installed then -- 日活策略
            if userLevel == 3 then
                results[targetid] = {
                    [srta.TARGETINFO_ENABLE] = true,
                    [srta.TARGETINFO_USER_WEIGHT_FACTOR]= 1.3 -- 高价值用户提权
                }
            elseif userLevel == 2 then
                results[targetid] = {
                    [srta.TARGETINFO_ENABLE] = true,
                    [srta.TARGETINFO_USER_WEIGHT_FACTOR]= 1.0 -- 中价值用户维持
                }
            elseif userLevel == 1 then
                results[targetid] = {
                    [srta.TARGETINFO_ENABLE] = true,
                    [srta.TARGETINFO_USER_WEIGHT_FACTOR]= 0.8 --低价值用户降权
                }
            else 
                results[targetid] = {
                    [srta.TARGETINFO_ENABLE] = true -- 其他情况不调节
                }
            end
        else if targetid=="new" and not installed then -- 拉新策略
            results[targetid] = {
                [srta.TARGETINFO_ENABLE] = true
            }
        end
    end

    return results
end
```

### 脚本：测试

本地测试脚本逻辑：

```sh
# 测试 USERID1（低价值用户）
saastool script debug -lua ./sample.lua -did 张三 -os 2

# 测试 USERID2（中等价值用户）
saastool script debug -lua ./sample.lua -did 李四 -os 2

# 测试 USERID3（高价值用户）
saastool script debug -lua ./sample.lua -did 王五 -os 2

```

### 脚本：上线

确认脚本测试无误后，上线脚本：

:::important[重要]
脚本创建后，需要 sRTA 平台管理员审批通过才可被使用 (use)
:::

```sh
# 创建脚本
saastool script create -lua ./sample.lua -name sample

# 设置为默认脚本
saastool script use -name sample
```

### 回收：效果验证

脚本上线后，可以通过以下方式验证效果：

```sh
# 查询实验数据
saastool exp get -beginday 20250101 -endday 20250131 -target active
```
