---
sidebar_position: 5
draft: false
description: RTA策略ID与广告主ID、计划ID、广告ID的绑定关系查询、增加、修改、删除维护管理。
keywords: [RTA, 策略, 绑定]
---
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# 绑定管理

查询、增改、删除RTA策略绑定关系。

## 查询绑定


`分页拉取模式`需要传入页号和每页条数，适合客户自建管理页面与用户操作翻页联动。例如记录共有100条，传入**page_num=2 page_size=10**，则查询返回11-20条绑定记录，并且返回total数量为100，便于页面设计快速选页功能。

`全量拉取模式`只需设置**get_all**参数设置为true，在此模式下将忽略页号、每页条数参数，保留策略ID。API一次拉取对应条件的全量绑定列表（总量不超过10W条）。

### 请求

**URL**：https://api.algo.com.cn/rta/bind/get

**data结构**

| 参数名 | 类型 |  说明 |
| ---- | ---- | ---- |
| bind_get { } | object | 策略查询 |
| 　　page_num | int32 | 要查询的页号 |
| 　　page_size | int32 | 每页记录数 |
| 　　target_id | string | 要查询的策略ID列表，如列表为空则查询全部 |
| 　　get_all | bool | 全量拉取模式，如该参数为true，则忽略页面控制参数 |

### 返回

**data结构**

| 参数名 | 类型 |  说明 |
| ---- | ---- | ---- |
| bind_get { } | object | 策略信息 |
| 　　page_num | int32 | 查询的页号。全量拉取模式不返回该字段 |
| 　　page_size | int32 | 每页记录条数。全量拉取模式不返回该字段 |
| 　　total | int32 | 记录总数 |
| 　　binds | array of bind | 策略列表 |

**bind结构**

| 参数名 | 类型 |  说明 |
| ---- | ---- | ---- |
| bind_id | int64 | 绑定的ID |
| bind_type | int32(BindType) | 绑定类型<br />1=广告<br />2=计划<br />3=广告主 |
| target_id | string | 策略ID |
| account_id | int64 | 广告主ID |
| bind_source | int32(BindSourceType) | 绑定操作来源<br />0=广告主<br />1=第三方API<br />2=ADQ<br />3=MP<br />4=MKTAPI |

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
		"bind_get": {"page_num":1, "page_size":10, "target_id": "TAR010"}
	}
}`
```

</TabItem>

<TabItem value="res" label="返回">

```json
{
    "code": 0,
    "msg": "success",
    "task_id": "8d3d5221-6380-4e42-aa88-395b89c70083",
    "data": {
        "bind_get": {
            "page_num": 1,
            "page_size": 10,
            "total": 2,
            "binds": [
                {
                    "bind_id": 12345,
                    "bind_type": 3,
                    "target_id": "TAR010",
                    "account_id": 12345
                },
                {
                    "bind_id": 67890,
                    "bind_type": 3,
                    "target_id": "TAR010",
                    "account_id": 67890
                }
            ]
        }
    }
}

```

</TabItem>
</Tabs>


## 增改绑定

新建或修改绑定关系。将广告/计划/广告主与具体策略进行绑定。绑定后对应的广告/计划/广告主下的广告在生效后受RTA策略回复控制。

:::tip

- 同一个广告、计划或账号ID只能绑定到一个策略下。
- 相同ID重复绑定到不同策略时，仅最后一次绑定的策略生效。
- 不同层级的ID可绑到不同策略下，细粒度层级优先于粗粒度层级。

:::

:::caution

- 策略绑定之后不是立刻生效，线上安全生效时间约为1小时。
- 新绑定的广告在空窗期内不受RTA控制，有可能出现广告消耗未经过RTA决策的问题。建议临时停投以规避该问题。
- 本API有`部分成功部分失败`的特殊性，注意检查error_num是否>0，并对errors列表中的绑定失败进行日志记录与善后处理。

:::


### 请求

**URL**：https://api.algo.com.cn/rta/bind/set

**data结构**

| 参数名 | 类型 |  说明 |
| ---- | ---- | ---- |
| bind_set { } | array of bind | 绑定策略 |

**bind结构**

| 参数名 | 类型 |  说明 |
| ---- | ---- | ---- |
| bind_id | int64 | 绑定的ID |
| bind_type | int32(BindType) | 绑定类型<br />1=广告<br />2=计划<br />3=广告主 |
| target_id | string | 策略ID |
| account_id | int64 | 广告主ID |
| bind_source | int32(BindSourceType) | 绑定操作来源<br />0=广告主<br />1=第三方API<br />2=ADQ<br />3=MP<br />4=MKTAPI |

### 返回

**data结构**

| 参数名 | 类型 |  说明 |
| ---- | ---- | ---- |
| bind_set | object | 绑定状态 |
| 　　success_num | int32 | 成功数 |
| 　　error_num | int32 | 错误数 |
| 　　errors | object of binderror | 绑定错误的记录 |

**binderror结构**

| 参数名 | 类型 |  说明 |
| ---- | ---- | ---- |
| bind_id | int64 | 绑定的ID |
| bind_type | int32(BindType) | 绑定类型<br />1=广告<br />2=计划<br />3=广告主 |
| reason | string | 错误原因 |

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
		"bind_set": [{"bind_id":12345, "bind_type":3, "target_id": "TAR001", "account_id": 12345}],
	}
}`
```

</TabItem>

<TabItem value="res" label="返回">

```json
{
    "code": 0,
    "msg": "success",
    "task_id": "8d3c82da-e578-460b-a156-8e4f97f2d4f7",
    "data": {
        "bind_set": {
            "success_num": 1
        }
    }
}
```

</TabItem>
</Tabs>

## 删除绑定
删除绑定关系。

:::caution

- 删除绑定的广告不受RTA控制。
- 如只是希望换个策略绑定，请使用增改模式。
- 本API有`部分成功部分失败`的特殊性，注意检查error_num是否>0，并对errors列表中的绑定失败进行日志记录与善后处理。

:::

### 请求

**URL**：https://api.algo.com.cn/rta/bind/delete

**data结构**

| 参数名 | 类型 |  说明 |
| ---- | ---- | ---- |
| bind_delete [ ] | array of binddelete | 删除策略 |

**binddelete结构**

| 参数名 | 类型 |  说明 |
| ---- | ---- | ---- |
| bind_id | int64 | 绑定的ID |
| bind_type | int32(BindType) | 绑定类型<br />1=广告<br />2=计划<br />3=广告主 |

### 返回

**data结构**

| 参数名 | 类型 |  说明 |
| ---- | ---- | ---- |
| bind_delete | object | 删除绑定状态 |
| 　　success_num | int32 | 成功数 |
| 　　error_num | int32 | 错误数 |
| 　　errors | object of binderror | 绑定错误的记录 |

**binderror结构**

| 参数名 | 类型 |  说明 |
| ---- | ---- | ---- |
| bind_id | int64 | 绑定的ID |
| bind_type | int32(BindType) | 绑定类型<br />1=广告<br />2=计划<br />3=广告主 |
| reason | string | 错误原因 |

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
		"bind_delete": [{"bind_id":12345, "bind_type":3}]
	}
}`
```

</TabItem>

<TabItem value="res" label="返回">

```json
{
    "code": 0,
    "msg": "success",
    "task_id": "135f6d8e-2ff7-416b-ab4f-96a98970e739",
    "data": {
        "bind_delete": {
            "success_num": 1
        }
    }
}
```

</TabItem>
</Tabs>