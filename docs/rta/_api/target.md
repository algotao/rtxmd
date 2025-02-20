---
sidebar_position: 4
draft: false
description: 查询、新建、删除RTA策略。分页拉取模式适合自建管理员面与操作联动，全量拉取适合全局视角管理。
keywords: [RTA, 策略, 查询, 新建, 删除]
---
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# 策略管理

。

## 查询策略

`分页拉取模式`需要传入页号和每页条数，适合客户自建管理页面与用户操作翻页联动。例如记录共有100条，传入**page_num=2 page_size=10**，则查询返回11-20条策略记录，并且返回total数量为100，便于页面设计快速选页功能。

`全量拉取模式`只需设置**get_all**参数设置为true，在此模式下将忽略页号、每页条数参数。API一次拉取全量的策略列表（总量不超过10W条）。

### 请求

**URL**：https://api.algo.com.cn/rta/target/get

**data结构**

| 参数名 | 类型 |  说明 |
| ---- | ---- | ---- |
| target_get { } | object | 策略查询 |
| 　　page_num | int32 | 要查询的页号 |
| 　　page_size | int32 | 每页记录数 |
| 　　get_all | bool | 全量拉取模式，如该参数为true，则忽略页面控制参数 |

### 返回

**data结构**

| 参数名 | 类型 |  说明 |
| ---- | ---- | ---- |
| target_get { } | object | 策略信息 |
| 　　page_num | int32 | 查询的页号。全量拉取模式不返回该字段 |
| 　　page_size | int32 | 每页记录条数。全量拉取模式不返回该字段 |
| 　　total | int32 | 记录总数 |
| 　　targets | array of target | 策略列表 |

**target结构**

| 参数名 | 类型 |  说明 |
| ---- | ---- | ---- |
| targetid | string | 策略ID |
| targetdesc | string | 策略描述 |

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
		"target_get": {"page_num":1, "page_size":10}
	}
}`
```

</TabItem>

<TabItem value="res" label="返回">

```json
{
    "code": 0,
    "msg": "success",
    "task_id": "82e2a799-8f86-4e75-856d-702aeedc6b8c",
    "sandbox": false,
    "data": {
        "target_get": {
            "page_num": 1,
            "page_size": 10,
            "total": 2,
            "targets": [
                {
                    "target_id": "target1",
                    "target_desc": "测试策略ID1"
                },
                {
                    "target_id": "target2",
                    "target_desc": "测试策略ID2"
                }
            ]
        }
    }
}
```

</TabItem>
</Tabs>


## 新建策略

新建一个策略ID

### 请求

**URL**：https://api.algo.com.cn/rta/target/set

**data结构**

| 参数名 | 类型 |  说明 |
| ---- | ---- | ---- |
| target_set { } | object | 新建策略 |
| 　　target_id | string | 策略ID。字母、数字、下划线、中划线，长度限制32英文字符 |
| 　　target_desc | string | 策略描述。字母、数字、下划线、中划线、中文，长度限制32英文字符 |

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
		"target_set": {"target_id": "TAR010", "target_desc": "策略10"}
	}
}`
```

</TabItem>

<TabItem value="res" label="返回">

```json
{
    "code": 0,
    "msg": "外部策略ID(TAR010)新增成功！",
    "task_id": "6ed87caf-dc96-4a75-a731-66043fe0114d",
    "sandbox": false,
    "data": {}
}
```

</TabItem>
</Tabs>

## 删除策略
删除策略ID，一次操作允许单个或多个。一次请求删除多个策略时，将以全部成功或全部失败的`事务模式`运行，不会存在部分成功部分失败的情况。当策略ID下绑定了有效的账号或计划或广告，该策略ID无法删除。

### 请求

**URL**：https://api.algo.com.cn/rta/target/delete

**data结构**

| 参数名 | 类型 |  说明 |
| ---- | ---- | ---- |
| target_delete [ ] | array of targetdelete | 删除策略 |

**targetdelete结构**

| 参数名 | 类型 |  说明 |
| ---- | ---- | ---- |
| targetid | string | 策略ID |

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
		"target_delete": [{"target_id": "TAR001"}, {"target_id": "TAR002"}]
	}
}`
```

</TabItem>

<TabItem value="res" label="返回">

```json
{
    "code": 0,
    "msg": "删除策略ID成功！",
    "task_id": "f6a9444a-6f57-479c-a3e5-5df25fbb002f",
    "sandbox": false,
    "data": {}
}
```

</TabItem>
</Tabs>