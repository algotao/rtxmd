---
sidebar_position: 2
draft: false
description: RTA信息管理可获取RTA的基本设置状态。包括名称、QPS上限、BidURL、缓存时间、流量开放规则等。
keywords: [RTA, 策略, 名称, QPS, BidURL, 缓存时间, 站点集]
---
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# 信息管理

信息管理可获取RTA的基本设置状态。包括名称、QPS上限、BidURL、缓存时间、流量开放规则等。

## 查询RTA配置信息

### 请求

**URL**：https://api.algo.com.cn/rta/info/get

**data结构**

| 参数名 | 类型 |  说明 |
| ---- | ---- | ---- |
| 无 | 无 | 无 |

### 返回

**data结构**

| 参数名 | 类型 |  说明 |
| ---- | ---- | ---- |
| info_get { } | object | RTA配置信息 |
| 　　enable | int32 | 是否启用。1=启用 |
| 　　rta_name | string | RTA简称 |
| 　　company_name | string | RTA公司名 |
| 　　qps_limit | int32 | QPS上限 |
| 　　bid_url | string | BidURL |
| 　　cache_second | int32 | 默认缓存时间(秒) |
| 　　rules { } | object | 流量启用规则，<br />为空表示全量选择，不为空仅选择指定。<br />流量下发关系为多个维度取交集 |
| 　　　　siteset []  | array of rule | 站点集 |
| 　　　　os [] | array of rule | 操作系统 |
| 　　　　network [] | array of rule | 网络 |
| 　　　　installed [] | array of rule | 已安装 |
| 　　　　media_id [] | array of rule | 媒体ID |
| 　　　　spec [] | array of rule | 规格 |
| 　　　　scene [] | array of rule | 场景 |

**rule的结构**

| 参数名 | 类型 |  说明 |
| ---- | ---- | ---- |
| value | int32 | 规则值 |
| desc | string | 规则描述 |

### 交互示例

<Tabs>
<TabItem value="req" label="请求">

```json
{
	"auth": {
		"dspid": "10000",
		"token": "mytoken"	
	}
}`
```

</TabItem>

<TabItem value="res" label="返回">

```json
{
    "code": 0,
    "msg": "success",
    "task_id": "0dd76ef9-8547-4086-a775-6d943d6d90ed",
    "data": {
        "info_get": {
            "enable": 1,
            "rta_name": "TestDSP",
            "company_name": "XX有限公司",
            "qps_limit": 10000,
            "bid_url": "https://test.com/path/cgi",
            "cache_second": 3600,
            "rules": {
                "siteset": [
                    {
                        "value": 15,
                        "desc": "移动联盟"
                    },
                    {
                        "value": 21,
                        "desc": "微信"
                    },
                    {
                        "value": 25,
                        "desc": "移动内部站点"
                    },
                    {
                        "value": 27,
                        "desc": "腾讯新闻流量"
                    },
                    {
                        "value": 28,
                        "desc": "腾讯视频流量"
                    }
                ],
                "os": [
                    {
                        "value": 1,
                        "desc": "IOS"
                    }
                ],
                "network": [
                    {
                        "value": 4,
                        "desc": "4G"
                    }
                ],
                "spec": [
                    {
                        "value": 159
                    }
                ],
                "scene": [
                    {
                        "value": 1,
                        "desc": "消息流"
                    }
                ]
            }
        }
    }
}

```

</TabItem>
</Tabs>
