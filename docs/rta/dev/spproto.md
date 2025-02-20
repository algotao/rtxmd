---
sidebar_position: 3
toc_min_heading_level: 2
toc_max_heading_level: 5
description: 本协议为辅助决策交互，适用于已对接RTA的客户进一步挖掘效果提升空间。通过引入辅助决策者（第三方决策者），由辅助方帮助广告主进行价值判断，在双方数据无须直接交互的情况下，发挥三方数据拥有者手中的数据价值。
keywords: [RTA, proto, protobuf, RTASPRequest, RTASPResponse, 辅助决策]
---

# SP交互协议(beta)

本协议为辅助决策交互，适用于已对接RTA的客户进一步挖掘效果提升空间。

例如在拉新场景中，广告主可通过RTA识别出存量用户的价值，但新用户对广告主来说无可用信息，无法判断其价值。通过引入辅助决策者（第三方决策者），由辅助方帮助广告主进行价值判断，在双方数据无须直接交互的情况下，发挥三方数据拥有者手中的数据价值。

:::warning
该功能目前处于beta阶段，由RTA团队主动邀约，不接受外部申请。
:::

[下载 proto](./rtasp.proto)

## 协议代码

```protobuf showLineNumbers title=rtasp.proto
// Copyright (c) 2023 Tencent Inc.

// RTA SP实时交互协议使用protocol v3进行定义，请保持该版本标识
syntax = "proto3";

package tencent.ad.rtasp;

option java_outer_classname = "RtaSPProtos";

// RTASP请求消息结构
message RTASPRequest {
  string id = 1;                                               // 请求ID

  message Device {                                             // 设备信息
    string did_md5 = 1;                                        // 设备ID MD5值，并以此为缓存Key

    enum DeviceIdType {                                        // 策略缓存设备key类型
      ID_INVALID = 0;                                          // 默认占位
      ID_NIL = 1;                                              // 全空设备号
      IDFA_MD5 = 2;                                            // iOS设备的IDFA MD5
      CAID_MD5 = 3;                                            // 广协CAID MD5
      OAID_MD5 = 4;                                            // Android设备的OAID MD5
      IMEI_MD5 = 5;                                            // Android设备的IMEI MD5
      ANDROIDID_MD5 = 6;                                       // Android设备的Android ID MD5
      MAC_MD5 = 7;                                             // 设备的MAC MD5
    }
    DeviceIdType did_type = 2;

    enum OperatingSystem {                                     // 操作系统枚举
      OS_INVALID = 0;
      OS_UNKNOWN = 1;
      OS_IOS = 2;
      OS_ANDROID = 3;
      OS_WINDOWS = 4;
    }
    OperatingSystem os = 3;

    string idfa_md5 = 11;                                      // iOS设备的IDFA MD5值

    message CAIDInfo {                                         // 广协CAID信息
      string origin_version = 3;                               // CAID 版本
      string caid_md5 = 4;                                     // CAID MD5值
    }
    repeated CAIDInfo caid = 12;

    string oaid_md5 = 15;                                      // Android设备的OAID MD5值
    string imei_md5 = 16;                                      // Android设备的IMEI MD5值
    string androidid_md5 = 17;                                 // Android设备的Android ID MD5值
    string mac_md5 = 21;                                       // 设备的MAC MD5值
  }
  Device device = 2;

  repeated uint32 exp_ids = 10;                                // 实验分组ID，支持多个实验ID
}

// RTAS回复消息结构
message RTASPResponse {
  string id = 1;                                               // 回复ID，应原样填入RTASPRequest.id（可不填）

  message RTASPStrategy {
    enum Voting {                                                // 决策状态
      VOTING_INVALID = 0;                                        // 未做决策
      VOTING_YES = 1;                                            // 是
      VOTING_NO = 2;                                             // 否
      VOTING_UNKNOWN = 3;                                        // 未知
    }
    Voting voting = 1;

    float user_weight_factor = 10;                               // 用户权重系数
    uint32 cpc_price = 20;                                       // CPC出价
    float cpc_factor = 21;                                       // CPC出价系数
    uint32 cpa_price = 30;                                       // CPA出价
  }
  map<string, RTASPStrategy> strategy_list = 2;                  // SP策略列表 key为策略名称
}
```

## RTASPRequest对象

| 字段名称 | 字段类型 | 必填 | 说明 |
| ---- | ---- | ---- | ---- |
| id | string | 是 | 请求唯一标识，该字段即RTA SP Trace ID。 |
| device | object of Device | 是 | 设备信息，包含设备号、平台等。数据来源于媒体发起请求时带入的信息。参阅 [Device对象](#device对象) |
| exp_ids | array of uint32 | 否 | 实验信息，调用方对流量按一定规则进行分组，用于ABTest等场景。 |

### Device对象
| 字段名称 | 字段类型 | 必填 | 说明 |
| ---- | ---- | ---- | ---- |
| did_md5 | string | 否 | 设备ID MD5值，并以此为缓存Key |
| did_type | enum of DeviceIdType | 否 | 该字段标志了本次请求会用哪个设备号作为缓存key将外部返回结果写入缓存。枚举值如下<br/>ID_INVALID //默认占位<br/>ID_NIL //空设备号<br/>IDFA_MD5<br/>CAID_MD5<br/>OAID_MD5<br/>IMEI_MD5<br/>IMEI_MD5<br/>MAC_MD5 |
| os | enum of OperatingSystem | 否 | 终端的操作系统类型。枚举值如下：<br/>OS_INVALID //默认占位<br/>OS_UNKNOWN<br/>OS_IOS<br/>OS_ANDROID<br/>OS_WINDOWS |
| idfa_md5 | string | 否 | IDFA的MD5值，计算过程为lower(md5(upper(IDFA)))。 |
| caid | array of CAIDInfo | 否 | 广协CAID。参阅 [CAIDInfo对象](#caidinfo对象) |
| oaid_md5 | string | 否 | OAID的MD5值，计算过程为lower(md5(OAID))。 |
| imei_md5 | string | 否 | IMEI的MD5值，计算过程为lower(md5(lower(imei)))。 |
| androidid_md5 | string | 否 | AndroidID的MD5值，计算过程为lower(md5(AndroidID))。 |
| mac_md5sum | string | 否 | MAC的MD5值，计算过程为lower(md5(MAC))。 |

#### CAIDInfo对象
| 字段名称 | 字段类型 | 必填 | 说明 |
| ---- | ---- | ---- | ---- |
| origin_version | string | 否 | 广协版本号 |
| caid_md5 | string | 否 | CAID的MD5编码，计算过程为lower(md5(QAID))。 [广告标识介绍](http://www.china-caa.org/digital/caid/intro) |