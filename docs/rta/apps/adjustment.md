---
sidebar_position: 3
description: 调权调价是RTA的进阶能力。从目标用户单一圈选，向用户精细化分层演进。基于用户的价值贡献进行人群精细化分层，广告环节针对不同用户差异化出价，综合提升广告ROI。
keywords: [RTA, 调价, 调权, 出价, 价格权重, CPC出价, CPA出价]
---

# 调权调价

## 调权调价简述

调权调价是RTA的进阶能力。从目标用户单一圈选，向用户精细化分层演进。基于用户的价值贡献进行人群精细化分层，广告环节针对不同用户差异化出价，综合提升广告ROI。

**调价调权有三种主要模式**
+ 调整用户权重
+ 调整tCPA出价
+ 调整CPC出价

**三种模式对广告竞争力`eCPM`的作用如下所示：**

|  模式 | 标准公式 | 调整公式 | 影响广告类型 |
|  ----  | ----  | ---- | ---- |
|  用户调权  | eCPM = tCPA \* pCVR \* pCTR  | eCPM = tCPA \* pCVR \* pCTR \* `RTA调权系数` | oCPM/oCPC |
|  tCPA调价  | eCPM = tCPA \* pCVR \* pCTR  | eCPM = `RTAtCPA` \* pCVR \* pCTR | oCPM/oCPC |
|  CPC调价  | eCPM = CPC \* pCTR  | eCPM = `RTACPC` \* pCTR | CPC |

## 调权

广告主基于一方数据对用户转化概率进行分层，通过RTA请求识别用户，判断其转化概率并返回不同的`RTA调权系数`，实时作用于eCPM竞争排序。对高转化用户进行上调，对低转化用户进行下调，提升高转化用户占比，综合提升后端指标。

### 调权限制
+ **广告类型**：只作用于oCPM/oCPC广告
+ **上下限**：默认`5.0-0.2`，超上下限将被忽略（等同于1.0）。
+ **调整精度**：系数为单精度浮点数。建议使用不超过2位小数，太靠后的位数对权重影响过小，干预意义不大。
+ **赔付期**：默认设置为赔付期调权不生效，赔付期为广告首次曝光及之后3天。也可通知RTA侧配置为赔付期内生效调权（不赔付）。
+ **成本达成**：默认设置为投放端目标出价的成本达成。也可选择不保成本。

### 调权样例

```protobuf title="向上调权"
// 交互样例
request_id:  "Jo825w_uEe2xLlJUAFwvSQ"
code:  0
out_target_id:  "sample"
// highlight-start
target_infos: <
  out_target_id: "sample"
  user_weight_factor: 2.0 // 提升2倍竞争力
>
// highlight-end
```

```protobuf title="向下调权"
// 交互样例
request_id:  "Jo825w_uEe2xLlJUAFwvSQ"
code:  0
out_target_id:  "sample"
// highlight-start
target_infos: <
  out_target_id: "sample"
  user_weight_factor: 0.5 // 降低一半竞争力
>
// highlight-end
```

```protobuf title="不调权"
// 交互样例
request_id:  "Jo825w_uEe2xLlJUAFwvSQ"
code:  0
out_target_id:  "sample"
```

```protobuf title="多策略分别调权"
// 交互样例
request_id:  "Jo825w_uEe2xLlJUAFwvSQ"
code:  0
out_target_id:  "sample1"
out_target_id:  "sample2"
// highlight-start
target_infos: <
  out_target_id: "sample1"
  user_weight_factor: 0.5 // 将sample1降低一半竞争力
>
target_infos: <
  out_target_id: "sample2"
  user_weight_factor: 2.0 // 将sample2提升一倍竞争力
>
// highlight-end
```

:::tip

与投放目标匹配的`相对准确`的用户价值分层是提升效果的基础。常规经验是调权系数 `平均值` 越接近1，平台成本达成效果越好。

:::

:::caution

普遍回复高于1的调权系数并**不能**达到提升 `抢量能力` 又 `保成本` 的目的。平台的eCPM计算公式中还有其他影响因子，不当的调权会损害广告`拿量`及`成本`。

:::

## 调tCPA出价

广告主基于一方数据对用户预期转化价值进行分层，通过RTA请求识别用户，判断其转化价值并返回不同的`RTA tCPA出价`，该出价将`替换投放端tCPA出价`，实时作用于eCPM竞争排序。对高价值用户上调出价，对低价值用户下调出价，综合提升后端ROI指标。

### 调价限制
+ **广告类型**：只作用于oCPM/oCPC广告
+ **上下限**：当前无上下限要求。
+ **调整精度**：分/次。
+ **赔付期**：默认设置为赔付期调价不生效，赔付期为新广告投放3天内。也可选择取消赔付期，直接使调价生效。或选择N个转化后结束赔付期，调价生效。
+ **成本达成**：默认设置为`合并保成本`（按实时回复的出价与未干预部分的投放端出价的加权平均进行保成本），也可选择`不保成本`。

### 调价样例

```protobuf title="tCPA调价"
// 交互样例
request_id:  "Jo825w_uEe2xLlJUAFwvSQ"
code:  0
out_target_id:  "sample1"
out_target_id:  "sample2"
// highlight-start
target_infos: <
  out_target_id: "sample1"
  cpa_price: 10000 // 将sample1的tCPA出价修改为100元
>
target_infos: <
  out_target_id: "sample2"
  cpa_price: 15000 // 将sample2的tCPA出价修改为150元
>
// highlight-end
```

:::caution

RTA的CPA调价能力仅适用于单目标出价，不建议双目标出价使用。

:::

## 调CPC出价

广告主基于一方数据对用户计算预期转化价值及转化概率，通过RTA请求识别用户，调整`RTA CPC出价`，该出价将`替换投放端CPC出价`，实时作用于eCPM竞争排序。对高价值用户上调出价，对低价值用户下调出价，综合提升后端ROI指标。

CPC调价有 `直接出价` 和 `系数出价` 两种模式。与tCPA调权系数不同的是，CPC系数可直接改变CPC广告的投放端出价与结算价格。所以在这里仍将CPC系数出价视为CPC调价。

### 调价限制
+ **广告类型**：只作用于CPC广告
+ **上下限**：下限为0.1元，且不能低于广告位底价。低于限制将忽略调价。
+ **调整精度**：分/次。
+ **优先级**：若同时回复CPC直接出价和CPC系数出价，将只生效CPC直接出价。

### 调价样例

```protobuf title="CPC直接出价"
// 交互样例
request_id:  "Jo825w_uEe2xLlJUAFwvSQ"
code:  0
out_target_id:  "sample"
// highlight-start
target_infos: <
  out_target_id: "sample"
  cpc_price: 30 // CPC出价 = 0.3元
>
// highlight-end
```

```protobuf title="CPC系数出价"
// 交互样例
request_id:  "Jo825w_uEe2xLlJUAFwvSQ"
code:  0
out_target_id:  "sample"
// highlight-start
target_infos: <
  out_target_id: "sample"
  cpc_factor: 1.1 // CPC出价 = 投放端出价 * 1.1
>
// highlight-end
```

```protobuf title="CPC调价同时回复，将只生效直接出价cpc_price"
// 交互样例
request_id:  "Jo825w_uEe2xLlJUAFwvSQ"
code:  0
out_target_id:  "sample"
// highlight-start
target_infos: <
  out_target_id: "sample"
  cpc_price: 30 // CPC出价 = 0.3元，在此示例中生效
  cpc_factor: 1.1 // CPC出价 = 投放端出价 * 1.1，在此示例中不生效
>
// highlight-end
```