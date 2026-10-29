---
title: 二次请求 second
unlisted: true
toc_min_heading_level: 2
toc_max_heading_level: 4
description: sRTA 二次请求（P3）的 LUA 写法：second 函数的调用与返回约定，广告级读取函数 srta.get_ads 与广告级判定、改价函数 srta.set_ad（CPA / CPC 出价），广告对象字段，以及与策略级 srta.set_target 的优先级关系。
keywords: [二次请求, second, P3, get_ads, set_ad, ADRESULT_ENABLE, ADRESULT_CPA_PRICE, ADRESULT_CPC_PRICE, 广告级改价, 广告级决策, 广告对象, set_target, 优先级]
---

# 二次请求 second {#second}

二次请求（P3）在一次请求之后、候选广告已确定时发起。脚本用 `second()` 承接该请求，通过 `srta.get_ads()` 读取每条候选广告，用 `srta.set_ad()` 逐条决定去留、按广告改价，粒度比一次请求的策略级判定更细。

本文只介绍 LUA 侧的写法与语义。

## 与一次请求的关系 {#second-relation}

| 请求 | 入口函数 | 决策粒度 | 写出结果 |
| :-- | :-- | :-- | :-- |
| 一次请求（P2） | `main()` | 策略 | [srta.set_target](./lua.md#set_target) |
| 二次请求（P3） | `second()` | 广告 | [srta.set_ad](#set_ad)，也可继续用 `srta.set_target` |

- `second()` 无入口参数，**不需要 return**，决策结果全部由 `srta.set_ad` / `srta.set_target` 写出。`second()` 的返回值会被忽略。
- 只定义了 `main()` 的脚本，且在后台设置了“二次请求沿用 `main()` 的结果”，无需改造即可继续工作。
- 同一份脚本中 `main()` 与 `second()` 可以共存，各走各的入口。

```lua
function second()
    -- 二次请求：逐个广告做判定
end
```

:::info 每个账号各执行一次
二次请求按账号分批执行，`second()` 在每个账号下各调用一次，因此 `srta.get_ads()` 返回的是**本账号**本次的候选广告。不要在脚本里假设能看到全部账号的广告。
:::

## srta.get_ads函数 {#get_ads}

**仅供二次请求使用**，在 `second()` 中读取本次请求的候选广告，按请求中的顺序返回，下标从 1 开始。

```lua
ads = srta.get_ads()          -- 读取候选广告
```

### 返回结构 {#get_ads-return}

返回一个 LUA Table 数组，每个元素是一条广告的 Table：

```lua
ads = {
    {
        adgroup_id         = 1001,
        advertiser_id      = 88,
        target             = "reactivate",
        rta_id             = 10000,
        user_weight_factor = 1.2,
        cpa_price          = 200,
        cpc_factor         = 0,
        cpc_price          = 0,
        dsp_tag            = 7,
        original_cpa_price = 180,
    },
    -- ...
}
```

| 字段 | 类型 | 含义 |
| :-- | :-- | :-- |
| `adgroup_id` | number | 广告 ID，传给 `srta.set_ad` 用 |
| `advertiser_id` | number | 广告主 ID |
| `target` | string | 该广告所属策略 ID，与 [srta.get_targets](./lua.md#get_targets) 的取值一致 |
| `rta_id` | number | RTA ID |
| `user_weight_factor` | number | 用户加权系数 |
| `cpa_price` | number | CPA 出价，单位：分 |
| `cpc_factor` | number | CPC 系数 |
| `cpc_price` | number | CPC 出价，单位：分 |
| `dsp_tag` | number | DSP 标签 |
| `original_cpa_price` | number | 原始 CPA 出价，单位：分 |

出价类字段**没有值时返回 0**（0 即未出价），不会返回 nil。

:::info 仅在 second() 中使用
一次请求（`main()`）没有候选广告，在那里调用 `srta.get_ads()` 固定返回空表 `{}`。广告级读取只写在 `second()` 中。
:::

## srta.set_ad函数 {#set_ad}

**仅供二次请求使用**，在 `second()` 中写入单条广告的判定结果与出价。

```lua
srta.set_ad(adgroup_id, srta.ADRESULT_ENABLE, false)       -- 该广告不参竞
srta.set_ad(adgroup_id, srta.ADRESULT_ENABLE, true)        -- 该广告参竞（覆盖策略级结论）
srta.set_ad(adgroup_id, srta.ADRESULT_CPA_PRICE, 150)      -- 广告级 CPA 出价：150 分
srta.set_ad(adgroup_id, srta.ADRESULT_CPC_PRICE, 80)       -- 广告级 CPC 出价：80 分
-- 一次调用可写多对字段
srta.set_ad(adgroup_id, srta.ADRESULT_CPA_PRICE, 150, srta.ADRESULT_CPC_PRICE, 80)
```

### 参数 {#set_ad-params}

| 参数 | 类型 | 说明 |
| :-- | :-- | :-- |
| `adgroup_id` | number | 广告 ID，取自 `srta.get_ads()` 的元素 |
| 字段编号 | number | 见下方的字段表 |
| 值 | bool / number | `ADRESULT_ENABLE` 传 bool，其余字段传数字 |

支持的字段：

| 字段编号 | 值 | 说明 |
| :-- | :-- | :-- |
| `srta.ADRESULT_ENABLE` | bool | `false` 不参竞；`true` 参竞 |
| `srta.ADRESULT_CPA_PRICE` | number | 广告级 CPA 出价，单位：分 |
| `srta.ADRESULT_CPC_PRICE` | number | 广告级 CPC 出价，单位：分 |

**只支持绝对出价**：广告级写价只有 CPA 出价与 CPC 出价两项，不支持 CPC 系数，也不支持用户加权系数。`srta.get_ads()` 里的 `cpc_factor` / `user_weight_factor` 只供脚本判断，不能用 `srta.set_ad` 写回。

出价取值超出范围时静默忽略：需大于 0 且小于 1 亿分（100 万元）。价格按整数分处理，小数部分会被截掉，需要取整时脚本自行处理：

```lua
-- CPC 出价打 8 折，向下取整到分
srta.set_ad(ad.adgroup_id, srta.ADRESULT_CPC_PRICE, math.floor(ad.cpc_price * 0.8))
```

### 语义要点 {#set_ad-semantics}

- **不调用即沿用策略级结论**：`set_ad` 只表达「这条广告要改」，没调用过的广告按策略级结果处理，出价保持原有值。
- **广告级优先于策略级**：`true` 可以救回被策略级排除的广告；`false` 可以拦掉策略级放行的广告。
- **改价隐含参竞**：只写 `ADRESULT_CPA_PRICE` / `ADRESULT_CPC_PRICE` 也会让该广告参竞，无需再写 `ADRESULT_ENABLE=true`。
- **拒绝具备粘性**：同一条广告先写 `false` 再写 `true`（或再改价）不会复活，以先写的 `false` 为准；先写改价再写 `false` 则拒绝生效、改价作废。
- **改价按字段覆盖**：同一条广告重复设置同一字段以最后一次为准；CPA 与 CPC 可以同时设置，分别下发。
- **只作用于本次请求中的广告**：传入不存在的 `adgroup_id` 不会报错，也不产生任何效果。
- **只在二次请求中有效**：`main()` 里调用 `set_ad` 不会报错，也不会产生任何效果。
- 参数类型不对（如漏传值、字段编号不认识）时静默忽略，不中断脚本。

## 与 srta.set_target 的优先级 {#set_ad-priority}

| 广告级判定 | 策略级结论 | 最终结果 |
| :-- | :--: | :--: |
| 未调用 `set_ad` | 参竞 | 参竞，沿用原有出价 |
| 未调用 `set_ad` | 不参竞 | 不参竞 |
| `set_ad(..., true)` | 参竞 | 参竞，沿用原有出价 |
| `set_ad(..., true)` | 不参竞 | **参竞**（广告级覆盖），沿用原有出价 |
| `set_ad(..., 出价字段)` | 参竞 | 参竞，**按广告级出价** |
| `set_ad(..., 出价字段)` | 不参竞 | **参竞**（广告级覆盖），按广告级出价 |
| `set_ad(..., false)` | 参竞 | **不参竞**（广告级覆盖） |
| `set_ad(..., false)` | 不参竞 | 不参竞 |

策略级仍然遵守[默认参竞](./lua.md#set_target-default-enable)语义：`second()` 中未用 `srta.set_target` 排除的策略，其广告默认参竞。

## 示例 {#second-example}

### 按出价过滤广告 {#second-example-price}

只保留 CPA 出价不低于 100 分的广告（未出价时 `cpa_price` 为 0，同样被拦掉）：

```lua
function second()
    for _, ad in ipairs(srta.get_ads()) do
        if ad.cpa_price < 100 then
            srta.set_ad(ad.adgroup_id, srta.ADRESULT_ENABLE, false)
        end
    end
end
```

### 按广告改价 {#second-example-price-set}

付费用户统一提高 CPA 出价，其他用户的 CPC 广告打 8 折：

```lua
local IDXFLAG_PAY = 2

function second()
    local pay = srta.get_ds_flag(srta.DS_DID, IDXFLAG_PAY)

    for _, ad in ipairs(srta.get_ads()) do
        if pay == 1 then
            -- 写 CPA 出价即表示参竞，无需再写 ADRESULT_ENABLE
            srta.set_ad(ad.adgroup_id, srta.ADRESULT_CPA_PRICE, 200)
        elseif ad.cpc_price > 0 then
            -- 广告级只能写绝对出价，折扣由脚本自己算：cpc_price × 0.8，向下取整到分
            srta.set_ad(ad.adgroup_id, srta.ADRESULT_CPC_PRICE, math.floor(ad.cpc_price * 0.8))
        end
    end
end
```

### 策略级与广告级组合 {#second-example-mix}

一次请求按用户分群决定策略，二次请求再对个别广告做特殊放行：

```lua
local IDXU8_ACTIVE = 1
local IDXFLAG_PAY = 2

function main()
    local active = srta.get_ds_u8(srta.DS_DID, IDXU8_ACTIVE)

    for _, targetid in ipairs(srta.get_targets()) do
        -- 非活跃用户不出拉活类策略
        if targetid == "reactivate" and active ~= 1 then
            srta.set_target(targetid, srta.TARGETINFO_ENABLE, false)
        end
    end
end

function second()
    -- 策略级：付费用户不投拉活策略
    local pay = srta.get_ds_flag(srta.DS_DID, IDXFLAG_PAY)
    if pay == 1 then
        srta.set_target("reactivate", srta.TARGETINFO_ENABLE, false)
    end

    -- 广告级：高价值广告不受上面的策略级排除影响
    for _, ad in ipairs(srta.get_ads()) do
        if ad.target == "reactivate" and ad.dsp_tag == 7 then
            srta.set_ad(ad.adgroup_id, srta.ADRESULT_ENABLE, true)
        end
    end
end
```

## 注意事项 {#second-note}

- `second()` 不需要 return，返回值不会被使用。
- `adgroup_id` 为 64 位整数，LUA 的 number 只能精确表示到 2^53。广告 ID 超过该范围时**不要做加减运算**，直接原样传给 `srta.set_ad`，或转成字符串比较。
- 广告条数以本次请求实际下发的为准，脚本不要按固定条数编写逻辑。
- 循环内避免重复调用 `srta.get_ads()`，取一次存到局部变量即可：

  ```lua
  local ads = srta.get_ads()
  for i = 1, #ads do
      local ad = ads[i]
      -- 判定逻辑
  end
  ```

- 广告级判定与出价只影响本次请求，脚本无需也不应保存跨请求的状态。
- 出价单位为分，直接用 `srta.get_ads()` 里的值做比较或计算即可，不要再做单位换算。
- 广告级只支持绝对出价，没有 CPC 系数与加权系数；按比例调价请在脚本里算好最终价格再写入。
- 改价超出取值范围（CPA / CPC 出价达到 1 亿分）会被忽略，脚本不报错；小数价格会被截断成整数分。
