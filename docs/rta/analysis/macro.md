---
sidebar_position: 2
description: 掌握RTA监测宏，精准追踪广告效果！本文介绍了用于曝光与点击回传的关键监测宏，强调RTA_TRACE_ID作为必填参数的重要性，并详细解析了各宏参数的含义与用途，助力广告主高效利用数据进行策略优化。
keywords: [RTA监测宏, 曝光回传, 点击回传, RTA_TRACE_ID, 实验分桶ID, RTA CPC出价, RTA CPA出价, 用户竞争力等级, 策略ID, 功能状态码, RTA_DSP_TAG]
---

# 监测宏

以下监测宏可用于[曝光](https://developers.e.qq.com/docs/guide/conversion/new_version/baoguangjiance)与[点击](https://developers.e.qq.com/docs/guide/conversion/new_version/dianjijiance)回传。**强烈建议**将__RTA_TRACE_ID__作为必填宏参数。其余宏根据需要使用。

例如：https://www.example.com/click/?adgroup_id=__ADGROUP_ID__&rta_trace_id=__RTA_TRACE_ID__

## 可用宏参数
|  参数名 | 说明 |
|  ----  | ----  |
| \_\_RTA_TRACE_ID\_\_ | RTA请求唯一标识。对应实时协议中的`RtaRequest.id`，该字段用于RTA请求与点击回传等记录进行关联。|
| \_\_RTA_EXP_ID\_\_ | 实验分桶ID。对应于实时协议中的`RtaRequest.exps.exp_id`，该字段用于获取UV的实验分桶。|
| \_\_RTA_CPC_BID\_\_ | RTA CPC出价。对应实时协议中的`RtaResponse.target_infos.cpc_price` |
| \_\_RTA_CPA_PRICE\_\_ | RTA CPA出价。对应实时协议中的`RtaResponse.target_infos.cpa_price` |
| \_\_RTA_USER_WEIGHT\_\_ | 用户竞争力等级。对应实时协议中的`RtaResponse.target_infos.user_weight`，不推荐使用。 |
| \_\_RTA_USER_WEIGHT_FACTOR\_\_ | 用户竞争力加权系数。对应实时协议中的`RtaResponse.target_infos.user_weight_factor`。 |
| \_\_RTA_OUT_TARGET_ID\_\_ | 策略ID。对应实时协议中的`RtaResponse.target_infos.out_target_id`，为该广告播出命中的具体策略号。 |
| \_\_RTA_VALID_FEATURES\_\_ | 功能状态码。 <br/>1 加权等级生效<br/>2 CPC出价生效<br/>4 CPA出价生效<br/>8 加权系数生效<br/>16 跳过oCPA保价<br/>32 微信改价系数生效<br/>64 二次请求改价生效<br/>128 DSP推荐广告生效|
| \_\_RTA_DSP_TAG\_\_ | 由客户侧自定义的实验分桶，数字格式。对应实时协议中的`RtaResponse.dsp_tag`或`RtaResponse.target_infos.dsp_tag`，targetinfo的优先级大于请求级。 |
| \_\_RTA_DSP_TAG_STR\_\_ | 由客户侧自定义的实验分桶，字符串格式。对应实时协议中的`RtaResponse.dsp_tag_str`或`RtaResponse.target_infos.dsp_tag_str`，targetinfo的优先级大于请求级。 |