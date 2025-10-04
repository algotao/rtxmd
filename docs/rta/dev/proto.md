---
sidebar_position: 2
toc_min_heading_level: 2
toc_max_heading_level: 5
description: 深度解析RTA交互协议，掌握程序化广告核心通信规范！本文全面呈现RTA实时交互协议的详细内容，包括请求与响应消息结构、必填与可选字段说明，以及协议代码示例。为程序化广告从业者提供精准的协议指南，助力实现高效的RTA通信与广告投放。
keywords: [程序化广告, RTA交互协议, 请求消息结构, 响应消息结构, 必填字段, 可选字段, 协议代码, RTA通信, 广告投放]
---

# RTA交互协议

本协议在官方协议的基础上做了整理，去除了**不建议使用**或**已下线**的字段。常规客户只使用其中的部分功能，可根据投放目标及优化方向，按照http交互、策略圈选、调权调价、实验对比、DPA/DCA应用的推荐进阶过程学习。

参阅：[腾讯RTA官方接口文档](https://docs.qq.com/doc/DVUN6U2NJektwa2ZF)

或者：[下载 proto](./rta.proto)

## 协议代码

```protobuf showLineNumbers title=rta.proto
// Copyright (c) 2019 Tencent Inc.

// RTA实时交互协议使用protocol v2进行定义，请保持该版本标识
syntax = "proto2";

package tencent.ad.rta;

option java_outer_classname = "RtaProtos";

// RTA请求消息结构
message RtaRequest {
  optional string id = 1;                                      // 请求ID
  optional bool is_ping = 2;                                   // 网络耗时监测模式
  optional bool is_test = 3;                                   // 模拟测试模式

  enum OperatingSystem {                                       // 操作系统枚举
    OS_UNKNOWN = 0;
    OS_IOS = 1;
    OS_ANDROID = 2;
    OS_WINDOWS = 3;
    OS_SYMBIAN = 4;
    OS_JAVA = 5;
  }
  
  message Device {                                             // 设备信息    
    optional OperatingSystem os = 1;                           // 操作系统类型
    optional string idfa_md5sum = 2;                           // iOS设备的IDFA MD5值
    optional string imei_md5sum = 3;                           // Android设备的IMEI MD5值
    optional string android_id_md5sum = 4;                     // Android设备的Android ID MD5值
    optional string mac_md5sum = 5;                            // 设备的MAC MD5值
    optional string oaid_md5sum = 6;                           // Android设备的OAID MD5值
    optional string ip = 7;                                    // 用户IP

    enum DeviceIdTag {                                         // 不可信设备类型
      IDFA_MD5_DOUBTFUL = 0;
      IMEI_MD5_DOUBTFUL = 1;
      ANDROIDID_MD5_DOUBTFUL = 2;
      MAC_MD5_DOUBTFUL = 3;
      OAID_MD5_DOUBTFUL = 4;
      OAID_DOUBTFUL = 5;
      QAID_DOUBTFUL = 6;
    }
    repeated DeviceIdTag doubtful_ids_list = 9;                // 设备ID不可信标志

    enum CacheDeviceIdType {                                   // 策略缓存设备key类型
      IDFA_MD5 = 0;                                            // IDFA MD5
      IMEI_MD5 = 1;                                            // IMEI MD5
      OAID = 2;                                                // OAID
      OAID_MD5 = 3;                                            // OAID MD5
      ANDROIDID_MD5 = 4;                                       // ANDROIDID MD5
      MAC_MD5 = 5;                                             // MAC MD5
      NIL = 6;                                                 // 空设备号
      QAID = 7;                                                // CAID
    }
    optional CacheDeviceIdType cached_deviceid_type = 10;      // 策略缓存设备类型

    message QaidInfo {                                         // CAID信息
      optional uint32 version = 1;                             // CAID版本
      optional string qaid = 2;                                // CAID原始值
      optional string origin_version = 3;                      // CAID版本
      optional string qaid_md5sum = 4;                         // CAID MD5
    }
    repeated QaidInfo qaid_infos = 13;

    message WxOpenid {                                         // 微信openid
      optional string appid = 1;                               // 小程序appid
      optional string openid = 2;                              // 对应的openid
    }
    repeated WxOpenid wx_openid = 14;
  }
  optional Device device = 5;

  optional uint64 siteset_id = 6;                              // *(已禁用) 流量站点集

  message RequestInfo {                                        // 请求的扩展信息  
    enum RequestType {                                         // 请求类型
      NORMAL_REQUEST = 0;                                      // 普通请求
      ADLIST_REQUEST = 2;                                      // 二次请求
    }
    optional RequestType request_type = 1;                     // 请求类型
  }
  optional RequestInfo request_info = 8;                       // 请求的扩展信息  

  message Experiment {                                         // 实验信息
    optional uint32 exp_id = 1;                                // 实验分组ID
  }
  repeated Experiment exps = 9;

  message AdInfo {                                             // *二次请求*，粗排检索出的广告列表
    optional uint64 adgroup_id = 1;                            // 广告组ID

    message CreativeInfo {                                     // 广告上的创意信息
      optional uint64 creative_id = 1;                         // 创意ID
      optional uint32 crt_template_id = 2;                     // 创意形式ID
    }
    repeated CreativeInfo creative_infos = 2;

    message ProductInfo {                                      // 广告上的商品信息
      optional uint64 product_lib = 1;                         // 商品库ID
      optional string out_product_id = 2;                      // 外部商品ID
    }
    repeated ProductInfo product_infos = 3;
    
    optional uint32 advertiser_id = 4;                         // 账号ID
    optional string out_target_id = 5;                         // 外部策略ID
  }
  repeated AdInfo ad_infos = 11;

  optional string unified_request_id = 12;                     // 广告系统请求唯一标识

  message FLModel {                                            // *联邦学习*，模型信息
    optional uint64 model_id = 1;                              // 模型ID
    optional string model_name = 2;                            // 模型名称
    optional string model_version = 3;                         // 模型版本

    enum ModelType { DEFAULT = 0; }                            // 模型类型
    optional ModelType model_type = 4;
    repeated float embedding = 5 [ packed = true ];            // 模型数据
  }
  repeated FLModel fl_models = 14;
  repeated uint32 crt_template_id = 15 [packed=true];          // *二次请求*，创意形式ID
  repeated string rta_trace_id_list = 18;                      // *二次请求*，本次召回的广告是哪些一次请求返回的，可能有多个
  optional uint64 ad_request_time = 19;                        // *二次请求*，广告处理时间，后台链路统一
}

message DynamicProductInfo {                                   // *DPA*，商品信息
  optional uint64 product_lib = 1;                             // 商品库ID
  
  message Product {                                            // 商品信息
    optional uint64 id = 1;                                    // mDPA商品ID
    optional uint32 priority = 2;                              // 商品推荐权重
    optional uint64 timestamp = 3;                             // 用户与商品互动时间
    optional string sdpa_product_id = 4;                       // sDPA商品ID
    optional string id_str = 5;                                // 字符串型商品ID，同上方ID字段二选一，请优先使用ID字段
  }
  repeated Product products = 2;
}

message DynamicContentInfo {                                  // *DCA*，动态创意信息
  message Tag {                                               // 动态创意标签信息
    optional string name = 1;                                 // 标签名称
    optional string value = 2;                                // 标签值，预留
  }
  repeated Tag tags = 1;
}

// RTA返回消息结构
message RtaResponse {
  optional string request_id = 1;                              // 回复ID，应原样填入RtaRequest.id（可不填）
  optional uint32 code = 2;                                    // 返回的状态码
  optional int32 processing_time_ms = 4;                       // 处理时间
  optional uint32 response_cache_time = 7;                     // 自定义缓存时间
  optional uint64 dsp_tag = 8;                                 // 自定义归因串联字段，全局级（数字型）
  repeated DynamicProductInfo dynamic_product_infos = 9;       // *mDPA*，推荐商品信息
  repeated string out_target_id = 10;                          // 被调方策略ID

  enum SpAssistType {                                          // *SP*，辅助决策的合作类型
    NONE = 0;                                                  // 禁用辅助决策
    REPLACE_ALL = 1;                                           // 允许辅助替换策略ID和高阶出价
    REPLACE_TARGETINFO = 2;                                    // 只允许辅助替换高阶出价
  }

  message SpAssist {                                           // *SP*，辅助决策
    optional SpAssistType type = 1;                            // 辅助决策的合作类型
  }

  message TargetInfo {                                         // 策略/商品/广告主/广告扩展信息
    optional string out_target_id = 1;                         // 策略ID
    optional uint32 cpc_price = 3;                             // CPC出价
    repeated DynamicProductInfo dynamic_product_infos = 4;     // *mDPA*，推荐商品信息
    optional uint32 cpa_price = 5;                             // CPA出价
    optional float user_weight_factor = 6;                     // 用户加权系数
    optional float cpc_factor = 7;                             // CPC系数
    optional uint64 aid = 8;                                   // 广告组ID
    optional uint64 dsp_tag = 9;                               // 自定义归因串联字段，策略级（数字型）
    optional string dsp_tag_str = 10;                          // 自定义归因串联字段，策略级（字符型）
    optional float pcvr = 11;                                  // pCVR回传
    optional uint64 advertiser_id = 12;                        // 广告主ID
    optional string sdpa_product_id = 14;                      // *sDPA*，商品ID
    optional uint64 sdpa_product_lib = 15;                     // *sDPA*，商品库ID
    repeated DynamicContentInfo dynamic_content_infos = 17;    // *DCA*，动态创意信息
    optional SpAssist sp_action = 18;                          // *SP*，辅助决策
  }
  repeated TargetInfo target_infos = 12;

  repeated uint64 aid_whitelist = 13 [ packed = true ];        // 广告组ID白名单
    
  message AdResult {                                           // *二次请求*，广告改价结果
    optional uint64 adgroup_id = 1;                            // 广告组ID

    message CreativeResult {                                   // 广告上的创意信息      
      optional uint64 creative_id = 1;                         // 创意ID
      optional uint32 cpc_price = 2;                           // 创意级CPC改价，改价优先级：商品＞创意＞广告级，单位：分
      optional float out_raise_factor = 3;                     // 客户侧扶持系数
      optional uint32 cpa_price = 4;                           // 创意级CPA改价，改价优先级：创意＞广告级，单位：分
    }
    repeated CreativeResult creative_results = 2;
    
    optional uint32 cpc_price = 3;                             // 广告级CPC改价，改价优先级：创意＞广告级，单位：分
    optional bool ignore = 4;                                  // 是否跳过二次请求相关改价和校验逻辑，由媒体决定广告出单

    message ProductResult {                                    // 广告上的商品信息
      optional uint64 product_lib = 1;                         // 商品库ID
      optional string out_product_id = 2;                      // 外部商品ID
      optional uint32 cpc_price = 3;                           // 商品级CPC改价，改价优先级：商品＞创意＞广告级，单位：分
    }
    repeated ProductResult product_results = 5;
  
    optional uint32 cpa_price = 6;                             // 广告级CPA改价，改价优先级：创意＞广告级，单位：分
  }
  repeated AdResult ad_results = 14;

  message FLModelResInfo {                                     // *联邦学习*，模型使用情况
    optional uint64 model_id = 1;                              // 模型ID

    enum Status {                                              // 模型使用状态
      UNKNOWN = 0;
      SUCCESS = 1;
      FAILED = 2;
    }
    optional Status status = 2;
  }
  repeated FLModelResInfo fl_model_res_infos = 16;

  optional string dsp_tag_str = 17;                            // 自定义归因串联字段，全局级（字符型）
  repeated DynamicProductInfo sdpa_dynamic_product_infos = 18; // *sDPA*，商品推荐
}
```

## 必填字段和可选字段
请根据字段描述表中的必填要求填写字段。虽然在`proto`的协议定义中，所有字段描述为`optional`（选填），但在实际交互中，仍需要按照下表的是否必填进行处理。请求时的必填由调用方保证，回复时的必填由被调方保证。

- **是**：此类字段必须按照正确格式填写<br/>
- **否**：此类字段根据功能使用情况填写，如未填写则使用默认逻辑


## RtaRequest对象

| 字段名称 | 字段类型 | 必填 | 说明 |
| ---- | ---- | ---- | ---- |
| id | string | 是 | 请求唯一标识，该字段即RTA Trace ID。更多内容参阅 [监测宏](/rta/analysis/macro.md) |
| is_ping | bool | 否 | 当is_ping为true时，被调用者应仅填入code和id并立即返回。该功能用于网络延迟探测。 *可选实现* |
| is_test | bool | 否 | 当is_test为true时，表示请求来自于模拟测试调用（例如RTA自助联调工具），广告不会被展示和计费。 *可选实现* |
| device | object of Device | 是 | 设备信息，包含设备号、平台等。数据来源于媒体发起请求时带入的信息。参阅 [Device对象](#device对象) |
| siteset_id | uint64 | 否 | (已禁用) 流量站点集) |
| request_info | object of RequestInfo | 否 | 请求的扩展信息，当前仅在二次请求时附带该参数。参阅 [RequestInfo对象](#requestinfo对象) |
| exps | array of Experiment | 否 | 实验信息，调用方对流量按一定规则进行分组，用于ABTest等场景。参阅 [Experiment对象](#experiment对象) |
| ad_infos | array of AdInfo | 否 | 二次请求广告信息，二次请求下发的广告及创意信息，用于广告级精排调价。参阅 [AdInfo对象](#adinfo对象) |
| unified_request_id | string | 否 | 与平台的request_id意义等同，不开放。 |
| fl_models | array of FLModel | 否 | 联邦学习模型信息下发。**模型各字段的意义，请与对接人员确认**。参阅 [FLModel对象](#flmodel对象) |
| crt_template_id | array of uint32 | 否 | (二次请求) 创意形式ID |
| rta_trace_id_list | array of string | 否 | (二次请求) 本次召回的广告是哪些一次请求返回的，可能有多个 |
| ad_request_time | uint64 | 否 | (二次请求) 广告处理时间，后台链路统一 |

### Device对象
| 字段名称 | 字段类型 | 必填 | 说明 |
| ---- | ---- | ---- | ---- |
| os | enum of OperatingSystem | 否 | 终端的操作系统类型。枚举值如下：<br/>OS_UNKNOWN<br/>OS_IOS<br/>OS_ANDROID<br/>OS_WINDOWS<br/>OS_SYMBIAN<br/>OS_JAVA|
| idfa_md5sum | string | 否 | IDFA的MD5值，计算过程为lower(md5(upper(IDFA)))。 |
| imei_md5sum | string | 否 | IMEI的MD5值，计算过程为lower(md5(lower(imei)))。 |
| android_id_md5sum | string | 否 | AndroidID的MD5值，计算过程为lower(md5(AndroidID))。 |
| mac_md5sum | string | 否 | MAC的MD5值，计算过程为lower(md5(MAC))。 |
| oaid_md5sum | string | 否 | OAID的MD5值，计算过程为lower(md5(OAID))。 |
| ip | string | 否 | 用户终端的IP地址，支持IPv4和IPv6，优先IPv4，明文字符串 |
| doubtful_ids_list | enum of DeviceIdTag | 否 | 上述设备号是否被查为可疑设备号，例如空串、0值md5等。枚举值如下：<br/>IDFA_MD5_DOUBTFUL<br/>IMEI_MD5_DOUBTFUL<br/>ANDROIDID_MD5_DOUBTFUL<br/>MAC_MD5_DOUBTFUL<br/>OAID_MD5_DOUBTFUL<br/>OAID_DOUBTFUL<br/>QAID_DOUBTFUL |
| cached_device_type | enum of CacheDeviceIdType | 否 | 该字段标志了本次请求会用哪个设备号作为缓存key将外部返回结果写入缓存，空/可疑设备号不允许作为缓存key。枚举值如下<br/>IDFA_MD5<br/>IMEI_MD5<br/>OAID<br/>OAID_MD5<br/>ANDROIDID_MD5<br/>MAC_MD5<br/>QAID<br/>NIL //空设备号 |
| qaid_infos | array of QaidInfo | 否 | 广协CAID。参阅 [QaidInfo对象](#qaidinfo对象) |
| wx_openid | array of WxOpenid | 否 | 特定的公众号、小程序、小游戏等微信系产品对应的openid。参阅 [WxOpenid对象](#wxopenid对象) |

#### QaidInfo对象
| 字段名称 | 字段类型 | 必填 | 说明 |
| ---- | ---- | ---- | ---- |
| version | uint32 | 否 | 设备标识的版本，不同的版本代表着不同的算法，版本含义以及下发版本数量，以广协通知为准。 |
| qaid | string | 否 | 广协设备标识（CAID）。[广告标识介绍](http://www.china-caa.org/digital/caid/intro) |
| origin_version | string | 否 | 广协版本号 |
| qaid_md5sum | string | 否 | QAID的MD5编码，计算过程为lower(md5(QAID))。 |

#### WxOpenid对象
| 字段名称 | 字段类型 | 必填 | 说明 |
| ---- | ---- | ---- | ---- |
| appid | string | 否 | 公众号、小程序、小游戏等微信系产品对应的appid |
| openid | string | 否 | 用户openid |

### RequestInfo对象
| 字段名称 | 字段类型 | 必填 | 说明 |
| ---- | ---- | ---- | ---- |
| request_type | enum of RequestType | 否 | 请求类型，在二次请求场景中，该字段值为ADLIST_REQUEST。 |

### Experiment对象
| 字段名称 | 字段类型 | 必填 | 说明 |
| ---- | ---- | ---- | ---- |
| exp_id | uint32 | 否 | 实验ID，该ID由广告平台创建。调用方将流量按UV分成若干分，并在每次RTA请求带上该流量分组标识，被调方可根据实验ID做不同的策略响应。 |

### AdInfo对象
| 字段名称 | 字段类型 | 必填 | 说明 |
| ---- | ---- | ---- | ---- |
| adgroup_id | uint64 | 否 | 广告组ID，平台侧粗排胜出后的广告组ID，交给广告主做进一步决策。 |
| creative_infos | array of CreativeInfo | 否 | 广告上的创意信息。参阅 [CreativeInfo对象](#creativeinfo对象) |
| product_infos | array of ProductInfo | 否 | 广告上的商品信息。参阅 [ProductInfo对象](#productinfo对象) |
| advertiser_id | uint32 | 否 | 广告主ID。 |
| out_target_id | string | 否 | 广告所对应的RTA策略ID。 |

#### CreativeInfo对象
| 字段名称 | 字段类型 | 必填 | 说明 |
| ---- | ---- | ---- | ---- |
| creative_id | uint64 | 否 | 广告创意ID。 |
| crt_template_id | uint32 | 否 | 创意形式ID |

#### ProductInfo对象
| 字段名称 | 字段类型 | 必填 | 说明 |
| ---- | ---- | ---- | ---- |
| product_lib | uint64 | 否 | 商品库ID。 |
| out_product_id | string | 否 | 外部商品ID。 |

### FLModel对象
| 字段名称 | 字段类型 | 必填 | 说明 |
| ---- | ---- | ---- | ---- |
| model_id | uint64 | 否 | 模型ID。 |
| model_name | string | 否 | 模型名称。 |
| model_version | string | 否 | 模型版本。 |
| model_type | enum of ModelType | 否 | 模型类型。枚举值如下：<br/>DEFAULT |
| float_embedding | array of float | 否 | 模型数据。 |

## RtaResponse对象

| 字段名称 | 字段类型 | 必填 | 说明 |
| ---- | ---- | ---- | ---- |
| request_id | string | 否 | 原样填写RtaRequest请求中的id值（可不填） |
| code | uint32 | 是 | 请求级回复状态码。code为非0时，表示全部拒绝。code为0时，表示接受该流量，并按策略/商品推荐执行。 |
| processing_time_ms | int32 | 否 | 请求处理时间(ms)，该值由被调方填写，计时时间为接到请求与返回请求的时间差。 |
| response_cache_time | uint32 | 否 | 自定义缓存时间(s)，方便被调方灵活设定个性化的缓存时间，以降低QPS。有效值域为 平台设定缓存时间 &lt;= 自定义缓存时间 &lt;= 7天 |
| dsp_tag | uint64 | 否 | 被调方自定义归因串联字段（数字型）。 |
| dynamic_product_info | array of DynamicProductInfo | 否 | 推荐的mDPA商品信息。 参阅 [DynamicProductInfo对象](#dynamicproductinfo对象) |
| out_target_id | array of string | 否 | 被调方策略ID。当code为0选择该设备时，填写命中的策略号，可填写多个。 |
| target_infos | array of TargetInfo | 否 | 策略/商品/广告主/广告扩展属性信息。 参阅 [TargetInfo对象](#targetinfo对象) |
| aid_whitelist | array of uint64 | 否 | 直接指定某些广告组ID召回。 |
| ad_results | array of AdResult | 否 | 二次请求返回广告信息。 |
| fl_model_res_infos | array of FLModelResInfo | 否 | 模型应用状态返回。 参阅 [FLModelResInfo对象](#flmodelresinfo对象) |
| dsp_tag_str | string | 否 | 被调方自定义归因串联字段（字符型），最长20字节。 |
| sdpa_dynamic_product_info | array of DynamicProductInfo | 否 | 推荐的sDPA商品信息。 参阅 [DynamicProductInfo对象](#dynamicproductinfo对象) |
| sp_action | object of SpAssist | 否 | 辅助决策信息。 参阅 [SpAssist对象](#spassist对象) |

### TargetInfo对象

| 字段名称 | 字段类型 | 必填 | 说明 |
| ---- | ---- | ---- | ---- |
| out_target_id | string | 否 | 被调方策略ID，对应请求级的out_target_id。在调价调权的应用场景中，回复填充字段应对out_target_id、aid、advertiser_id、sdpa_product_id四选一。 |
| cpc_price | uint32 | 否 | 广告主对该策略下的广告实时回复CPC价格（高于订单投放端价格有效）, 单位：分。 |
| dynamic_product_infos | array of DynamicProductInfo | 否 | 为策略推荐的mDPA商品信息，优先级高于请求级商品推荐。 参阅 [DynamicProductInfo对象](#dynamicproductinfo对象) |
| cpa_price | uint32 | 否 | 广告主对该策略下的广告实时回复CPA价格（高于订单投放端价格有效）, 单位：分。 |
| user_weight_factor | float | 否 | 用户竞争力加权系数， 上下限默认0.2~5。 |
| cpc_factor | float | 否 | 广告主回复的CPC加权系数， 上下限默认0.2~5。 |
| aid | uint64 | 否 | 广告组ID，支持广告级改价能力。在调价调权的应用场景中，回复填充字段应对out_target_id、aid、advertiser_id、sdpa_product_id四选一。 |
| dsp_tag | string | 否 | 被调方自定义归因串联字段（数字型）。该字段优先级高于请求级dsp_tag。 |
| dsp_tag_str | string | 否 | 被调方自定义归因串联字段（字符型），最长20字节。该字段优先级高于请求级dsp_tag_str。 |
| pcvr | string | 否 | 被调方回传pCVR预估值。 |
| advertiser_id | string | 否 | 广告主ID，支持账号级别改价能力。在调价调权的应用场景中，回复填充字段应对out_target_id、aid、advertiser_id、sdpa_product_id四选一。 |
| sdpa_product_id | string | 否 | sDPA商品ID。在调价调权的应用场景中，回复填充字段应对out_target_id、aid、advertiser_id、sdpa_product_id四选一。 |
| sdpa_product_lib | string | 否 | sDPA商品库ID。 |
| dynamic_content_infos | array of DynamicContentInfo | 否 | 为策略推荐的DCA动态创意标签信息。参阅 [DynamicContentInfo对象](#dynamiccontentinfo对象) |

### DynamicProductInfo对象

| 字段名称 | 字段类型 | 必填 | 说明 |
| ---- | ---- | ---- | ---- |
| product_lib | uint64 | 是 | 商品库ID。 |
| products | array of Product | 是 | 商品列表信息。 参阅 [Product对象](#product对象) |

#### Product对象

| 字段名称 | 字段类型 | 必填 | 说明 |
| ---- | ---- | ---- | ---- |
| id | uint64 | 否 | 商品ID。 |
| priority | uint32 | 否 | 商品推荐权重，取值范围[1,100]，取值越高越重要，如果不传或者为0，按商品回复的顺序排序。 |
| timestamp | uint32 | 否 | 用户和商品产生互动的时间，unix时间戳，如果不传，则以回复RTA时间为准。 |
| sdpa_product_id | string | 否 | sDPA商品ID。 |
| id_str | string | 否 | 字符串型商品ID，同上方ID字段二选一，请优先使用ID字段 |

### DynamicContentInfo对象

| 字段名称 | 字段类型 | 必填 | 说明 |
| ---- | ---- | ---- | ---- |
| tags | array of Tag | 否 | 动态创意标签信息。参阅 [Tag对象](#tag对象) |

#### Tag对象

| 字段名称 | 字段类型 | 必填 | 说明 |
| ---- | ---- | ---- | ---- |
| name | string | 是 | 动态创意标签名称。 |
| value | string | 否 | 动态创意标签值（预留）。 |

### AdResult对象
| 字段名称 | 字段类型 | 必填 | 说明 |
| ---- | ---- | ---- | ---- |
| adgroup_id | uint64 | 否 | 广告组ID。 |
| creative_results | array of CreativeResult | 否 | 广告上的创意信息。参阅 [CreativeResult对象](#creativeresult对象) |
| product_results | array of ProductResult | 否 | 广告上的商品信息。参阅 [ProductResult对象](#productresult对象) |
| cpc_price | uint32 | 否 | 广告级CPC改价，改价优先级：创意＞广告级，单位：分。 |
| ignore | bool | 否 | 是否跳过二次请求相关改价和校验逻辑，由媒体决定广告出单。 |
| cpa_price | uint32 | 否 | 广告级CPA改价，改价优先级：创意＞广告级，单位：分。 |

#### CreativeResult对象
| 字段名称 | 字段类型 | 必填 | 说明 |
| ---- | ---- | ---- | ---- |
| creative_id | uint64 | 否 | 创意ID。 |
| cpc_price | uint32 | 否 | 创意级CPC改价，改价优先级：商品>创意>广告级，单位：分。 |
| out_raise_factor | float | 否 | 加权系数 |
| cpa_price | uint32 | 否 | 创意级CPA改价，改价优先级：创意＞广告级，单位：分。 |

#### ProductResult对象
| 字段名称 | 字段类型 | 必填 | 说明 |
| ---- | ---- | ---- | ---- |
| product_lib | uint64 | 否 | 商品库ID。 |
| out_product_id | string | 否 | 外部商品ID。 |
| cpc_price | uint32 | 否 | 商品级CPC改价，改价优先级：商品>创意>广告级，单位：分。 |

### FLModelResInfo对象

| 字段名称 | 字段类型 | 必填 | 说明 |
| ---- | ---- | ---- | ---- |
| model_id | uint64 | 否 | 模型ID。 |
| status | enum of Status | 否 | 模型使用状态。枚举值如下：<br/>UNKNOWN<br/>SUCCESS<br/>FAILED |

### SpAssist对象

| 字段名称 | 字段类型 | 必填 | 说明 |
| ---- | ---- | ---- | ---- |
| type | enum of SpAssistType | 否 | 辅助决策的合作类型。枚举值如下：<br/>NONE 禁用辅助决策<br/>REPLACE_ALL 允许辅助替换策略ID和高阶出价<br/>REPLACE_TARGETINFO 只允许辅助替换高阶出价 |