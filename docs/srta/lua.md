---
sidebar_position: 5
toc_min_heading_level: 2
toc_max_heading_level: 5
description: 深入探索LUA智能决策在RTA SaaS中的应用！本文全面介绍LUA智能决策的系统函数、内置模块（如srta、string、time）、决策结果写出函数srta.set_target（所有策略默认参竞，results表写法将于2026年9月底下线）、被调函数（一次请求main、二次请求second）以及代码调试方法（通过sRTA沙箱和hijack函数模拟数据）。为广告开发者提供详细的LUA编程指南，助力实现精准的广告决策逻辑。
keywords: [LUA智能决策, RTA SaaS, 系统函数, 内置模块, srta, set_target, 默认参竞, results表下线, string, time, 被调函数, main, second, 代码调试, sRTA沙箱, hijack函数]
---

# 5 LUA智能决策 {#lua}

## 5.1 系统函数列表 {#sysfunc}

出于安全及性能原因，RTA SaaS禁用了大量不必要的 LUA功能。以下为支持的全局函数列表。

| 函数名 | 功能 |
| :-- | :-- |
| next | 对table进行遍历 |
| print | 打印信息（注：**在生产环境中该函数被设置为不输出**） |
| tonumber | 转换为数字 |
| tostring | 转换为文本 |
| type | 获取变量类型 |
| unpack | 将table 的元素解包为多值返回 |

## 5.2 内置模块srta {#mod-srta}

### 5.2.1 常量 {#srta-const}
服务内置了名为 srta 的模块，提供了访问数据的功能及相关常量。

**数据区**
| 常量名称 | 含义 | 适用函数或变量 |
| :-- | :-- | :-- |
| srta.DS_DID | 默认设备数据空间编号 | srta.get_ds_u8()等、srta.get_dsdata() |
| srta.DS_WUID | 默认 WUID数据空间编号 | srta.get_ds_u8()等、srta.get_dsdata() |
| srta.DS_GEO | 默认 就近数据空间编号 | srta.get_ds_u8()等、srta.get_dsdata() |
| srta.DS_GEOIP | 默认 IP城市数据空间编号 | srta.get_ds_u8()等、srta.get_dsdata() |
| srta.DS_GEOFAC | 默认 常住城市数据空间编号 | srta.get_ds_u8()等、srta.get_dsdata() |

**字段区**
| 常量名称 | 含义 | 适用函数或变量 |
| :-- | :-- | :-- |
| srta.U8 | UINT8字段区 | dsdata |
| srta.U32 | UINT32字段区 | dsdata |
| srta.FLAG | FLAG字段区 | dsdata |

:::tip
字段区常量仅用于对 `srta.get_dsdata()` 返回的 table 做索引。`srta.get_ds_u8` / `srta.get_ds_u32` / `srta.get_ds_flag` 已把字段区包含在函数名中，直接传列号即可，无需使用这三个常量。
:::

**操作系统**
| 常量名称 | 含义 | 适用函数或变量 |
| :-- | :-- | :-- |
| srta.OS_UNKNOWN | 未知操作系统 | srta.get_os() |
| srta.OS_IOS |  iOS | srta.get_os() |
| srta.OS_ANDROID | Android | srta.get_os() |
| srta.OS_HARMONY | 鸿蒙 | srta.get_os() |
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
| srta.TARGETINFO_ENABLE | 策略参竞 | srta.set_target() |
| srta.TARGETINFO_CPC_PRICE | CPC出价 | srta.set_target() |
| srta.TARGETINFO_CPA_PRICE | CPA出价 | srta.set_target() |
| srta.TARGETINFO_USER_WEIGHT_FACTOR | 用户权重系数 | srta.set_target() |
| srta.TARGETINFO_CPC_FACTOR | CPC出价系数 | srta.set_target() |
| srta.TARGETINFO_DC_INFOS | DCA标签信息（数组）| srta.set_target() |

