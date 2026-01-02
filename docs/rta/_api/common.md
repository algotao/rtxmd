---
sidebar_position: 1
draft: false
description: 此API是在 RTA官方接口文档的基础上进行二次封装，以弥补官方API资料分散及设计不一等问题，并对部分功能进行扩充。
keywords: [RTA, 策略, 通用API]
---
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# 通用交互

此API是在 [RTA官方接口文档](https://docs.qq.com/doc/DVUN6U2NJektwa2ZF) 的基础上进行二次封装，以弥补官方API`资料分散`及`设计不一`等问题，并对部分功能进行扩充。

**基础功能** `在官方API的基础上进行交互优化`
- **信息管理**：RTA基本信息的获取、实时交互签名的查询与修改
- **签名管理**：提供RTA实时交互的可信访问来源验证机制
- **策略管理**：策略的查询、新建、删除
- **绑定管理**：策略绑定关系的查询、增改、删除
- **实验数据**(编写中)：实验列表查询、实验数据获取

**特定功能** `在官方API的基础上进行交互优化`
- **位图管理**(编写中)：位图的列表获取、文件上传、策略绑定、删除
- **流量屏蔽**(编写中)：广告位级流量屏蔽的查询、增加、删除
- **二次交互**(编写中)：二次交互的白名单查询、增加、删除

**独立功能** `此类功能需要与algotao提前约定`
- **质量指标**(编写中)：提供调用方视角的RTA服务质量曲线数据源
- **唤起优化**(编写中)：批量传入客户侧唤起事件以提升首唤率

## API请求约定

- **HTTP方法**：POST
- **内容类型**：application/json
- **文本编码**：文本编码均使用UTF-8（无BOM头）
- **字段名称**：所有字段名均为小写
- **请求URL**：https://api.algo.com.cn/rta/$function$/$operate$  
    $function$为调用的功能，可用的值有 `info` `sign` `target` `bind` `exp` `bitmap` `filter`。$operate$为所做的操作，可用的值有 `get` `set` `delete`。示例：https://api.algo.com.cn/rta/info/get

### 请求通用内容

| 参数名 | 类型 | 说明 |
| ---- | ---- | ---- |
| auth { } | object of auth | 鉴权所需信息 |
| ~~sandbox~~ | ~~bool~~ | ~~是否沙箱模式~~。开发中，暂未支持 |
| data { } | object of Request.Data | 命令字所需请求数据请参见每个功能的说明 |

**auth结构**

| 参数名 | 类型 |  说明 |
| ---- | ---- | ---- |
| dspid | string | DSPID/RTAID |
| token | string | 鉴权密钥 |

### 请求内容示例
```json
//所有JSON字段名均为小写
{
    "auth": {
        "dspid": "123",
        "token": "token_sample",
    },
    "sandbox": false, 
    "data": {
        ...
    }
}
```

## API返回约定

- **内容类型**：application/json  （只要能进逻辑层，必然返回JSON格式）
- **文本编码**：文本编码均使用UTF-8（无BOM头）
- **字段名称**：所有字段名均为小写

### 返回通用内容

| 参数名 | 类型 | 说明 |
| ---- | ---- | ---- |
| code | int32 | 状态码。code=0时表示成功，>0 时表示失败，&lt;0 时表示部分成功部分失败 |
| msg | string | 说明信息。当code不为0时，此处为错误信息 |
| taskid | string | 任务ID。请记录该任务ID以便于事后问题反查 |
| sandbox | bool | 沙箱模式 |
| data { } | object of Response.Data | 命令字所返回数据，请参见每个功能的说明。为便于代码处理，data对象必然存在(即使它的内容为空) | 

### 返回内容示例

```json
//所有JSON字段名均为小写
{
    "code": 0,
    "status": "success",
    "taskid": "任务的UUID",
    "sandbox": false,
    "data": {
        ...
    }
}
```

## 沙箱模式
为便于使用者进行调试，API支持`沙箱模式`。使用沙箱模式时，操作交互全部在沙箱中进行，并不会真正写入到生产环境。

:::caution

沙箱模式是一个便利工具，并不能100%还原生产环境的功能。从沙箱切换到生产环境时，请注意仔细验证。

:::

## 完整协议约束

由于json格式的随意性，在编码时不能及时验证。这里展示了由protobuf描述的完整数据结构，我们在实现扩展API时使用该份proto以生成语言类代码，并基于该类代码的原生/protobuf/json的通用能力实现相应编解码。

该proto中字段的数字编号不重要且不作保证，我们只是利用protoc去生成class/struct和json tag，并不会真的使用协议去做protobuf的序列化与反序列化。

在调用特定功能时需要填写Request.Data与Response.Data下的特定功能节点，非功能使用节点将被忽略。如对应的功能无传入/传出值，则不提供该节点。

```protobuf
syntax = "proto3";

package rtaextproto;

// Request 请求
message Request{
    Auth auth                               = 1; //鉴权参数
    bool sandbox                            = 2; //是否沙箱模式
    Data data                               = 3; //请求数据节点

    message Data {
        //info/get、sign/get 无须传入数据节点 

        repeated Sign sign_set              = 1; //调用sign/get时填写的节点
        TargetGet target_get                = 2; //调用target/get时填写的节点
        Target target_set                   = 3; //调用target/set时填写的节点
        repeated TargetDelete target_delete = 4; //调用target/delete时填写的节点
        BindGet bind_get                    = 5; //调用bind/get时填写的节点
        repeated Bind bind_set              = 6; //调用bind/set时填写的节点
        repeated BindDelete bind_delete     = 7; //调用bind/delete时填写的节点

        message TargetGet {
            int32 page_num              = 1; //要查询的页号
            int32 page_size             = 2; //每页记录数
            bool get_all                = 3; //是否获取所有记录，如getall为true，则忽略页面控制参数
        }

        message TargetDelete {
            string target_id            = 1; //要删除的策略ID
        }

        message BindGet {
            int32 page_num              = 1; //要查询的页号
            int32 page_size             = 2; //每页记录数
            string target_id            = 3; //要查询的策略号。当该参数有值时则只返回该策略的绑定。如该参数为空则所有策略的绑定。
            bool get_all                = 4; //是否获取所有记录，如getall为true，则忽略页面控制参数
        }

        message BindDelete {
            int64 bind_id               = 1; //绑定的ID
            BindType bind_type          = 2; //绑定类型
        }
    }
}

// Response 回复
message Response {
    int32 code                          = 1; //返回状态码。当code!=0时代表错误，为0时表示正确或部分正确。
    string msg                          = 2; //状态返回信息，描述问题原因
    string task_id                      = 3; //任务ID，UUID格式，用于排查追踪特定的API请求
    bool sandbox                        = 4; //是否沙箱模式
    Data data                           = 5; //返回数据节点

    message Data {
        //sign/set、target/set、target/delete 无返回数据节点，仅用code+msg表示操作结果

        InfoGet info_get                = 1; //调用info/get时返回的节点
        repeated Sign sign_get          = 2; //调用sign/get时返回的节点
        TargetGet target_get            = 3; //调用target/get时返回的节点
        BindGet bind_get                = 4; //调用bind/get时返回的节点
        BindSet bind_set                = 5; //调用bind/set时返回的节点
        BindDelete bind_delete          = 6; //调用bind/delete时返回的节点

        message InfoGet {
            int32 enable                = 1; //是否启用
            string rta_name             = 2; //RTA简称
            string company_name         = 3; //RTA公司名
            int32 qps_limit             = 4; //QPS上限
            string bid_url              = 5; //BidURL
            int32 cache_second          = 6; //默认缓存时间
            Rules rules                 = 7; //流量启用规则

            message Rules {
                repeated Rule siteset   = 1; //启用站点集
                repeated Rule os        = 2; //启用系统
                repeated Rule network   = 3; //启用网络环境
                repeated Rule installed = 4; //启用安装态
                repeated Rule media_id  = 5; //启用媒体ID
                repeated Rule spec      = 6; //启用规格ID
                repeated Rule scene     = 7; //启用场景ID
            }
        }

        message TargetGet {
            int32 page_num              = 1; //页号
            int32 page_size             = 2; //每页记录数
            int32 total                 = 3; //总记录数
            repeated Target targets     = 4; //策略列表
        }

        message BindGet {
            int32 page_num              = 1; //页号
            int32 page_size             = 2; //每页记录数
            int32 total                 = 3; //总记录数
            repeated Bind binds         = 4; //绑定列表
        }

        message BindSet {
            int32 success_num           = 1; //成功数
            int32 error_num             = 2; //错误数
            repeated BindError errors   = 3; //绑定错误的记录
        }
        message BindDelete {
            int32 success_num           = 1; //成功数
            int32 error_num             = 2; //错误数
            repeated BindError errors   = 3; //绑定错误的记录
        }
    }
}

// RuleType 流量规则类型
enum RuleType {
    UnknownRuleType                     = 0; 
	SiteSet                             = 1; //站点集
	Scene                               = 3; //场景
	Spec                                = 4; //规格
	OS                                  = 5; //操作系统
	Network                             = 6; //网络类型
	Installed                           = 7; //已安装
	MediaID                             = 8; //媒体ID
}

// BindType 绑定类型
enum BindType {
    UnknownBindType                     = 0;
    AdgroupId                           = 1; //广告
    CampaignId                          = 2; //计划
    AccountId                           = 3; //广告主
    AgencyId                            = 4; //代理商ID
    SkuId                               = 5; //商品ID
}

// Auth 鉴权信息
message Auth {
    string dspid                        = 1; //DSPID
    string token                        = 2; //Token
}

// Sign HTTP头签名对
message Sign {
    string key                          = 1;//Header Key
    string value                        = 2;//Header Value
}

// Target 策略信息
message Target {
    string target_id                    = 1; //策略ID
    string target_desc                  = 2; //策略描述，例如”拉活，最近15天活跃用户“
}

// Rule 流量规则
message Rule {
    int32 value                         = 1; //流量规则值
    string desc                         = 2; //流量规则文本说明
}

// Bind 绑定信息
message Bind {
    int64 bind_id                       = 1; //绑定的ID
    BindType bind_type                  = 2; //绑定类型
    string target_id                    = 3; //策略ID
    int64 account_id                    = 4; //广告主ID
    BindSourceType bind_source          = 5; //绑定操作来源
}

// BindError 绑定错误信息
message BindError {
    int64 bind_id                       = 1; //错误绑定的绑定ID
    int32 bind_type                     = 2; //绑定类型
    string reason                       = 3; //错误绑定原因
}

// BindSourceType 绑定操作来源
enum BindSourceType {
    DefaultBindSourceType               = 0; //广告主或未填写
    ThirdPartyApi                       = 1; //第三方API
    ADQ                                 = 2; //ADQ平台
    MP                                  = 3; //MP平台
    MktApi                              = 4; //MarketingAPI
}

```
