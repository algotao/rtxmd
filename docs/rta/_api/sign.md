---
sidebar_position: 3
draft: false
description: RTA签名用于在RTA实时交互时加入指定的Header，以提供可信访问来源简洁验证机制。签名以KV对的形式指定，可使用多组KV对。
keywords: [RTA, 签名机制, 安全认证, 自定义Header]
---
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# 签名管理

签名用于在RTA实时交互时加入指定的Header，以提供可信访问来源简洁验证机制。签名以KV对的形式指定，可使用多组KV对。修改KV对到线上生效有一定的时间差（小时级），请注意在验证KV对时留一定的时间窗口允许旧设置通过。

## 查询签名

### 请求

**URL**：https://api.algo.com.cn/rta/sign/get

**data结构**

| 参数名 | 类型 |  说明 |
| ---- | ---- | ---- |
| 无 | 无 | 无 |

### 返回

**data结构**

| 参数名 | 类型 |  说明 |
| ---- | ---- | ---- |
| sign_get [] | array of sign| 签名配置信息 |

**sign的结构**

| 参数名 | 类型 |  说明 |
| ---- | ---- | ---- |
| key | string | Header 的 Key |
| value | string | Header 的 Value |

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
    "task_id": "f7fdae61-52d6-4c7c-8b10-805b1b8d2416",
    "data": {
        "sign_get": [
            {"key": "k1","value": "v1"},
            {"key": "k2","value": "v2"}
        ]
    }
}
```

</TabItem>
</Tabs>

## 修改签名

修改签名的操作为全量覆盖。例如前次修改签名传入值为k1/v1，后次修改签名传入值为k2/v2，则最终签名为k2/v2。如需取消签名，请对sign_set传入空数组 "sign_set":[]

### 请求

**URL**：https://api.algo.com.cn/rta/sign/set

**data结构**

| 参数名 | 类型 |  说明 |
| ---- | ---- | ---- |
| sign_set [] | array of sign | 签名设置信息 |

**sign结构**

| 参数名 | 类型 |  说明 |
| ---- | ---- | ---- |
| key | string | Header 的 Key |
| value | string | Header 的 Value |

### 返回

**data结构**

| 参数名 | 类型 |  说明 |
| ---- | ---- | ---- |
| 无 | 无 | 无 |

### 交互示例

<Tabs>
<TabItem value="req" label="请求">

```json
{
	"auth": {
		"dspid": "10000",
		"token": "mytoken"	
	},
    "data": {
		"sign_set": [
            {"key": "k1", "value": "v1"}, 
            {"key": "k2", "value": "v2"}
        ]
	}
}`
```

</TabItem>

<TabItem value="res" label="返回">

```json
{
    "code": 0,
    "msg": "实时协议签名设置成功！",
    "task_id": "8bba3c2d-51a7-4e8d-87cd-df721fc5b0d7",
    "sandbox": false,
    "data": {}
}
```

</TabItem>
</Tabs>