:::tip
这组常量原用于 `main()` 返回的 results 表（target_info），现推荐配合 [srta.set_target](#set_target) 直接写出结果。**results 表写法将于 2026 年 9 月底下线**，详见 [srta.set_target](#set_target)。
:::

**DCA标签信息**
| 常量名称 | 含义 | 适用函数或变量 |
| :-- | :-- | :-- |
| srta.DC_TAG_NAME | DCA标签名称 | DCA数组元素 |
| srta.DC_TAG_VALUE | DCA标签值 | DCA数组元素 |


### 5.2.2 函数列表 {#srta-funclist}

| 函数名 | 功能 |
| :-- | :-- |
| srta.get_dsdata | 获取数据空间数据（**待下线**，请改用 srta.get_ds_u8/get_ds_u32/get_ds_flag） |
| srta.get_ds_u8 | 获取数据空间 U8 字段值（推荐） |
| srta.get_ds_u32 | 获取数据空间 U32 字段值（推荐） |
| srta.get_ds_flag | 获取数据空间 FLAG 字段值（推荐） |
| srta.get_targets | 获取需决策的策略ID列表 |
| srta.set_target | 写出策略决策结果（推荐，替代 results 表返回） |
| srta.get_apps | 获取App安装态(需授权) |
| srta.get_scores | 获取模型分(需授权) |
| srta.get_extscore | 简化版模型分查询(需授权) |
| srta.get_os | 获取终端操作系统 |
| srta.get_siteset | 获取站点集ID |
| srta.get_expid | 获取实验分桶ID |
| srta.get_geo_nearest | 获取地理位置最近的数据 |
| srta.get_geo_points | 获取半径范围内排序的地理位置数据点 |


### 5.2.3 srta.get_dsdata函数 {#get_dsdata}

:::warning 待下线
该函数**已进入待下线状态**，仅为兼容存量脚本保留，不再推荐在新脚本中使用。

请改用 [srta.get_ds_u8 / srta.get_ds_u32 / srta.get_ds_flag](#get_ds_field)，按需只取所需列，性能显著更优。
:::

返回的数据以 LUA Table 结构存在，定义如下
```lua
didData = srta.get_dsdata(srta.DS_DID) -- 获取设备数据

-- 以下为字段返回值示例
didData = {
    [1] = {0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, .... 0, 0, 0, 0, 0, 0, 0, 0},
    [2] = {0, 0, 0, 0, 0, 0, 0, 0},
    [3] = {false, false, false, false}
}
```

### 5.2.4 srta.get_ds_u8 / srta.get_ds_u32 / srta.get_ds_flag函数 {#get_ds_field}

这三个函数用于**按列直接读取**本账号数据空间的字段值，是 [srta.get_dsdata](#get_dsdata) 的高性能替代方案。

与 `get_dsdata` 需要构造完整数据表不同，这三个函数只取出指定列的值，一次调用可读取多列，返回值个数与传入的列号个数一一对应。

```lua
-- 一次读取 DID 空间 U8 的第 1、2、5 列
v1, v2, v5 = srta.get_ds_u8(srta.DS_DID, 1, 2, 5)

-- 一次读取 WUID 空间 U32 的第 1、3 列
n1, n3 = srta.get_ds_u32(srta.DS_WUID, 1, 3)

-- 一次读取 DID 空间 FLAG 的第 1、2 列
f1, f2 = srta.get_ds_flag(srta.DS_DID, 1, 2)

-- 以下为返回值示例
v1 = 100
v2 = 0      -- 该列无数据
v5 = 80
n1 = 1024
n3 = 0
f1 = true
f2 = false
```

**三个函数的对应关系**

| 函数 | 对应字段区 | 列号范围 | 返回值类型 | 取不到时的返回值 |
| :-- | :-- | :-- | :-- | :-- |
| srta.get_ds_u8 | U8 | 1 ~ 64 | 数字（0~255） | `0` |
| srta.get_ds_u32 | U32 | 1 ~ 8 | 数字（0~4294967295） | `0` |
| srta.get_ds_flag | FLAG | 1 ~ 4 | 布尔（true/false） | `false` |

**参数说明**：
- 参数1：数据空间，**只能使用 `srta.DS_*` 常量**（`srta.DS_DID`、`srta.DS_WUID`、`srta.DS_GEO`、`srta.DS_GEOIP`、`srta.DS_GEOFAC`），不接受完整的数据空间ID
- 参数2及之后：一个或多个列号（1-based），列号范围见上表。可传入任意多个，顺序任意，也允许重复

**返回值说明**：
- 返回值个数与列号个数严格一致，按参数顺序返回
- 以下情况该位返回默认值（`get_ds_u8`/`get_ds_u32` 为 `0`，`get_ds_flag` 为 `false`）：
  - 数据空间无数据（如该用户在本账号无 DID 数据、GEO 半径内无点、行政区划码未匹配到数据）
  - 列号超出范围（如给 `get_ds_u8` 传 0 或 65）
- 仅传入数据空间而不传列号时，不返回任何值（LUA 侧接收变量为 `nil`）

:::tip 为什么 get_ds_flag 取不到时返回 false 而不是 0
LUA 中只有 `nil` 和 `false` 为假，数字 `0` 判定为**真**。若 FLAG 取不到时返回 `0`，`if flag then` 会被意外命中。因此 FLAG 统一返回布尔值。
:::

**各数据空间的取值规则**：

| 数据空间 | 取值规则 |
| :-- | :-- |
| srta.DS_DID | 取本账号 DID 空间数据 |
| srta.DS_WUID | 取本账号 WUID 空间数据 |
| srta.DS_GEO | 取用户常住位置 **3 公里**范围内最近一个点的数据 |
| srta.DS_GEOIP | 按 IP 城市行政区划码查询，未精确命中时逐级降级（区县→市→省） |
| srta.DS_GEOFAC | 按常住城市行政区划码查询，未精确命中时逐级降级（区县→市→省） |

**FLAG 字段的过期处理**：`get_ds_flag` 与 `get_dsdata` 的 FLAG 语义完全一致——字段未设置过期时间或尚未过期时返回写入值；已过期时返回该字段的默认值。

:::warning 只能读取本账号数据
这三个函数固定读取**本账号**的数据空间，无法读取其他账号的数据。如需读取合作方账号的模型打分，请使用 [srta.get_scores](#get_scores) 或 [srta.get_extscore](#get_extscore)（需授权）。
:::

**与 srta.get_dsdata 的对比**：

| 特性 | get_dsdata | get_ds_u8 / get_ds_u32 / get_ds_flag |
| :-- | :-- | :-- |
| 状态 | 待下线 | 推荐 |
| 返回形式 | 完整数据表（需二次索引） | 直接返回列值（多返回值） |
| 读取少量列的开销 | 高（需转换全部字段） | 低（只取所需列） |
| 无数据时 | 返回空表 | 返回 `0` / `false` |
| 跨账号读取 | 不支持 | 不支持 |

**改造示例**：

```lua
-- 旧写法（待下线）
didData = srta.get_dsdata(srta.DS_DID)
local is_installed = didData[srta.U8][1] == 1
local level = didData[srta.U32][2]
local touched = didData[srta.FLAG][1]

-- 新写法（推荐）
local is_installed = srta.get_ds_u8(srta.DS_DID, 1) == 1
local level = srta.get_ds_u32(srta.DS_DID, 2)
local touched = srta.get_ds_flag(srta.DS_DID, 1)
```

**使用场景**：
- 绝大多数只需读取少量字段的决策逻辑，均应优先使用本组函数
- 需要在一次调用中批量取出多个列做综合判断

### 5.2.5 srta.get_targets函数 {#get_targets}

返回的数据以 LUA Table 结构存在，定义如下

```lua
targets = srta.get_targets() -- 获取策略列表

-- 以下为字段返回值示例
targets = {"news", "music", "video_for_new"}
```

### 5.2.6 srta.set_target函数 {#set_target}

`srta.set_target` 用于**直接写出单个策略的决策结果**，是 `main()` 构造 results 表返回的高性能替代方案。

:::danger results 表写法将于 2026 年 9 月底下线
`main()` 通过 `return results` 返回结果表的写法**已进入待下线状态，将于 2026 年 9 月底停止支持**。请在此之前将脚本改造为 `srta.set_target`，改造方式见[下方对照示例](#set_target-migrate)。

过渡期内两种写法都可用、可混用，语义完全一致。
:::

#### 5.2.6.1 默认参竞（重要语义变更） {#set_target-default-enable}

:::warning 请先理解这条语义
现在**所有待决策策略默认参竞**。脚本只需表达两件事：**排除谁**、**给谁调权/调权**。
:::

这与早期"必须显式写 `[srta.TARGETINFO_ENABLE] = true` 才参竞"的规则不同：

| 脚本的表达 | 结果 |
| :-- | :-- |
| 完全没提到某策略 | **参竞**（默认放行） |
| `srta.set_target(tid, srta.TARGETINFO_USER_WEIGHT_FACTOR, 1.2)` | 参竞 + 系数 1.2 |
| `srta.set_target(tid, srta.TARGETINFO_ENABLE, false)` | **不参竞** |
| 脚本运行报错 | 该账号本次无决策输出（不做默认放行） |

这样改的原因：过去在 `for` 循环里漏填 `ENABLE = true`，或运营在后台新增了策略而脚本的 `if/elseif` 链没有覆盖它，该策略就会被**静默屏蔽**，排查困难。现在这类遗漏不会再导致策略无法投放。

:::caution 人群定向类脚本请重点检查
如果你的脚本原本是"**命中人群才写 `ENABLE = true`，未命中就不写**"的写法（靠"不写"来屏蔽），必须改为在未命中时**显式写 `ENABLE = false`**，否则未命中人群会被放行投放。
:::

#### 5.2.6.2 三种调用形态 {#set_target-forms}

```lua
-- 形态一：调权（不建 table，推荐）
srta.set_target(targetid, srta.TARGETINFO_USER_WEIGHT_FACTOR, 1.2)

-- 一次可写入多个字段，参数为「键, 值」交替排列，个数不限
srta.set_target(targetid,
    srta.TARGETINFO_USER_WEIGHT_FACTOR, 1.2,
    srta.TARGETINFO_CPA_PRICE, 2500)

-- 形态二：排除（不参竞）
srta.set_target(targetid, srta.TARGETINFO_ENABLE, false)

-- 形态三：整表（便于复用已有的、返回 info 表的辅助函数）
srta.set_target(targetid, {
    [srta.TARGETINFO_USER_WEIGHT_FACTOR] = 1.2,
    [srta.TARGETINFO_CPA_PRICE] = 2500,
})
```

**参数说明**：
- 参数1：策略ID（字符串），来自 [srta.get_targets](#get_targets)
- 参数2及之后，二选一：
  - **键值对形式**：`srta.TARGETINFO_*` 常量与对应值交替排列，可传任意多组。末尾落单的参数会被忽略
  - **整表形式**：一个以 `srta.TARGETINFO_*` 为键的 table（此时参数总数必须为 2）

**返回值**：无。

#### 5.2.6.3 使用要点 {#set_target-notes}

**1. 参竞无需声明**

`ENABLE = true` 是默认语义，写与不写完全等价。只调权时直接写字段即可：

```lua
-- 推荐
srta.set_target(targetid, srta.TARGETINFO_CPA_PRICE, 2500)

-- 等价，但 ENABLE 是多余的
srta.set_target(targetid, srta.TARGETINFO_ENABLE, true, srta.TARGETINFO_CPA_PRICE, 2500)
```

**2. 排除是"粘性"的，不必关心调用顺序**

一旦对某策略写了 `ENABLE = false`，后续再调 `set_target` **既不会让它恢复参竞，也不会给它带上任何字段**。因此"先统一调权、再逐条排除"这类写法可以放心使用：

```lua
for _, targetid in ipairs(srta.get_targets()) do
    -- 先统一调权
    srta.set_target(targetid, srta.TARGETINFO_USER_WEIGHT_FACTOR, 1.1)
end

-- 再排除黑名单，之前写入的系数会一并作废
srta.set_target("bad_target", srta.TARGETINFO_ENABLE, false)
```

**3. 同一策略可多次调用，语义为增量合并**

多次调用同一策略是**合并**而非覆盖，同一字段重复写入以最后一次为准。原先"读-改-写"的写法可直接改为再调一次：

```lua
-- 旧写法
results[tid] = { [srta.TARGETINFO_ENABLE] = true, [srta.TARGETINFO_USER_WEIGHT_FACTOR] = 1.0 }
if is_vip then
    results[tid][srta.TARGETINFO_USER_WEIGHT_FACTOR] = 1.5
end

-- 新写法
srta.set_target(tid, srta.TARGETINFO_USER_WEIGHT_FACTOR, 1.0)
if is_vip then
    srta.set_target(tid, srta.TARGETINFO_USER_WEIGHT_FACTOR, 1.5)
end
```

**4. 只对本次待决策的策略生效**

传入的策略ID若不在 [srta.get_targets](#get_targets) 返回的列表中，该次调用会被系统忽略，不产生任何副作用。因此**无需先判断策略是否在列表里**：

```lua
-- 无需遍历，直接写目标策略即可
srta.set_target("my_special_target", srta.TARGETINFO_ENABLE, false)
```

**5. 与 `return results` 可以混用**

过渡期内两种写法语义一致，系统会先取 `set_target` 写出的结果，再合并返回表。`ENABLE = false` 无论出现在哪一侧都是粘性排除。

**6. DCA 标签的写法**

`srta.TARGETINFO_DC_INFOS` 的值仍是数组表，结构不变：

```lua
srta.set_target(targetid, srta.TARGETINFO_DC_INFOS, {
    { [srta.DC_TAG_NAME] = "category", [srta.DC_TAG_VALUE] = "electronics" },
    { [srta.DC_TAG_NAME] = "brand",    [srta.DC_TAG_VALUE] = "tech_brand" },
})
```

#### 5.2.6.4 改造对照 {#set_target-migrate}

**场景一：全量调权**

```lua
-- 旧写法（9月底下线）
function main()
    local results = {}
    for _, tid in ipairs(srta.get_targets()) do
        results[tid] = {
            [srta.TARGETINFO_ENABLE] = true,
            [srta.TARGETINFO_USER_WEIGHT_FACTOR] = 1.05,
        }
    end
    return results
end

-- 新写法
function main()
    for _, tid in ipairs(srta.get_targets()) do
        srta.set_target(tid, srta.TARGETINFO_USER_WEIGHT_FACTOR, 1.05)
    end
end
```

**场景二：部分策略排除（含"漏填 ENABLE"隐患的修复）**

```lua
-- 旧写法（9月底下线）
-- 注意：else 分支必须写 ENABLE=true，否则该策略会被静默屏蔽
function main()
    local results = {}
    for _, tid in ipairs(srta.get_targets()) do
        if tid == "t1" then
            results[tid] = { [srta.TARGETINFO_ENABLE] = true,
                             [srta.TARGETINFO_USER_WEIGHT_FACTOR] = 1.05 }
        elseif tid == "t2" then
            results[tid] = { [srta.TARGETINFO_ENABLE] = false }
        else
            results[tid] = { [srta.TARGETINFO_ENABLE] = true }  -- 兜底，容易漏写
        end
    end
    return results
end

-- 新写法：无需兜底分支，也无需遍历
function main()
    srta.set_target("t1", srta.TARGETINFO_USER_WEIGHT_FACTOR, 1.05)
    srta.set_target("t2", srta.TARGETINFO_ENABLE, false)
end
```

**场景三：人群定向（必须显式排除，否则语义反转）**

```lua
-- 旧写法（9月底下线）：命中才写，未命中靠"不写"实现屏蔽
function main()
    local results = {}
    for _, tid in ipairs(srta.get_targets()) do
        local is_ta = srta.get_ds_u8(srta.DS_DID, 6) == 1
        if is_ta then
            results[tid] = { [srta.TARGETINFO_ENABLE] = true }
        end
        -- 未命中不写 -> 不参竞
    end
    return results
end

-- 新写法：⚠️ 未命中必须显式排除
function main()
    local is_ta = srta.get_ds_u8(srta.DS_DID, 6) == 1
    if is_ta then
        return -- 命中人群，全部默认参竞
    end
    for _, tid in ipairs(srta.get_targets()) do
        srta.set_target(tid, srta.TARGETINFO_ENABLE, false)
    end
end
```

**场景四：复用返回 info 表的辅助函数**

```lua
local function build_info(tid)
    local info = { [srta.TARGETINFO_ENABLE] = true }
    if tid == "t1" then
        info[srta.TARGETINFO_USER_WEIGHT_FACTOR] = 1.4
    end
    return info
end

-- 旧写法（9月底下线）
function main()
    local results = {}
    for _, tid in ipairs(srta.get_targets()) do
        results[tid] = build_info(tid)
    end
    return results
end

-- 新写法：辅助函数无需改动，用整表形态传入
function main()
    for _, tid in ipairs(srta.get_targets()) do
        srta.set_target(tid, build_info(tid))
    end
end
```

#### 5.2.6.5 与 results 表写法的对比 {#set_target-compare}

| 特性 | return results（待下线） | srta.set_target（推荐） |
| :-- | :-- | :-- |
| 状态 | **2026年9月底下线** | 推荐 |
| 参竞的表达 | 需显式 `ENABLE = true` | 默认参竞，无需表达 |
| 漏填 ENABLE 的后果 | 策略被静默屏蔽 | 无影响（默认参竞） |
| 内存开销 | 一个 results 表 + 每策略一个 info 表 | 无需建表 |
| 字段写入方式 | table 键值写入 | 直接传参 |
| 只处理个别策略时 | 仍需遍历全部策略并逐个填表 | 直接写目标策略，无需遍历 |

**使用场景**：所有需要输出决策结果的脚本，均应使用本函数。

### 5.2.7 srta.get_apps函数 {#get_apps}

一次可以获得多个App安装态，每个返回值为 true(已安装)/false(未安装)/nil(无权限或不可靠)中的一个状态

```lua
app1, app2, app3 = srta.get_apps(app1hash, app2hash, app3hash) -- 获取App安装态，可支持多个。

-- 以下为字段返回值示例
app1 = true
app2 = false
app3 = nil
```

### 5.2.8 srta.get_scores函数 {#get_scores}

一次可以获得多个模型打分，每个返回值为数字/nil(无权限或不可靠)中的一个状态

```lua
score1, score2, score3 = srta.get_scores(model1, model2, model3) -- 获取模型分，可支持多个。

-- 以下为返回值示例
score1 = 0
score2 = 80
score3 = nil
```

例如，获取外部账号2002在wuid空间中shard=1的U8列1/2/3的打分：

```lua
score1, score2, score3 = srta.get_scores(20020201001, 20020201002, 20020201003)

-- 以下为返回值示例
score1 = 0
score2 = 80
score3 = nil
```

### 5.2.9 srta.get_extscore函数 {#get_extscore}

`srta.get_extscore` 是 `srta.get_scores` 的跨账号访问专用版，简化调用代码编写，用于查询其他账号数据空间的模型打分（需授权）。

与 `srta.get_scores` 的区别在于，`get_extscore` 首个参数使用 `accountSubId` 组合值指定目标账号和子空间，而非要求每个参数直接传入完整的模型ID。

```lua
-- 等价于上例 srta.get_scores 的简化写法
score1, score2, score3 = srta.get_extscore(200202, 1, 2, 3) -- 200202=账号2002的WUID区

-- 以下为返回值示例
score1 = 0    -- 等价于 U8列1 (模型ID:20020201001)
score2 = 80   -- 等价于 U8列2 (模型ID:20020201002)
score3 = nil  -- 等价于 U8列3 (模型ID:20020201003), 无权限或不存在时返回 nil
```

**参数说明**：
- 参数1：`accountSubId`，类型为整数，由 `account*100 + subId` 计算得出。例如 `200102` 表示 account=2001, subId=2 (WUID 区)。当传入 `0` 时，会自动转为系统 2001 账号的 WUID 区
- 参数2及之后：一个或多个 U8 列索引（1-based，范围 1~64），shard index 固定为 1

**返回值说明**：
- 每个 U8 列索引对应一个返回值，按参数顺序返回
- 命中时返回数字（0~255 的 U8 值）
- 未命中、无权限或数据不存在时返回 `nil`

**使用场景**：
- 需要查询合作方或其他账号的模型打分数据进行联合决策
- 在不需要完整 DS 数据时，直接获取指定列的打分值，性能更优

### 5.2.10 srta.get_os函数 {#get_os}

获取终端的操作系统。返回值参考[系统常量]

```lua
os = srta.get_os() -- 获取终端操作系统

-- 以下为返回值示例
1 -- 代表iOS，可以用srta常量进行判断
```

### 5.2.11 srta.get_siteset函数 {#get_siteset}

获取媒体站点集ID。返回值参考[系统常量]

```lua
siteset = srta.get_siteset() -- 获取媒体站点集ID

-- 以下为返回值示例
21 -- 21代表微信，可以用srta常量进行判断
```

### 5.2.12 srta.get_expid函数 {#get_expid}

获取实验分桶编号。返回值为 0-10。1-10 每个分桶 UV 比例接近于 10%。由于系统原因，目前线上极少量的流量不会被分到任何实验分组，当分桶号为 0 时，代表流量未分桶。

```lua
expid = srta.get_expid() -- 获取实验分桶号

-- 以下为返回值示例
5 -- 代表5号分桶
```

### 5.2.13 srta.get_geo_nearest函数 {#get_geo_nearest}

获取地理位置最近的数据。传入搜索半径（单位：公里），返回距离（单位：米）和对应的数据表。

该函数用于查询用户常住地理位置附近的数据，例如查找附近门店、附近广告等场景。

```lua
distance, geoData = srta.get_geo_nearest(3) -- 查询3公里范围内最近的数据

-- 以下为返回值示例
distance = 1500 -- 距离为1500米
geoData = {
    [1] = {10, 20, 30, ...}, -- U8 字段区
    [2] = {100, 200, ...},   -- U32 字段区
    [3] = {true, false, ...} -- FLAG 字段区
}
```

**参数说明**：
- 参数1：搜索半径，单位为公里（km），类型为整数

**返回值说明**：
- 返回值1：距离，单位为米（m），类型为整数。如果未找到数据，返回最大uint32值 4294967295（0xFFFFFFFF）
- 返回值2：数据表，结构与 `srta.get_dsdata` 返回的表结构相同。如果未找到数据，返回空表

**使用场景**：
- 基于LBS的广告投放：根据用户常住位置推送附近商家广告
- 地域性活动推广：向特定区域用户推送本地活动信息
- 门店引流：向门店附近用户推送优惠信息

### 5.2.14 srta.get_geo_points函数 {#get_geo_points}

获取半径范围内、按指定 U8 列倒序排列的地理位置数据点，最多返回 10 个。与 `srta.get_geo_nearest` 仅返回最近一个不同，该函数返回排序后的多点列表，适用于多个候选点的比选场景。

```lua
points = srta.get_geo_points(3, 1) -- 查询3公里范围内按U8列1倒序排列的点

-- 以下为返回值示例
points = {
    [1] = {
        [srta.GEO_DISTANCE] = 500,     -- 距离(米)
        [srta.GEO_DATA] = {
            [srta.U8] = {10, 20, 30},
            [srta.U32] = {100, 200},
            [srta.FLAG] = {true, false}
        },
        [srta.GEO_SCORE] = 80          -- 排序所用 U8 列的值
    },
    [2] = {
        [srta.GEO_DISTANCE] = 1200,
        [srta.GEO_DATA] = { ... },
        [srta.GEO_SCORE] = 60
    },
    -- 最多10个点，按 srta.GEO_SCORE 倒序，分相同时按距离近优先
}
```

**参数说明**：
- 参数1：搜索半径，单位为公里（km），类型为整数
- 参数2：排序用的 U8 列索引（1-based），类型为整数

**返回值说明**：
- 返回一个数组表，每个元素是一个包含三个字段的 table：
  - `srta.GEO_DISTANCE`：距离（米），类型为整数
  - `srta.GEO_DATA`：数据空间数据表，结构与 `srta.get_dsdata` 返回的表结构相同，包含 U8/U32/FLAG 三个区
  - `srta.GEO_SCORE`：排序所用 U8 列的值，已预取，无需再从 `GEO_DATA` 中查询
- 排序规则：按 `GEO_SCORE` 倒序，分值相同时按距离近优先
- 未找到数据时返回空表（非 nil）

**与 srta.get_geo_nearest 的区别**：

| 特性 | get_geo_nearest | get_geo_points |
| :-- | :-- | :-- |
| 返回数量 | 1个（最近） | 最多10个 |
| 排序 | 按距离最近 | 按U8列倒序+距离 |
| 无数据时 | 返回哨兵距离+空表 | 返回空数组表 |
| GEO_SCORE 预取 | 不支持 | 支持 |

**使用场景**：
- 多点比选：查询附近多个门店，按门店评分排序后择优投放
- 竞价排名：按出价/权重列排序，对多个候选广告位进行优选出价
- 商圈分析：获取周边所有候选点数据进行综合决策

## 5.3 内置模块string {#mod-string}

string为字符串计算相关功能函数。

### 5.3.1 函数列表 {#string-funclist}

| 函数名 | 功能 |
| :-- | :-- |
| string.split | 切割字符串 |

### 5.3.2 string.split函数 {#string-split}

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

## 5.4 内置模块time {#mod-time}

time为时间计算相关功能函数，系统使用uint32为基础格式，存放Unix Timestamp。

### 5.4.1 函数列表 {#time-funclist}

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

### 5.4.2 time.now函数 {#time-now}

函数获取当前时间戳，返回值为uint32类型。

```lua
now = time.now()
```

### 5.4.3 time.date函数 {#time-date}

函数传入时间戳，一次返回年、月、日三个值。

```lua
now = time.now()
year, month, day = time.date(now)
```

### 5.4.4 time.hour函数 {#time-hour}

函数传入时间戳，返回小时。

```lua
now = time.now()
hour = time.hour(now)
```

### 5.4.5 time.minute函数 {#time-minute}

函数传入时间戳，返回分钟。

```lua
now = time.now()
minute = time.minute(now)
```

### 5.4.6 time.second函数 {#time-second}

函数传入时间戳，返回秒。

```lua
now = time.now()
second = time.second(now)
```

### 5.4.7 time.weekday函数 {#time-weekday}

函数传入时间戳，返回星期几。星期天为 0，星期一为 1，以此类推。

```lua
now = time.now()
weekday = time.weekday(now)
```

### 5.4.8 time.truncate函数 {#time-truncate}

函数传入时间戳，及截断精度，返回截断后的时间戳。

时间精度可以是以下值：month、day、hour、minute。

```lua
now = time.now()
month_start = time.truncate(now, "month") -- 本月开始时间戳
today_start = time.truncate(now, "day") -- 今天开始时间戳
hour_start = time.truncate(now, "hour") -- 本小时开始时间戳
minute_start = time.truncate(now, "minute") -- 本分钟开始时间戳
```

### 5.4.9 time.addtime函数 {#time-addtime}

函数传入时间戳，及增减时间（时分秒），时分秒可为 0 或 负值，返回增减后的时间戳。

```lua
now = time.now()
newstamp = time.addtime(now, -1, 1, 1) -- 前1小时，再增加1分1秒
```

### 5.4.10 time.adddate函数 {#time-adddate}

函数传入时间戳，及增减日期（年月日），年月日可为 0 或 负值，返回增减后的时间戳。

```lua
now = time.now()
newstamp = time.adddate(now, -1, 1, 1) -- 去年，再增加1月1天
```

### 5.4.11 time.setdate函数 {#time-setdate}

函数传入年月日时分秒，返回时间戳。

```lua
newstamp = time.setdate(2025, 6, 18, 12, 13, 14) -- 2025:06:18 12:13:14
```

## 5.5 被调函数 {#callback}

### 5.5.1 一次请求main {#callback-main}

#### 5.5.1.1 调用 {#callback-main-call}

业务逻辑由使用方实现，为便于系统调用，约定使用main函数名。该函数无入口参数，后续所需数据通过调用内置函数获取，决策结果通过 [srta.set_target](#set_target) 写出。

```lua
function main()
    -- 按需读取所需数据
    local v1 = srta.get_ds_u8(srta.DS_DID, 1)

    -- 客户逻辑
    ...

    -- 用 srta.set_target 写出结果，无需 return
end
```

:::info 所有策略默认参竞
`main()` 中未被 `srta.set_target` 排除的策略都会参竞，因此脚本只需表达"**排除谁、给谁调权**"。详见 [默认参竞语义](#set_target-default-enable)。
:::

较为完整的使用示例

```lua
-- 客户自定义变量，便于理解
local IDXU8_NEWS = 1
local IDXU8_MUSIC = 2
local IDXU8_VIDEO = 3

local IDXFLAG_NEWS = 1
local IDXFLAG_MUSIC = 2

function main()
    -- 按需读取 DID 数据的指定列
    local u8_news, u8_music, u8_video = srta.get_ds_u8(srta.DS_DID,
        IDXU8_NEWS, IDXU8_MUSIC, IDXU8_VIDEO)
    local flag_news, flag_music = srta.get_ds_flag(srta.DS_DID,
        IDXFLAG_NEWS, IDXFLAG_MUSIC)

    for _, targetid in ipairs(srta.get_targets()) do -- 遍历待决策策略ID
        if targetid == "news" then -- 新闻拉活策略
            -- 已安装且当天未拉活才出拉活广告，否则不参竞
            if not (u8_news == 1 and not flag_news) then
                srta.set_target(targetid, srta.TARGETINFO_ENABLE, false)
            end

        elseif targetid == "music" then -- 音乐拉活策略
            -- 已安装且当天未拉活才出拉活广告，否则不参竞
            if not (u8_music == 1 and not flag_music) then
                srta.set_target(targetid, srta.TARGETINFO_ENABLE, false)
            end

        elseif targetid == "video_for_new" then -- 视频拉新策略
            -- 仅未安装用户出拉新广告
            if u8_video ~= 0 then
                srta.set_target(targetid, srta.TARGETINFO_ENABLE, false)
            end
        end
    end
end
```

:::caution 与旧示例的差异
上例中"不满足条件"的分支**显式写了 `ENABLE = false`**。旧写法是"满足条件才写 `ENABLE = true`、不满足就不写"，在默认参竞语义下这样会导致不满足条件的用户被放行投放。改造时务必逐条补上排除分支。
:::

#### 5.5.1.2 返回 {#callback-main-return}

:::danger 待下线
`main()` 通过 `return results` 返回结果表的写法**将于 2026 年 9 月底停止支持**，请改用 [srta.set_target](#set_target) 写出结果。

本节仅为便于存量脚本对照保留。过渡期内两种写法可混用，语义一致。
:::

使用 results 表时，`main()` 返回一个 table，键为策略ID，值可引用srta常量以设置以下成员编号

| 成员 | 类型 | 功能 | srta.set_target 中的等价写法 |
| :-- | :-- | :-- | :-- |
| srta.TARGETINFO_ENABLE | bool | 策略是否参竞 | 参竞为默认值无需写；不参竞写 `set_target(tid, srta.TARGETINFO_ENABLE, false)` |
| srta.TARGETINFO_CPC_PRICE | int | 策略CPC出价 | `set_target(tid, srta.TARGETINFO_CPC_PRICE, 100)` |
| srta.TARGETINFO_CPA_PRICE | int | 策略CPA出价 | `set_target(tid, srta.TARGETINFO_CPA_PRICE, 2500)` |
| srta.TARGETINFO_USER_WEIGHT_FACTOR | float | 策略用户权重系数 | `set_target(tid, srta.TARGETINFO_USER_WEIGHT_FACTOR, 1.2)` |
| srta.TARGETINFO_CPC_FACTOR | float | 策略CPC出价系数 | `set_target(tid, srta.TARGETINFO_CPC_FACTOR, 1.2)` |
| srta.TARGETINFO_DC_INFOS | table数组 | DCA标签信息（可选）| `set_target(tid, srta.TARGETINFO_DC_INFOS, {...})` |

**DCA标签信息格式**

`srta.TARGETINFO_DC_INFOS` 为一个数组，其中每个元素为包含 DCA 标签的 table 结构。两种写法的标签结构完全相同：

```lua
-- 推荐写法
srta.set_target(targetid,
    srta.TARGETINFO_CPC_PRICE, 100,
    srta.TARGETINFO_DC_INFOS, {
        {
            [srta.DC_TAG_NAME] = "tag_name_1",    -- DCA标签名称
            [srta.DC_TAG_VALUE] = "tag_value_1"   -- DCA标签值
        },
        {
            [srta.DC_TAG_NAME] = "tag_name_2",
            [srta.DC_TAG_VALUE] = "tag_value_2"
        }
    })

-- 旧写法（9月底下线）
results[targetid] = {
    [srta.TARGETINFO_ENABLE] = true,
    [srta.TARGETINFO_CPC_PRICE] = 100,
    [srta.TARGETINFO_DC_INFOS] = {
        {
            [srta.DC_TAG_NAME] = "tag_name_1",
            [srta.DC_TAG_VALUE] = "tag_value_1"
        },
        {
            [srta.DC_TAG_NAME] = "tag_name_2",
            [srta.DC_TAG_VALUE] = "tag_value_2"
        }
    }
}
```


### 5.5.2 二次请求second {#callback-second}

#### 5.5.2.1 调用 {#callback-second-call}

待更新

#### 5.5.2.2 返回 {#callback-second-return}

待更新

## 5.6 代码调试 {#debug}

sRTA 创建了完全独立的 LUA 运行时，有自己的生态库及机密数据依赖，所以`无法在IDE内调试`。需要通过 [API接口](./api.md#scriptdebug) 提交代码`在服务端沙箱运行并返回结果`。

根据数据源的不同，在沙箱运行有不同的限制。

| 引用数据源 | 真实数据 | 沙箱数据 | 说明 |
| :--: | :--: | :--: | :-- |
| 一方 | 可 | 可 | 可通过 API 参数传递 did/openid 信息，沙箱在运行 srta.get_ds_u8 等函数（或 srta.get_dsdata）时自动读取存储于服务端的用户数据。<br/>也可用hijack模拟 |
| 二方 | 否 | 可 | 通过hijack模拟返回 |
| 三方 | 否 | 可 | 通过hijack模拟返回 |

### 5.6.1 沙箱函数hijack {#hijack}

#### 5.6.1.1 入口 {#hijack-entry}

约定使用hijack函数名并由使用方实现，在该函数内可以劫持部分系统模块功能调用，以桩数据内容返回。该函数无入口参数。

```lua
function hijack()
    local sandbox = {}
    -- 数据模拟

    return sandbox
end
```


#### 5.6.1.2 返回 {#hijack-return}

hijack函数返回一个沙箱结果集合。

较为完整的使用示例
```lua
function hijack()
    print("hijack run")
    local sandbox = {
        srta_get_dsdata = {
            [srta.DS_DID] = {[srta.U8] = {[1] = 100},
                [srta.U32] = {[2] = 99},
                [srta.FLAG] = {[1] = true}
            }
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
        srta_get_extscore = {
            [200102] = {10, 50, 80}  -- accountSubId=200102 的 U8列1/2/3 打分
        },
        srta_get_os = srta.OS_IOS,
        srta_get_expid = 1,
        srta_get_siteset = srta.SITESET_WECHAT,
        srta_get_geo_nearest = {
            [1] = 1500, -- 距离(米)
            [2] = {
                [srta.U8] = {[1] = 10, [2] = 20},
                [srta.U32] = {[1] = 100},
                [srta.FLAG] = {[1] = true}
            }
        },
        srta_get_geo_points = {
            [1] = {
                [srta.GEO_DISTANCE] = 500,
                [srta.GEO_DATA] = {
                    [srta.U8] = {[1] = 10, [2] = 20},
                    [srta.U32] = {[1] = 100},
                    [srta.FLAG] = {[1] = true}
                },
                [srta.GEO_SCORE] = 80
            },
            [2] = {
                [srta.GEO_DISTANCE] = 1200,
                [srta.GEO_DATA] = {
                    [srta.U8] = {[1] = 8, [2] = 15},
                    [srta.U32] = {[1] = 200},
                    [srta.FLAG] = {[1] = false}
                },
                [srta.GEO_SCORE] = 60
            }
        },
        time_now = 1755414905,
        geo_ip = 110000,       -- IP城市行政区划码（如110000代表北京市），用于srta.get_dsdata(srta.DS_GEOIP)
        geo_fac = 610100,      -- 常住城市行政区划码（如610100代表西安市），用于srta.get_dsdata(srta.DS_GEOFAC)
        geo_lnglat = {116.397128, 39.907507}  -- 经纬度{lng, lat}，用于srta.get_geo_nearest()
    }

    return sandbox
end
```

**DCA标签信息沙箱模拟**

DCA 标签由脚本自行写出，不需要 hijack 桩数据。在沙箱中调试时，只要模拟好判定所需的数据源，DCA 标签会随决策结果一起返回：

```lua
function hijack()
    local sandbox = {
        srta_get_targets = {"t1", "t2"},
        -- 其他模拟数据...
    }
    return sandbox
end

function main()
    for _, targetid in ipairs(srta.get_targets()) do
        srta.set_target(targetid,
            srta.TARGETINFO_CPC_PRICE, 100,
            srta.TARGETINFO_DC_INFOS, {
                {
                    [srta.DC_TAG_NAME] = "category",
                    [srta.DC_TAG_VALUE] = "electronics"
                },
                {
                    [srta.DC_TAG_NAME] = "brand",
                    [srta.DC_TAG_VALUE] = "tech_brand"
                }
            })
    end
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
| srta_get_dsdata | 未指定则获取对应用户的真实一方数据。只有部分字段指定时，由指定字段覆盖原DS对应值。<br/>该桩数据同时对 srta.get_ds_u8/get_ds_u32/get_ds_flag 生效（见下方说明） |
| srta_get_targets | 使用srta.get_targets获取真实的策略列表 |
| srta_get_apps | 返回nil |
| srta_get_scores | 返回nil |
| srta_get_extscore | 返回nil |
| srta_get_os | 使用ScriptRun接口调用的 os 字段，如调用接口未指定则为 srta.OS_ANDROID |
| srta_get_expid | 0 |
| srta_get_siteset | 0 |
| srta_get_geo_nearest | 返回距离为4294967295（0xFFFFFFFF）和空表 |
| srta_get_geo_points | 返回空数组表 |
| time_now | 使用time.now获取真实的系统时间 |
| geo_ip | 使用请求中的IP地址解析行政区划码。如未指定则为0，读取 srta.DS_GEOIP 将无数据 |
| geo_fac | 使用请求中的常住城市行政区划码。如未指定则为0，读取 srta.DS_GEOFAC 将无数据 |
| geo_lnglat | 使用请求中的用户常住经纬度。如未指定则 srta.get_geo_nearest() 查无结果 |

#### 5.6.1.3 srta.get_ds_u8等函数的沙箱模拟 {#hijack-get_ds_field}

`srta.get_ds_u8` / `srta.get_ds_u32` / `srta.get_ds_flag` **没有独立的 hijack 成员名**，它们与 `srta.get_dsdata` 读取同一份底层数据，因此直接复用已有的桩数据即可模拟：

| 数据空间 | 使用的 hijack 成员 |
| :-- | :-- |
| srta.DS_DID、srta.DS_WUID | `srta_get_dsdata` |
| srta.DS_GEO | `geo_lnglat` |
| srta.DS_GEOIP | `geo_ip` |
| srta.DS_GEOFAC | `geo_fac` |

例如下面的桩数据，对 `get_dsdata` 与 `get_ds_u8` 两种读法同时生效：

```lua
function hijack()
    local sandbox = {
        srta_get_dsdata = {
            [srta.DS_DID] = {
                [srta.U8] = {[1] = 100},
                [srta.U32] = {[2] = 99},
                [srta.FLAG] = {[1] = true}
            }
        }
    }
    return sandbox
end

function main()
    -- 以下两种读法取到的是同一份桩数据
    local v1 = srta.get_ds_u8(srta.DS_DID, 1)      -- 100
    local n2 = srta.get_ds_u32(srta.DS_DID, 2)     -- 99
    local f1 = srta.get_ds_flag(srta.DS_DID, 1)    -- true

    local didData = srta.get_dsdata(srta.DS_DID)
    local v1_old = didData[srta.U8][1]             -- 100
end
```

未指定桩数据时，行为与 `srta_get_dsdata` 一致：读取对应用户的真实一方数据；若该数据不存在，则按各函数的约定返回 `0` 或 `false`。
