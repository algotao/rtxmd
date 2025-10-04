---
sidebar_position: 4
description: 精准评估RTA策略效果，科学实验助您优化广告投放！本文详细介绍RTA实验能力，包括如何通过UV分桶进行流量AB对比实验，以及平台分桶与客户分桶两种分桶方式的创建、实时交互和监测宏设置。掌握这些方法，您将能够有效衡量RTA策略对广告效果的影响，实现广告效果的精准优化。
keywords: [RTA实验, 广告效果评估, UV分桶, 流量AB对比, 平台分桶, 客户分桶, 实验分桶ID, 监测宏, 广告投放优化]
---

# 实验对比

## 实验简介

RTA实验能力是客户通过科学的方式衡量RTA策略调节对广告效果的影响的有效手段。通过将请求以UV分成若干份，执行不同的RTA策略响应，可实现**同账号/同计划/同广告在相同时间窗**的流量AB对比实验。最后通过实验分桶ID维度的`展点消`及`后链路转化`数据，得出实验结论。

**应用场景包括但不限于**：
+ 是否启用RTA的效果对比
+ 人群策略效果对比
+ 用户调权调价效果对比

### 分桶方式
+ **平台分桶**：平台将RTA请求按UV分成若干份，实时交互时在每个`请求`带上实验分桶ID。
+ **客户分桶**：客户将RTA请求按UV分成若干份，实时交互时在每个`回复`带上实验分桶ID。

## 平台分桶

### 分桶创建
分桶的创建由平台负责，创建完毕后向客户提供分桶ID。推荐一次性将流量分为10个组，每组10%流量，减少重复沟通。分桶时效性`默认为三个月`，最大为`六个月`。

:::tip

由于系统原因，目前线上极少量的流量不会被分到任何实验分组，即RTA请求中少量流量不带实验ID，因此在实验策略设计时，需考虑当RTA请求不带实验ID时如何回复。

:::


### 实时交互

RTA发出请求时，通过exps参数下发实验分桶ID。例如平台创建了10个分桶，每组10%，分桶ID为32761-32770，收到的情求类似下面的形式。

```protobuf
id:  "Jo825w_uEe2xLlJUAFwvSQ"
device: <
  os:  OS_ANDROID
  imei_md5sum:  "e669d85a800adf5107ec10c3094d6b1d"
  oaid_md5sum:  "ad804af4ad8021c923b15af7c6edd9cc"
  cached_deviceid_type:  OAID_MD5
>
// highlight-start
exps: <
  exp_id: 32768
>
// highlight-end
```

平台实验允许存在多层，请注意相关处理

### 监测宏
客户在投放端的点击监测链后面增加 `rta_exp_ids=__RTA_EXP_ID__` ，系统在每次转发时将替换成平台分桶ID。

## 客户分桶

### 分桶创建
分桶的逻辑由客户负责（例如设备号取模），在`回复`时填写对应的分桶ID，并通过`展点消`及`后链路转化`宏替换，得出实验结论。客户分桶能力需要平台侧开启，如需使用该能力请向产研侧提出诉求。

### 实时交互

```protobuf title="客户自定义分桶（请求级数字型）"
// 交互样例
request_id:  "Jo825w_uEe2xLlJUAFwvSQ"
code:  0
out_target_id:  "sample"
dsp_tag: 1
```

```protobuf title="客户自定义分桶（请求级字符型）"
// 交互样例
request_id:  "Jo825w_uEe2xLlJUAFwvSQ"
code:  0
out_target_id:  "sample"
dsp_tag_str: "bucket1"
```

```protobuf title="客户自定义分桶（策略级数字型）"
// 交互样例
request_id:  "Jo825w_uEe2xLlJUAFwvSQ"
code:  0
out_target_id:  "sample"
target_infos: <
  out_target_id: "sample"
  dsp_tag: 1
>
```

```protobuf title="客户自定义分桶（策略级字符型）"
// 交互样例
request_id:  "Jo825w_uEe2xLlJUAFwvSQ"
code:  0
out_target_id:  "sample"
target_infos: <
  out_target_id: "sample"
  dsp_tag_str: "bucket1"
>
```

:::tip

当请求级与策略级都填写了分桶ID时，策略级分桶ID的优先级大于请求级。

:::

### 监测宏
客户在投放端的点击监测链后面增加 `rta_dsp_tag=__RTA_DSP_TAG__` 及 `rta_dsp_tag_str=__RTA_DSP_TAG_STR__` ，系统在每次转发时将替换成对应类型的客户分桶ID。