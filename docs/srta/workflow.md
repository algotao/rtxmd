---
sidebar_position: 2
toc_min_heading_level: 2
toc_max_heading_level: 5
description: 探索sRTA的奥秘，开启程序化广告新篇章！本文深入介绍sRTA产品，阐述其以SaaS方式助力广告客户低门槛、高灵活度运用RTA能力的定位，详述适用行业与客户场景、产品对比优势。同时，涵盖使用流程、模块一览、对接协议与文档等关键内容，为广告客户带来全新体验与更多业务可能。
keywords: [sRTA, 程序化广告, RTA能力, SaaS方式, 广告客户, 数据管理, 策略管理, 产品对比, 使用流程, 对接协议]
---

# 2 数据流程

sRTA 平台支持两种角色的数据上传和使用模式：

**客户模式**：将自有数据上传到 sRTA 平台，sRTA 在每次广告决策时通过 Lua 脚本引用客户数据，实现广告决策干预。

**服务商模式**：将自有数据上传到 sRTA 平台，通过授权机制授权给客户使用，帮助客户提升广告效果。

**整体过程可描述为**：账号申请-->数据生产-->数据写入-->脚本编写-->脚本测试-->脚本上线-->效果验证

## 2.1 写入流程简述

本示例演示如何通过 sRTA 平台实现根据用户设备ID的安装状态决策拉活拉新，并根据活跃用户级别调节竞争力系数。

**客户拥有最为全面准确的已安装状态及价值数据，该类信息需要客户上传。**

**示例用户**

| 用户ID | 已安装态 | 用户级别 |
|--------|---------|---------|
| 张三 | 已安装 | 低价值 |
| 李四 | 已安装 | 中价值 |
| 王五 | 已安装 | 高价值 |
| 其他 | 未安装 | -- |


**策略：** acitve=拉活，new=拉新

**逻辑：**
- **拉活广告**：未安装用户不出。低价值用户降权、中等价值用户维持、高价值用户提权。无价值分数用户以不调节作为兜底。
- **拉新广告**：未安装可出。

### 数据准备：准备 JSONL 数据文件

**数据定义规划**

- 数据空间（DS）：`did`
- 字节1：已安装态（`0`=未安装/未知，`1`=已安装）
- 字节2：用户级别（`1`=低价值、`2`=中等价值、`3`=高价值、`0`=未知）

**由客户规划各编号字段所指代的意义**，生产 `users.jsonl` 文件，每行包含一个用户的数据：

例如下面将 U8区第1字节作为已安装态，第2字节作为用户级别

```json
{"userid":"张三","bytesKv":{"1":1,"2":1}}
{"userid":"李四","bytesKv":{"1":1,"2":2}}
{"userid":"王五","bytesKv":{"1":1,"2":3}}
```

**数据格式说明**

- `userid`：设备号（MD5值小写）
- `bytesKv`：字节数据映射表（key为字节索引1-64，value为字节值0-255）
  - `{"1":1,"2":1}`：字节索引1=1（已安装），字节索引2=1（低价值）
  - `{"1":1,"2":2}`：字节索引1=1（已安装），字节索引2=2（中等价值）
  - `{"1":1,"2":3}`：字节索引1=1（已安装），字节索引2=3（高价值）

### 数据准备：通过 saastool 写入服务端

使用命令行工具将数据写入 sRTA 平台：

`write` 功能用于少量数据写入，如需大量数据写入，请使用 `saastool task` 能力。

```sh
saastool write -ds did -source ./users.jsonl
```

**输出示例**

写入成功时，命令会显示处理进度和统计信息：
```
[./users.jsonl]  err_batch = 0, err_total = 0, total_processed = 3
```

- `err_batch`: 当前批次写入失败的记录数
- `err_total`: 累计写入失败的记录数
- `total_processed`: 已处理的记录总数

如果有用户写入失败，失败的用户ID会被记录到 `WriteRes.failedUserid` 字段中

### 数据准备：DS 中的数据存储

写入成功后，数据在 Redis 中的存储格式为字节数据。sRTA lua在查询时会自动取出当前用户下的数据转换为 dataspace Table变量 供 Lua 脚本使用：

```lua
"张三" = {[srta.U8] = {[1] = 1, [2] = 1}} --字节索引1=1 (已安装），字节索引2=1（低价值）
"李四" = {[srta.U8] = {[1] = 1, [2] = 2}} --字节索引1=1（已安装），字节索引2=2（中价值）
"王五" = {[srta.U8] = {[1] = 1, [2] = 3}} --字节索引1=1（已安装），字节索引2=3（高价值）
```

### 脚本：编写 Lua 实现拉活与调权

创建 `sample.lua` 脚本，实现根据用户安装态及级别判断的拉活和调节系数：

```lua
-- sample.lua:
-- 已安装：根据用户级别调节系数
-- 未安装：出拉新广告

IDXU8_USER_INSTALLED = 1      -- 字节索引1：已安装态
IDXU8_USER_LEVEL = 2          -- 字节索引2：用户级别

-- 主函数：在每次用户决策时被调用
function main()
    -- 从DID数据空间获取用户信息，此处无须填写用户ID，该映射关系由sRTA平台自动处理为当前用户
    didData = srta.get_dsdata(srta.DS_DID)
    installed = didData[srta.U8][IDXU8_USER_INSTALLED] == 1 -- 是否已安装
    userLevel = didData[srta.U8][IDXU8_USER_LEVEL] == 1 -- 用户级别
    
    local results = {} -- 定义返回结果

    local targets = srta.get_targets() -- 获取所有策略ID

    for _, targetid in ipairs(targets) do
        print("installed", installed) -- 打印已安装状态。在手工调试时会输出，在正式运行时自动被禁止。

        if targetid == "active" and installed then -- 拉活策略
            if userLevel == 3 then
                results[targetid] = {
                    [srta.TARGETINFO_ENABLE] = true,
                    [srta.TARGETINFO_USER_WEIGHT_FACTOR]= 1.3 -- 高价值用户提权
                }
            elseif userLevel == 2 then
                results[targetid] = {
                    [srta.TARGETINFO_ENABLE] = true,
                    [srta.TARGETINFO_USER_WEIGHT_FACTOR]= 1.0 -- 中价值用户维持
                }
            elseif userLevel == 1 then
                results[targetid] = {
                    [srta.TARGETINFO_ENABLE] = true,
                    [srta.TARGETINFO_USER_WEIGHT_FACTOR]= 0.8 --低价值用户降权
                }
            else 
                results[targetid] = {
                    [srta.TARGETINFO_ENABLE] = true -- 其他情况不调节
                }
            end
        else if targetid=="new" and not installed then -- 拉新策略
            results[targetid] = {
                [srta.TARGETINFO_ENABLE] = true
            }
        end
    end

    return results
end
```

### 脚本：测试

本地测试脚本逻辑：

```sh
# 测试 USERID1（低价值用户）
saastool script debug -lua ./sample.lua -did 张三 -os 2

# 测试 USERID2（中等价值用户）
saastool script debug -lua ./sample.lua -did 李四 -os 2

# 测试 USERID3（高价值用户）
saastool script debug -lua ./sample.lua -did 王五 -os 2

```

### 脚本：上线

确认脚本测试无误后，上线脚本：

:::important[重要]
脚本创建后，需要 sRTA 平台管理员审批通过才可被使用 (use)
:::

```sh
# 创建脚本
saastool script create -lua ./sample.lua -name sample

# 设置为默认脚本
saastool script use -name sample
```

### 回收：效果验证

脚本上线后，可以通过以下方式验证效果：

```sh
# 查询实验数据
saastool exp get -beginday 20250101 -endday 20250131 -target active
```


## 2.2 数据底层

sRTA决策依赖数据源包括：来自于广告主的一方数据、来自于平台的二方数据、来自于服务商的三方数据。通过调用 API 或者使用 saastool 工具，可以将数据写入到 sRTA 数据存贮中。基本概念请参考[写入流程简述](#21-写入流程简述)。

### 2.2.1 一方数据

以下是一方数据存储中的结构示意.

#### 2.2.1.1 数据空间

每个账号下可以有多个数据空间，数据空间有多种类型：

* **DID存储区**：以设备号为key的存储区。设备号为OAID MD5 / CAID 20230330版 MD5。用于基于设备号的数据存储。
* **WUID存储区**：以WUID为key的存储区。用于基于 `手机号` / `OpenID` / `UnionID` 的数据存储，原始ID会在后台会转换为WUID。
* **GEO存储区**：以门店ID为key的存储区。用于基于经纬度的门店数据存储。
* **GEOIP存储区**：以行政区划码为key的存储区。用于基于IP映射城市编码的数据存储。
* **GEOFAC存储区**：以行政区划码为key的存储区。用于基于常住地城市编码的数据存储。

当数据空间容量不足时，可申请更多独立空间。

<!-- ![sRTA 存储](/img/srta_store1.png) -->

#### 2.2.1.2 数据空间内存储

每种存储区有三种类型的字段，可满足不同场景的诉求。

![sRTA 存储结构](/img/srta_store2.png)

* **uint8**：共 64 个。
* **uint32**：共 8 个。
* **flagWithExpire**：共 4 个。

#### 2.2.1.3 字段使用

每个数组的一个值可视为 `一列` 或 `一个维度`，除有特别约定的GEO区外，其他情况下每一列存贮什么内容由使用方自由发挥。

#### 2.2.1.4 使用示例

例如我们可将uint8 的第 0列用于App 的已安装状态，当该值为 1 时，即表示已安装。

![sRTA 存储结构](/img/srta_store3.png)

#### 2.2.1.5 底层存储结构示意

```c
// 仅作伪代码示意，非真实存储结构
#include <stdint.h>
#include <stdbool.h>

struct FlagWithExpire {
    bool flag;                                 // 标志位
    bool default_flag;                         // 默认值
    uint32_t expire;                           // 过期时间戳
};

struct StoreValue{
    uint8_t bytes[64];                         // byte型存储
    uint32_t uint32s[8];                       // uint32型存储
    struct FlagWithExpire flag_with_expire[4]; // flag型存储
};
```


#### 2.2.1.6 默认值
+ **uint8默认值**：0
+ **uint32默认值**：0
+ **flagWighExpire默认值**：flag = false, default_flag = false，expire = 0


### 2.2.2 二方数据

二方数据通过 srta 库函数获取。
 
#### 2.2.2.1 获取安装态
 一次可以获得多个App安装态，每个返回值为 true(已安装)/false(未安装)/nil(无权限或不可靠)中的一个状态，参考函数[srta.get_apps](./lua.md#525-srtaget_apps函数)。

### 2.2.3 三方数据

三方数据通过 srta 库函数获取，每个维度的数据均需要独立授权。某些三方数据需要收费，请与数据提供方洽淡。

#### 2.2.3.1 获取打分

一次可以获得多个模型打分，每个返回值为数字/nil(无权限或不可靠)中的一个状态，参考函数[srta.get_scores](./lua.md#526-srtaget_scores函数)。

| 编号 | 模型 | 收费模式 |
| :--- | :--- | :--- |
| 1 | 个贷意愿分 | 金融行业免费 |
| 2 | 金融质量分 | 金融行业免费 |
| 3 | 金融通过分 | 金融行业免费 |
| 4 | 金融提现分 | 金融行业免费 |
| 5 | 新版逾期分 | 金融行业免费 |
| 6 | 提现意愿分V2 | 金融行业免费 |
| 10 | 企业主资质分 | 金融行业免费 |
| 11 | 企业贷意愿分 | 金融行业免费 |
| 20 | 保险续保分 | 金融行业免费 |

## 2.3 数据写入
### 2.3.1 DID数据写入(DID区)

DID（Device ID）数据区用于存储设备维度的用户数据，支持通过设备ID（`OAID MD5` / `CAID 20230330版 MD5`）进行数据读写。本节介绍DID数据写入的完整流程。

#### 2.3.1.1 检查数据区开通状态

在写入数据前，先使用 `saastool info` 命令检查是否已开通 DID 数据区。

```sh
saastool info
```

如显示的 `dataspace` 节点下有 `did` 字段，则表明已开通 DID 数据区；若不存在，需联系管理员开通。

```json
Info res: {
  "dataspace": {
    "did": [
      "did",
      "20010101"
    ]
  },
  "targetId": []
}
```

- `"did"`: 数据空间别名，可在命令中使用此别名
- `"20010101"`: 数据空间数字ID，也可在命令中使用
- `targetId`: 已创建的策略ID列表（为空表示未创建策略）

#### 2.3.1.2 数据准备

##### **数据格式说明**

DID 数据需要准备为 **JSONL 格式**（每行一个 JSON 对象），每个 JSON 对象包含以下字段：

| 字段名 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `userid` | string | 是 | 用户设备ID的 MD5 值（32位小写） |
| `bytesKv` | object | 否 | UINT8 字段区，key 为索引（1-64），value 为数值（0-255） |
| `uint32sKv` | object | 否 | UINT32 字段区，key 为索引（1-8），value 为数值（0-4294967295） |
| `flagsWithExpireKv` | object | 否 | FLAG 标志位字段区，key 为索引（1-4），value 为标志对象 |

**FLAG 字段格式说明**：
- `{"flag": true}` - 置位为 true，永不过期
- `{"flag": false}` - 置位为 false
- `{"flag": true, "expire": 1758686629}` - 在指定 Unix 时间戳前为 true，之后为 false

##### **数据准备示例**

创建数据文件 `users.jsonl`：

```jsonl
{"userid":"cfcd208495d565ef66e7dff9f98764da","bytesKv":{"1":1,"2":100},"uint32sKv":{"1":1000000}}
{"userid":"a87ff679a2f3e71d9181a67b7542122c","bytesKv":{"1":2,"2":200},"flagsWithExpireKv":{"1":{"flag":true}}}
{"userid":"9dd4e461268c8034f5c8564e155c67a6","bytesKv":{"3":50},"uint32sKv":{"2":5000000},"flagsWithExpireKv":{"2":{"flag":true,"expire":1758686629}}}
```

**字段含义示例**：
- 第1条：用户 `cfcd2084...` 的 U8[1]=1, U8[2]=100, U32[1]=1000000
- 第2条：用户 `a87ff679...` 的 U8[1]=2, U8[2]=200, FLAG[1]=true（永久）
- 第3条：用户 `9dd4e461...` 的 U8[3]=50, U32[2]=5000000, FLAG[2]=true（在2025年9月24日12:03:49前有效）

#### 2.3.1.3 写入方法

##### **方法一：使用 saastool 命令行工具写入**

**1. 批量写入文件**

```sh
# 写入单个 JSONL 文件
saastool write -ds did -source ./users.jsonl

# 写入目录下所有 JSONL 文件
saastool write -ds did -source ./data_dir/

# 指定批处理大小（默认 10000）
saastool write -ds did -source ./users.jsonl -batchsize 5000
```

**2. 写入前清空用户数据**

使用 `-clear` 参数可在写入前清空该用户的所有字段数据：

```sh
saastool write -ds did -source ./users.jsonl -clear
```

:::warning
`-clear` 参数会清空用户的所有字段，请谨慎使用。建议仅在需要完全覆盖用户数据时使用。
:::

**3. 查看写入结果**

```sh
# 读取写入的数据进行验证
saastool read -ds did -userids cfcd208495d565ef66e7dff9f98764da
```

**返回示例**：

```json
{
  "succCmdCount": 1,
  "failCmdCount": 0,
  "cmdRes": [
    {
      "cmdIndex": 0,
      "cmdCode": "OK",
      "bytesKv": {
        "1": 1,
        "2": 100
      },
      "uint32sKv": {
        "1": 1000000
      },
      "lastModifyTime": 1709712345,
      "version": 1
    }
  ]
}
```

**字段说明**：
- `succCmdCount`: 成功读取的用户数
- `failCmdCount`: 失败的用户数
- `cmdRes[]`: 每个用户的数据
  - `bytesKv`: UINT8 字段数据
  - `uint32sKv`: UINT32 字段数据
  - `flagsWithExpireKv`: FLAG 字段数据
  - `lastModifyTime`: 最后修改时间（Unix 时间戳）
  - `version`: 数据版本号

##### **方法二：使用 API 接口写入**

通过调用 HTTP API 接口进行数据写入，适用于需要程序化集成的场景。

**1. API 请求格式**

- **请求方式**：POST
- **请求地址**：
  - 正式环境：`https://api.rta.qq.com/saas/write`
  - 演示环境：`https://srta.algo.com.cn/saas/write`
- **请求头**：
  - `Content-Type: application/x-protobuf`
  - `X-Account-ID: {账号ID}`
  - `Authorization: {Token}`
- **请求体**：protobuf 格式的 `SaasReq` 消息

**2. protobuf 请求结构**

```protobuf
message SaasReq {
    Write write = 11;
}

message Write {
    string dataspace_id = 1;           // 数据空间ID，填 "did"
    bool is_clear_all_first = 3;       // 是否先清空该用户所有数据
    repeated WriteItem write_items = 4; // 批量写入命令
}

message WriteItem {
    string userid = 1;                 // 用户ID（设备ID的MD5）
    map<uint32, uint32> bytes_kv = 5;  // UINT8 字段区
    map<uint32, uint32> uint32s_kv = 6; // UINT32 字段区
    map<uint32, FlagWithExpire> flags_with_expire_kv = 7; // FLAG 字段区
}
```

**3. Go 示例代码**

使用 saastool 中已实现的 `saashttp.SaasClient` 客户端进行写入（推荐方式）：

```go
package main

import (
    "fmt"
    "net/http"
    
    "git.algo.com.cn/public/saasapi"
    "git.algo.com.cn/public/saasapi/pkg/saashttp"
)

func main() {
    // 初始化 API URLs（演示环境）
    apiUrls := saashttp.InitAPIUrl(&saashttp.ApiUrlsCfg{
        BaseUrl: "https://srta.algo.com.cn", // 演示环境
        // 正式环境请使用: "https://api.rta.qq.com"
    })
    
    // 创建 SaasClient
    client := &saashttp.SaasClient{
        Client:  &http.Client{},
        ApiUrls: apiUrls,
        Auth: &saashttp.Auth{
            Account: "2000",           // 账号 ID
            Token:   "your_token_here", // Token
        },
    }
    
    // 构造写入请求
    req := &saasapi.SaasReq{
        Cmd: &saasapi.SaasReq_Write{
            Write: &saasapi.Write{
                DataspaceId:     "did",
                IsClearAllFirst: false,
                WriteItems: []*saasapi.WriteItem{
                    {
                        Userid: "cfcd208495d565ef66e7dff9f98764da",
                        BytesKv: map[uint32]uint32{
                            1: 1,
                            2: 100,
                        },
                        Uint32SKv: map[uint32]uint32{
                            1: 1000000,
                        },
                    },
                    {
                        Userid: "a87ff679a2f3e71d9181a67b7542122c",
                        BytesKv: map[uint32]uint32{
                            1: 2,
                            2: 200,
                        },
                        FlagsWithExpireKv: map[uint32]*saasapi.FlagWithExpire{
                            1: {Flag: true},
                        },
                    },
                },
            },
        },
    }
    
    // 调用 Write 方法
    res, err := client.Write(req)
    if err != nil {
        fmt.Printf("写入失败: %v\n", err)
        return
    }
    
    // 处理响应
    if res.Code == saasapi.ErrorCode_SUCC {
        fmt.Println("写入成功")
        if len(res.GetWriteRes().GetFailedUserid()) > 0 {
            fmt.Printf("部分用户写入失败: %v\n", res.GetWriteRes().GetFailedUserid())
        }
    } else {
        fmt.Printf("写入失败: code=%v, status=%s\n", res.Code, res.Status)
    }
}
```

**代码说明**：

1. **使用 saashttp 包**：`git.algo.com.cn/public/saasapi/pkg/saashttp` 提供了完整的客户端实现
2. **SaasClient 封装**：
   - `ApiUrls`：API 地址配置（自动处理 `/saas/write` 等路径）
   - `Auth`：认证信息（自动处理鉴权签名）
   - `Client`：HTTP 客户端
3. **Write 方法**：自动完成序列化、请求发送、响应解析等操作
4. **错误处理**：返回 `(res, err)` 两个值，需分别检查网络错误和业务错误

**优势**：
- ✅ 无需手动处理 HTTP 请求/响应
- ✅ 无需手动计算鉴权签名（自动处理 MD5 签名）
- ✅ 自动处理 protobuf 序列化/反序列化
- ✅ 复用 saastool 已验证的代码
- ✅ 支持所有 API 接口（Read、TaskCreate、TaskUpload 等）

##### **方法三：使用 saastool HTTP daemon 模式**

saastool 支持以 HTTP 服务模式运行，提供简单的 HTTP 接口进行数据读写。

**1. 启动 daemon 服务**

```sh
# 设置环境变量
export SRTA_ACCOUNT=2000
export SRTA_TOKEN=your_token_here
export SRTA_ENV=demo  # 或 prd
export SRTA_PORT=8080

# 启动 daemon
saastool daemon
```

**2. 单个用户写入（GET 请求）**

```sh
# 写入单个用户数据
curl "http://localhost:8080/write?ds=did&userid=cfcd208495d565ef66e7dff9f98764da&u8.1=10&u8.2=100&u32.1=1000000"

# 写入前先清空
curl "http://localhost:8080/write?ds=did&userid=cfcd208495d565ef66e7dff9f98764da&u8.1=10&u32.1=1000000&clear=true"

# 写入 FLAG 字段
curl "http://localhost:8080/write?ds=did&userid=cfcd208495d565ef66e7dff9f98764da&flag.1=true&flag.2=1758686629&flag.3=!3600"
```

**FLAG 字段格式说明**：
- `flag.1=true` 或 `flag.1=false` - 永久有效的标志位
- `flag.2=1758686629` - 在指定 Unix 时间戳前为 true
- `flag.3=!3600` - 在当前时间 + 3600 秒前为 true

**3. 批量写入（POST 请求）**

```sh
curl -X POST "http://localhost:8080/write?ds=did" \
  -H "Content-Type: text/plain" \
  -d "userid=cfcd208495d565ef66e7dff9f98764da&u8.1=10&u32.1=1000000" \
  -d "userid=a87ff679a2f3e71d9181a67b7542122c&u8.1=60&flag.2=true" \
  -d "userid=9dd4e461268c8034f5c8564e155c67a6&u8.2=200&u32.6=1000000&flag.3=!3600"
```

##### **方法四：使用 Task 任务批量写入（推荐大数据量）**

Task 任务模式用于**亿级用户数据的批量写入**，具有并发写入量大、支持断点续传、批量集中执行的特点。**适用于千万级以上的数据写入场景**。

**适用场景**：
- 数据量 ≥ 1000万条记录
- 需要批量更新大量用户的字段数据
- 需要断点续传支持（网络不稳定环境）
- 定期全量数据更新

**优势**：
- 支持大数据量（亿级）批量写入
- 支持分块上传和断点续传
- 可并发上传多个分块，提升效率
- 自动去重（相同 SHA256 的分块无需重复上传）
- 任务执行状态可查询

**完整流程**：

**步骤1：准备数据文件**

数据格式与方法一相同，准备 JSONL 格式的数据文件：

```jsonl
{"userid":"cfcd208495d565ef66e7dff9f98764da","bytesKv":{"1":1,"2":100},"uint32sKv":{"1":1000000}}
{"userid":"a87ff679a2f3e71d9181a67b7542122c","bytesKv":{"1":2,"2":200},"flagsWithExpireKv":{"1":{"flag":true}}}
{"userid":"9dd4e461268c8034f5c8564e155c67a6","bytesKv":{"3":50},"uint32sKv":{"2":5000000},"flagsWithExpireKv":{"2":{"flag":true,"expire":1758686629}}}
```

**步骤2：生成任务元数据文件（Make）**

使用 `saastool task make` 命令扫描数据文件，计算分块 SHA256，生成任务元数据文件：

```sh
# 为单个文件生成任务元数据
saastool task make \
  -source ./users.jsonl \
  -hash ./task.json \
  -ds did \
  -blocksize 200M \
  -desc "DID用户数据批量写入任务"

# 为目录下所有文件生成任务元数据
saastool task make \
  -source ./data_dir/ \
  -hash ./task.json \
  -ds did \
  -blocksize 200M \
  -desc "DID批量数据导入"
```

**参数说明**：
- `-source`：数据源路径（文件或目录）
- `-hash`：输出的任务元数据文件路径（JSON 格式）
- `-ds`：数据空间 ID（did 或 wuid）
- `-blocksize`：分块大小（10M-200M，推荐 200M）
- `-desc`：任务描述（可选）
- `-appid`：微信 AppID（仅 wuid 数据区需要，可选）
- `-accountid`：账号 ID（wuid + appid 时必填）
- `-hashtype`：哈希类型（wuid 专用，1=PHONE_MD5, 2=PHONE_SHA256）

**步骤3：创建任务（Create）**

将任务元数据文件提交到服务器，创建任务：

```sh
saastool task create -hash ./task.json
```

返回示例：

```json
{
  "dataspaceId": "did",
  "taskSha256": "a1b2c3d4e5f67890abcdef1234567890abcdef1234567890abcdef1234567890",
  "taskDescription": "DID用户数据批量写入任务",
  "taskFileInfos": [
    {
      "fileName": "users.jsonl",
      "fileSize": "52428800",
      "fileBlocks": [
        {
          "blockSha256": "abc123def456...",
          "blockLength": "52428800",
          "uploaded": false
        }
      ]
    }
  ],
  "taskBlockSize": "52428800",
  "sourcePath": "./users.jsonl",
  "taskSize": "52428800",
  "createTime": "2025-03-06T10:00:00Z",
  "status": "WAITING",
  "totalBlock": 1
}
```

**字段说明**：
- `taskSha256`：任务的唯一标识（SHA256 哈希值）
- `dataspaceId`：数据空间 ID
- `status`：任务状态（`WAITING` = 等待上传）
- `totalBlock`：总分块数
- `taskFileInfos[].fileBlocks[].uploaded`：该分块是否已上传（`false` 表示需要上传）
- `createTime`：任务创建时间

**步骤4：上传数据分块（Upload）**

将数据文件的各个分块上传到服务器（支持并发上传）：

```sh
saastool task upload -sha256 a1b2c3d4e5f6...
```

:::tip
- 上传前会自动检查分块是否已存在，已上传的分块会跳过（断点续传）
- 数据会自动使用 gzip 压缩，减少网络传输
- 支持并发上传多个分块，加快上传速度
:::

**步骤5：执行任务（Run）**

所有分块上传完成后，执行任务将数据写入数据区：

```sh
saastool task run -sha256 a1b2c3d4e5f67890abcdef1234567890abcdef1234567890abcdef1234567890
```

**返回示例**：

```
task run success {"code":"SUCC","taskRunRes":{"dataspaceId":"did","taskSha256":"a1b2c3d4e5f67890abcdef1234567890abcdef1234567890abcdef1234567890","status":"RUNNING","createTime":"2025-03-06T10:00:00Z","runTime":"2025-03-06T11:00:00Z"}}
```

任务提交成功后，状态变为 `RUNNING`（运行中）。

:::warning
- 同一时间只能执行一个任务
- 如果有任务正在运行，新任务会自动进入队列等待
- 任务执行期间无法调用实时写入接口
:::

**步骤6：查询任务状态**

查看任务执行状态和进度：

```sh
# 查看所有任务列表
saastool task list

# 查看特定任务详情
saastool task info -sha256 a1b2c3d4e5f67890abcdef1234567890abcdef1234567890abcdef1234567890

# 筛选特定状态的任务
saastool task list -status running   # 运行中
saastool task list -status success   # 成功
saastool task list -status fail      # 失败
```

**task list 返回示例**：

```json
task res: {
  "tasks": [
    {
      "dataspaceId": "did",
      "taskSha256": "a1b2c3d4e5f67890abcdef1234567890abcdef1234567890abcdef1234567890",
      "taskDescription": "DID用户数据批量写入任务",
      "taskBlockSize": "209715200",
      "taskSize": "524288000",
      "createTime": "2025-03-06T10:00:00Z",
      "status": "WAITING",
      "totalBlock": 3
    },
    {
      "dataspaceId": "did",
      "taskSha256": "b2c3d4e5f67890abcdef1234567890abcdef1234567890abcdef1234567890ab",
      "taskDescription": "历史数据导入",
      "taskBlockSize": "209715200",
      "taskSize": "104857600",
      "createTime": "2025-03-05T15:30:00Z",
      "runTime": "2025-03-05T16:00:00Z",
      "finishTime": "2025-03-05T17:00:00Z",
      "status": "SUCCESS",
      "totalBlock": 1
    }
  ]
}
```

**task info 返回示例**：

```json
task res: {
  "dataspaceId": "did",
  "taskSha256": "a1b2c3d4e5f67890abcdef1234567890abcdef1234567890abcdef1234567890",
  "taskDescription": "DID用户数据批量写入任务",
  "taskFileInfos": [
    {
      "fileName": "users.jsonl",
      "fileSize": "52428800",
      "fileBlocks": [
        {
          "blockSha256": "abc123def456...",
          "blockLength": "52428800",
          "uploaded": true
        }
      ]
    }
  ],
  "taskBlockSize": "52428800",
  "sourcePath": "./users.jsonl",
  "taskSize": "52428800",
  "createTime": "2025-03-06T10:00:00Z",
  "status": "READY",
  "totalBlock": 1
}
```

任务状态说明：
- `WAITING (1)`：等待上传，已创建但分块未全部上传
- `READY (2)`：上传完毕，等待执行
- `RUNNING (3)`：运行中，正在写入数据
- `SUCCESS (4)`：执行成功
- `FAIL (5)`：执行失败

**步骤7：删除任务（可选）**

删除不需要的任务（成功或失败的任务）：

```sh
saastool task delete -sha256 a1b2c3d4e5f67890abcdef1234567890abcdef1234567890abcdef1234567890
```

**返回示例**：

```json
task res: {
  "dataspaceId": "did",
  "taskSha256": "a1b2c3d4e5f67890abcdef1234567890abcdef1234567890abcdef1234567890",
  "status": "DELETED"
}
```

:::info
- 新创建的任务会在 7 天内自动删除（如未执行）
- 成功或失败的任务建议手动删除，释放存储空间
- 正在运行的任务会先中断再删除
:::

**完整示例脚本**：

```bash
#!/bin/bash

# 1. 准备数据（假设已有 data/ 目录下的 JSONL 文件）

# 2. 生成任务元数据
echo "Step 1: 生成任务元数据..."
saastool task make \
  -source ./data/ \
  -hash ./task.json \
  -ds did \
  -blocksize 200M \
  -desc "$(date +%Y%m%d) DID数据批量导入"

# 3. 创建任务
echo "Step 2: 创建任务..."
TASK_SHA256=$(saastool task create -hash ./task.json | grep -oP 'taskSha256":\s*"\K[^"]+')
echo "任务SHA256: $TASK_SHA256"

# 4. 上传分块
echo "Step 3: 上传数据分块..."
saastool task upload -sha256 $TASK_SHA256

# 5. 执行任务
echo "Step 4: 执行任务..."
saastool task run -sha256 $TASK_SHA256

# 6. 循环查询任务状态，直到完成
echo "Step 5: 监控任务执行..."
while true; do
    STATUS=$(saastool task info -sha256 $TASK_SHA256 | grep -oP 'status":\s*"\K[^"]+')
    echo "当前状态: $STATUS"
    
    if [ "$STATUS" == "SUCCESS" ]; then
        echo "✅ 任务执行成功！"
        break
    elif [ "$STATUS" == "FAIL" ]; then
        echo "❌ 任务执行失败！"
        saastool task info -sha256 $TASK_SHA256
        exit 1
    fi
    
    sleep 10
done

# 7. 可选：删除任务
echo "Step 6: 删除任务..."
saastool task delete -sha256 $TASK_SHA256

echo "✅ 所有步骤完成！"
```

**API 方式调用**：

Task 模式也支持通过 API 调用，主要接口如下：

| 接口 | 路径 | 说明 |
| --- | --- | --- |
| 创建任务 | `/saas/task/create` | 提交任务元数据 |
| 上传分块 | `/saas/task/upload` | 上传数据分块（需 gzip 压缩） |
| 执行任务 | `/saas/task/run` | 开始执行写入 |
| 查询列表 | `/saas/task/list` | 列出所有任务 |
| 查询详情 | `/saas/task/info` | 获取任务详细信息 |
| 删除任务 | `/saas/task/delete` | 删除指定任务 |

详细的 API 调用格式请参考 [API 文档 - 任务管理](api.md#315-任务)。

**Task 模式注意事项**：

1. **分块大小选择**：
   - 推荐使用 200M 分块大小（默认值）
   - 分块大小范围：10M-200M
   - 文件最后一个分块可能小于设定的分块大小

2. **并发上传优化**：
   - 可以并发上传多个分块，显著提升上传效率
   - 建议并发数：4-8 个线程
   - 上传前先调用 `/saas/task/info` 检查 `uploaded` 状态，跳过已上传的分块

3. **任务执行限制**：
   - 同一时间只能运行一个任务
   - 任务运行期间，实时写入接口（`/saas/write`）会被阻塞
   - 任务执行时间取决于数据量（亿级数据约需数小时）

4. **数据格式要求**：
   - 数据文件必须是 JSONL 格式（每行一个 JSON 对象）
   - JSON 格式与实时写入的 `WriteItem` 结构完全一致
   - 支持 `bytesKv`、`uint32sKv`、`flagsWithExpireKv` 三种字段类型

5. **任务清理**：
   - 未上传完成的任务会在 7 天后自动删除
   - 成功或失败的任务建议手动删除
   - 可通过 `/saas/task/list` 定期清理过期任务

#### 2.3.1.5 数据验证

写入完成后，建议进行数据验证：

```sh
# 读取验证
saastool read -ds did -userids cfcd208495d565ef66e7dff9f98764da

# 或使用 HTTP daemon
curl "http://localhost:8080/read?ds=did&userid=cfcd208495d565ef66e7dff9f98764da"
```

#### 2.3.1.6 写入方法对比

| 对比项 | 方法一：CLI 工具 | 方法二：API 接口 | 方法三：HTTP Daemon | 方法四：Task 任务 |
| --- | --- | --- | --- | --- |
| **适用场景** | 小批量数据、脚本自动化 | 程序集成、实时写入 | 轻量级 HTTP 服务 | 大批量数据（千万级+） |
| **数据量级** | < 100万 | < 1000万 | < 100万 | ≥ 1000万（亿级） |
| **写入速度** | 中等 | 快速 | 快速 | 最快（批量并发） |
| **断点续传** | 不支持 | 不支持 | 不支持 | **支持** |
| **并发能力** | 顺序执行 | 支持并发请求 | 支持并发请求 | **支持分块并发上传** |
| **网络要求** | 一般 | 较高 | 一般 | **较低（支持重传）** |
| **技术门槛** | 低（命令行） | 高（需编程） | 中（HTTP 调用） | 中（命令行+流程） |
| **实时性** | 实时 | 实时 | 实时 | 异步（需执行任务） |
| **推荐使用** | 开发测试、小批量 | 生产环境实时更新 | 快速原型、测试 | 大批量全量导入 |

**选择建议**：
- 日常测试、小批量数据 → **方法一（CLI）**
- 程序集成、实时数据更新 → **方法二（API）**
- 快速验证、轻量级服务 → **方法三（Daemon）**
- 千万级以上大批量数据 → **方法四（Task）**

#### 2.3.1.7 注意事项

1. **用户ID格式**：DID 数据区的 `userid` 必须是设备ID的 MD5 值（32位小写十六进制字符串）
2. **字段索引范围**：
   - UINT8 字段：索引 1-64，值范围 0-255
   - UINT32 字段：索引 1-8，值范围 0-4294967295
   - FLAG 字段：索引 1-4，值为布尔型
3. **批处理大小**：实时写入建议单次不超过 10000 条记录，大批量数据建议使用 Task 模式
4. **过期时间**：FLAG 字段支持设置过期时间，过期后自动变为 false
5. **增量写入**：默认为增量写入（覆盖指定字段），使用 `-clear` 参数可先清空再写入
6. **失败重试**：API 返回失败的 `userid` 列表，建议对失败的数据进行重试
7. **写入互斥**：Task 任务运行期间，实时写入接口会被阻塞，需等任务完成

#### 2.3.1.8 最佳实践

1. **数据分批**：
   - 实时写入：每批不超过 10000 条记录
   - Task 写入：大批量数据建议使用 Task 模式，单个分块 200M
2. **错误处理**：API 调用时务必检查返回的 `failed_userid`，对失败的记录进行重试或记录日志
3. **过期策略**：合理使用 FLAG 字段的过期时间，避免过期数据占用存储空间
4. **字段规划**：提前规划好字段索引的用途，避免后期混乱（建议维护字段索引文档）
5. **测试验证**：生产环境写入前，建议先在演示环境（demo）进行测试验证
6. **任务管理**：
   - 定期清理已完成的 Task 任务，释放存储空间
   - 大批量数据更新建议在业务低峰期执行
   - 使用监控脚本跟踪任务执行状态

### 2.3.2 手机号数据写入(WUID区)

WUID（WeChat User ID）数据区用于存储基于**手机号**的用户数据。与 DID 数据区不同，WUID 数据区需要提供手机号的哈希值（MD5 或 SHA256）作为用户标识。本节介绍手机号数据写入的完整流程。

#### 2.3.2.1 检查数据区开通状态

在写入数据前，先使用 `saastool info` 命令检查是否已开通 WUID 数据区。

```sh
saastool info
```

如显示的 `dataspace` 节点下有 `wuid` 字段，则表明已开通 WUID 数据区；若不存在，需联系管理员开通。

```json
Info res: {
  "dataspace": {
    "wuid": [
      "wuid",
      "20010201"
    ]
  },
  "targetId": []
}
```

- `"wuid"`: 数据空间别名
- `"20010201"`: 数据空间数字ID

:::warning 重要警告：字段索引规划

手机号数据和 OpenID 数据**共用同一个 WUID 数据区**，因此必须提前规划好字段索引编号，避免不同数据类型使用相同的索引导致数据覆盖冲突！

**字段索引范围**：
- UINT8 字段：索引 1-64
- UINT32 字段：索引 1-8
- FLAG 字段：索引 1-4

**规划建议示例**：
- 手机号数据：U8[1-32], U32[1-4], FLAG[1-2]
- OpenID 数据：U8[33-64], U32[5-8], FLAG[3-4]

**后果说明**：
- 如果手机号数据和 OpenID 数据都使用 U8[1]，后写入的数据会覆盖先写入的数据
- 字段覆盖不会有错误提示，但会导致数据丢失或混乱
- **务必在项目初期做好字段索引分配规划，并在团队内文档化**

:::

#### 2.3.2.2 数据准备

##### **数据格式说明**

WUID 数据需要准备为 **JSONL 格式**，每个 JSON 对象包含以下字段：

| 字段名 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `userid` | string | 是 | 手机号的哈希值（MD5 或 SHA256） |
| `bytesKv` | object | 否 | UINT8 字段区，key 为索引（1-64），value 为数值（0-255） |
| `uint32sKv` | object | 否 | UINT32 字段区，key 为索引（1-8），value 为数值（0-4294967295） |
| `flagsWithExpireKv` | object | 否 | FLAG 标志位字段区，key 为索引（1-4），value 为标志对象 |

**手机号哈希计算方式**：
- **MD5**：对手机号（不含空格、横杠等分隔符）计算 MD5 值，取小写32位十六进制字符串
  - 示例：`13800138000` → `e10adc3949ba59abbe56e057f20f883e`（示例值）
- **SHA256**：对手机号计算 SHA256 值，取小写64位十六进制字符串
  - 示例：`13800138000` → `5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8`（示例值）

##### **数据准备示例**

创建数据文件 `users_phone.jsonl`：

```jsonl
{"userid":"e10adc3949ba59abbe56e057f20f883e","bytesKv":{"1":1,"2":100},"uint32sKv":{"1":1000000}}
{"userid":"c33367701511b4f6020ec61ded352059","bytesKv":{"1":2,"2":200},"flagsWithExpireKv":{"1":{"flag":true}}}
{"userid":"5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8","bytesKv":{"3":50},"uint32sKv":{"2":5000000},"flagsWithExpireKv":{"2":{"flag":true,"expire":1758686629}}}
```

**字段含义示例**：
- 第1条：手机号MD5为 `e10adc3...` 的用户，U8[1]=1, U8[2]=100, U32[1]=1000000
- 第2条：手机号MD5为 `c333677...` 的用户，U8[1]=2, U8[2]=200, FLAG[1]=true（永久）
- 第3条：手机号SHA256为 `5e88489...` 的用户，U8[3]=50, U32[2]=5000000, FLAG[2]=true（在2025年9月24日前有效）

#### 2.3.2.3 写入方法

##### **方法一：使用 saastool 命令行工具写入（手机号哈希）**

**1. 批量写入文件**

```sh
# 写入手机号MD5数据
saastool write -ds wuid -source ./users_phone.jsonl -hashtype 1

# 写入手机号SHA256数据
saastool write -ds wuid -source ./users_phone.jsonl -hashtype 2

# 指定批处理大小
saastool write -ds wuid -source ./users_phone.jsonl -hashtype 1 -batchsize 5000
```

**参数说明**：
- `-ds wuid`：指定数据空间为 WUID
- `-hashtype`：**必填**，指定哈希类型
  - `1`：手机号 MD5
  - `2`：手机号 SHA256

**2. 写入前清空用户数据**

```sh
saastool write -ds wuid -source ./users_phone.jsonl -hashtype 1 -clear
```

**3. 查看写入结果**

```sh
# 读取写入的数据进行验证
saastool read -ds wuid -userids e10adc3949ba59abbe56e057f20f883e -hashtype 1
```

##### **方法二：使用 API 接口写入（手机号哈希）**

**Go 示例代码**：

```go
package main

import (
    "fmt"
    "net/http"
    
    "git.algo.com.cn/public/saasapi"
    "git.algo.com.cn/public/saasapi/pkg/saashttp"
)

func main() {
    apiUrls := saashttp.InitAPIUrl(&saashttp.ApiUrlsCfg{
        BaseUrl: "https://srta.algo.com.cn",
    })
    
    client := &saashttp.SaasClient{
        Client:  &http.Client{},
        ApiUrls: apiUrls,
        Auth: &saashttp.Auth{
            Account: "2000",
            Token:   "your_token_here",
        },
    }
    
    // 构造写入请求（手机号MD5）
    req := &saasapi.SaasReq{
        Cmd: &saasapi.SaasReq_Write{
            Write: &saasapi.Write{
                DataspaceId:     "wuid",
                HashType:        saasapi.HashType_PHONE_MD5, // 手机号MD5
                IsClearAllFirst: false,
                WriteItems: []*saasapi.WriteItem{
                    {
                        Userid: "e10adc3949ba59abbe56e057f20f883e", // 手机号MD5值
                        BytesKv: map[uint32]uint32{
                            1: 1,
                            2: 100,
                        },
                        Uint32SKv: map[uint32]uint32{
                            1: 1000000,
                        },
                    },
                },
            },
        },
    }
    
    res, err := client.Write(req)
    if err != nil {
        fmt.Printf("写入失败: %v\n", err)
        return
    }
    
    if res.Code == saasapi.ErrorCode_SUCC {
        fmt.Println("写入成功")
    } else {
        fmt.Printf("写入失败: code=%v, status=%s\n", res.Code, res.Status)
    }
}
```

**重要说明**：
- 使用 WUID 数据区时，必须指定 `hash_type` 参数
- `hash_type` 可选值：
  - `saasapi.HashType_PHONE_MD5` (1)：手机号 MD5
  - `saasapi.HashType_PHONE_SHA256` (2)：手机号 SHA256

##### **方法三：使用 Task 任务批量写入（推荐大数据量）**

适用于千万级以上手机号数据的批量写入场景。

**完整流程**：

**步骤1：准备数据文件**

```jsonl
{"userid":"e10adc3949ba59abbe56e057f20f883e","bytesKv":{"1":1,"2":100},"uint32sKv":{"1":1000000}}
{"userid":"c33367701511b4f6020ec61ded352059","bytesKv":{"1":2,"2":200},"flagsWithExpireKv":{"1":{"flag":true}}}
```

**步骤2：生成任务元数据文件（Make）**

```sh
# 为手机号MD5数据生成任务元数据
saastool task make \
  -source ./users_phone.jsonl \
  -hash ./task_phone.json \
  -ds wuid \
  -hashtype 1 \
  -blocksize 200M \
  -desc "手机号数据批量写入任务"

# 为手机号SHA256数据生成任务元数据
saastool task make \
  -source ./users_phone.jsonl \
  -hash ./task_phone.json \
  -ds wuid \
  -hashtype 2 \
  -blocksize 200M \
  -desc "手机号SHA256数据批量写入"
```

**参数说明**：
- `-ds wuid`：指定数据空间为 WUID
- `-hashtype`：**必填**，指定哈希类型（1=PHONE_MD5, 2=PHONE_SHA256）

**步骤3-7：后续步骤与 DID 数据区相同**

```sh
# 3. 创建任务
saastool task create -hash ./task_phone.json

# 4. 上传数据分块
saastool task upload -sha256 <task_sha256>

# 5. 执行任务
saastool task run -sha256 <task_sha256>

# 6. 查询任务状态
saastool task info -sha256 <task_sha256>

# 7. 删除任务（可选）
saastool task delete -sha256 <task_sha256>
```

#### 2.3.2.4 注意事项

1. **用户ID格式**：
   - 必须是手机号的哈希值（MD5 或 SHA256）
   - MD5：32位小写十六进制字符串
   - SHA256：64位小写十六进制字符串
   - 手机号格式：去除所有分隔符和空格（如 `13800138000`，不是 `138-0013-8000`）

2. **哈希类型必填**：
   - CLI 工具：必须使用 `-hashtype` 参数（1=MD5, 2=SHA256）
   - API 调用：必须设置 `hash_type` 字段
   - Task 模式：必须在 `task make` 时指定 `-hashtype`

3. **⚠️ 字段索引冲突风险**：
   - **手机号数据与 OpenID 数据共用 WUID 区**，字段索引必须避免冲突
   - UINT8 字段：索引 1-64，值范围 0-255
   - UINT32 字段：索引 1-8，值范围 0-4294967295
   - FLAG 字段：索引 1-4，值为布尔型
   - **示例**：如果手机号使用 U8[1-32]，则 OpenID 应使用 U8[33-64]
   - **后果**：索引重复会导致后写入的数据覆盖先写入的数据，且无错误提示
   - **建议**：在项目配置文档中明确记录各数据类型的字段索引分配方案
   - FLAG 字段：索引 1-4，值为布尔型

4. **哈希一致性**：
   - 写入和读取时必须使用相同的哈希类型
   - 建议在项目中统一使用 MD5 或 SHA256

5. **隐私保护**：
   - 手机号哈希后无法反推原始手机号
   - 建议在客户端完成哈希计算，避免明文传输

#### 2.3.2.5 写入方法对比

| 对比项 | CLI 工具 | API 接口 | Task 任务 |
| --- | --- | --- | --- |
| **适用场景** | 小批量数据、脚本自动化 | 程序集成、实时写入 | 大批量数据（千万级+） |
| **数据量级** | < 100万 | < 1000万 | ≥ 1000万（亿级） |
| **hashtype 指定** | 命令行参数 | API 字段 | task make 参数 |

#### 2.3.2.6 最佳实践

1. **字段索引规划**（**最重要**）：
   - **务必在项目初期规划好手机号和 OpenID 的字段索引分配**
   - 建议创建字段索引分配表并在团队内共享
   - 示例分配方案：
     ```
     手机号数据：
       - U8[1-32]: 用户基础属性（如：等级、状态、标签）
       - U32[1-4]: 用户行为统计（如：购买次数、积分）
       - FLAG[1-2]: 用户标志位（如：是否VIP、是否活跃）
     
     OpenID 数据：
       - U8[33-64]: 微信场景属性（如：订阅状态、小程序权限）
       - U32[5-8]: 微信行为统计（如：分享次数、访问次数）
       - FLAG[3-4]: 微信标志位（如：是否关注公众号）
     ```
   - 避免后期调整索引导致数据迁移成本高

2. **哈希类型选择**：
   - 优先使用 MD5（计算更快，字符串更短）
   - 安全要求高的场景可使用 SHA256
   - 全项目统一使用一种哈希类型

3. **手机号格式统一**：
   - 去除国家代码（如 `+86`）
   - 去除所有分隔符和空格
   - 统一使用11位纯数字格式

4. **数据验证**：
   - 写入前验证手机号格式
   - 写入后使用 `read` 命令验证数据正确性
   - 检查 `failed_userid` 并重试失败的记录

### 2.3.3 OpenID数据写入(WUID区)

WUID 数据区除了支持手机号数据外，还支持基于**微信 OpenID / UnionID**的用户数据写入。本节介绍如何通过微信小程序/公众号/视频号的 OpenID 进行数据写入。

#### 2.3.3.1 检查数据区开通状态

在写入数据前，先使用 `saastool info` 命令检查是否已开通 WUID 数据区。

```sh
saastool info
```

如显示的 `dataspace` 节点下有 `wuid` 字段，则表明已开通 WUID 数据区；若不存在，需联系管理员开通。

```json
Info res: {
  "dataspace": {
    "wuid": [
      "wuid",
      "20010201"
    ]
  },
  "targetId": []
}
```

- `"wuid"`: 数据空间别名
- `"20010201"`: 数据空间数字ID

:::warning 重要警告：字段索引规划

OpenID 数据和手机号数据**共用同一个 WUID 数据区**，因此必须提前规划好字段索引编号，避免不同数据类型使用相同的索引导致数据覆盖冲突！

**字段索引范围**：
- UINT8 字段：索引 1-64
- UINT32 字段：索引 1-8
- FLAG 字段：索引 1-4

**规划建议示例**：
- 手机号数据：U8[1-32], U32[1-4], FLAG[1-2]
- OpenID 数据：U8[33-64], U32[5-8], FLAG[3-4]

**后果说明**：
- 如果手机号数据和 OpenID 数据都使用 U8[1]，后写入的数据会覆盖先写入的数据
- 字段覆盖不会有错误提示，但会导致数据丢失或混乱
- **务必在项目初期做好字段索引分配规划，并在团队内文档化**

:::

#### 2.3.3.2 数据准备

##### **数据格式说明**

OpenID 数据需要准备为 **JSONL 格式**，每个 JSON 对象包含以下字段：

| 字段名 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `userid` | string | 是 | 微信 OpenID 或 UnionID（原始值，无需哈希） |
| `bytesKv` | object | 否 | UINT8 字段区，key 为索引（1-64），value 为数值（0-255） |
| `uint32sKv` | object | 否 | UINT32 字段区，key 为索引（1-8），value 为数值（0-4294967295） |
| `flagsWithExpireKv` | object | 否 | FLAG 标志位字段区，key 为索引（1-4），value 为标志对象 |

**OpenID 与 UnionID 说明**：
- **OpenID**：微信小程序/公众号/视频号的用户唯一标识，不同应用下同一用户的 OpenID 不同
- **UnionID**：微信开放平台账号下的用户唯一标识，同一用户在不同应用下 UnionID 相同
- **格式**：原始字符串，无需进行任何哈希处理
- **示例**：
  - OpenID：`oUpF8uMuAJO_M2pxb1Q9zNjWeS6o`
  - UnionID：`o6_bmasdasdsad6_2sgVt7hMZOPfL`

##### **数据准备示例**

创建数据文件 `users_openid.jsonl`：

```jsonl
{"userid":"oUpF8uMuAJO_M2pxb1Q9zNjWeS6o","bytesKv":{"1":1,"2":100},"uint32sKv":{"1":1000000}}
{"userid":"oUpF8uMuAJO_M2pxb1Q9zNjWeS6p","bytesKv":{"1":2,"2":200},"flagsWithExpireKv":{"1":{"flag":true}}}
{"userid":"o6_bmasdasdsad6_2sgVt7hMZOPfL","bytesKv":{"3":50},"uint32sKv":{"2":5000000},"flagsWithExpireKv":{"2":{"flag":true,"expire":1758686629}}}
```

**字段含义示例**：
- 第1条：OpenID 为 `oUpF8u...` 的用户，U8[1]=1, U8[2]=100, U32[1]=1000000
- 第2条：OpenID 为 `oUpF8u...` 的用户，U8[1]=2, U8[2]=200, FLAG[1]=true（永久）
- 第3条：UnionID 为 `o6_bma...` 的用户，U8[3]=50, U32[2]=5000000, FLAG[2]=true（在2025年9月24日前有效）

#### 2.3.3.3 写入方法

##### **方法一：使用 saastool 命令行工具写入（OpenID）**

**1. 批量写入文件**

```sh
# 写入 OpenID 数据（需指定 AppID 和账号ID）
saastool write \
  -ds wuid \
  -source ./users_openid.jsonl \
  -appid wx1234567890abcdef \
  -accountid 2000

# 指定批处理大小
saastool write \
  -ds wuid \
  -source ./users_openid.jsonl \
  -appid wx1234567890abcdef \
  -accountid 2000 \
  -batchsize 5000
```

**参数说明**：
- `-ds wuid`：指定数据空间为 WUID
- `-appid`：**必填**，微信小程序/公众号/视频号的 AppID
- `-accountid`：**必填**，广告主账号 ID（与 AppID 配对使用）

**2. 写入前清空用户数据**

```sh
saastool write \
  -ds wuid \
  -source ./users_openid.jsonl \
  -appid wx1234567890abcdef \
  -accountid 2000 \
  -clear
```

**3. 查看写入结果**

```sh
# 读取写入的数据进行验证
saastool read \
  -ds wuid \
  -userids oUpF8uMuAJO_M2pxb1Q9zNjWeS6o \
  -appid wx1234567890abcdef \
  -accountid 2000
```

##### **方法二：使用 API 接口写入（OpenID）**

**Go 示例代码**：

```go
package main

import (
    "fmt"
    "net/http"
    
    "git.algo.com.cn/public/saasapi"
    "git.algo.com.cn/public/saasapi/pkg/saashttp"
)

func main() {
    apiUrls := saashttp.InitAPIUrl(&saashttp.ApiUrlsCfg{
        BaseUrl: "https://srta.algo.com.cn",
    })
    
    client := &saashttp.SaasClient{
        Client:  &http.Client{},
        ApiUrls: apiUrls,
        Auth: &saashttp.Auth{
            Account: "2000",
            Token:   "your_token_here",
        },
    }
    
    // 构造写入请求（OpenID）
    req := &saasapi.SaasReq{
        Cmd: &saasapi.SaasReq_Write{
            Write: &saasapi.Write{
                DataspaceId:     "wuid",
                Appid:           "wx1234567890abcdef", // 微信 AppID
                AccountId:       2000,                  // 广告主账号ID
                IsClearAllFirst: false,
                WriteItems: []*saasapi.WriteItem{
                    {
                        Userid: "oUpF8uMuAJO_M2pxb1Q9zNjWeS6o", // OpenID 原始值
                        BytesKv: map[uint32]uint32{
                            1: 1,
                            2: 100,
                        },
                        Uint32SKv: map[uint32]uint32{
                            1: 1000000,
                        },
                    },
                    {
                        Userid: "oUpF8uMuAJO_M2pxb1Q9zNjWeS6p",
                        BytesKv: map[uint32]uint32{
                            1: 2,
                            2: 200,
                        },
                        FlagsWithExpireKv: map[uint32]*saasapi.FlagWithExpire{
                            1: {Flag: true},
                        },
                    },
                },
            },
        },
    }
    
    res, err := client.Write(req)
    if err != nil {
        fmt.Printf("写入失败: %v\n", err)
        return
    }
    
    if res.Code == saasapi.ErrorCode_SUCC {
        fmt.Println("写入成功")
        if len(res.GetWriteRes().GetFailedUserid()) > 0 {
            fmt.Printf("部分用户写入失败: %v\n", res.GetWriteRes().GetFailedUserid())
        }
    } else {
        fmt.Printf("写入失败: code=%v, status=%s\n", res.Code, res.Status)
    }
}
```

**重要说明**：
- 使用 OpenID 时，必须同时指定 `appid` 和 `account_id` 参数
- `appid`：微信小程序/公众号/视频号的 AppID
- `account_id`：广告主账号 ID
- OpenID 使用原始值，无需哈希处理

##### **方法三：使用 saastool HTTP daemon 模式（OpenID）**

**1. 启动 daemon 服务**

```sh
export SRTA_ACCOUNT=2000
export SRTA_TOKEN=your_token_here
export SRTA_ENV=demo
export SRTA_PORT=8080

saastool daemon
```

**2. 单个用户写入（GET 请求）**

```sh
# 写入 OpenID 数据
curl "http://localhost:8080/write?ds=wuid&appid=wx1234567890abcdef&userid=oUpF8uMuAJO_M2pxb1Q9zNjWeS6o&u8.1=10&u32.1=1000000"

# 写入前先清空
curl "http://localhost:8080/write?ds=wuid&appid=wx1234567890abcdef&userid=oUpF8uMuAJO_M2pxb1Q9zNjWeS6o&u8.1=10&u32.1=1000000&clear=true"
```

**3. 批量写入（POST 请求）**

```sh
curl -X POST "http://localhost:8080/write?ds=wuid&appid=wx1234567890abcdef" \
  -H "Content-Type: text/plain" \
  -d "userid=oUpF8uMuAJO_M2pxb1Q9zNjWeS6o&u8.1=10&u32.1=1000000" \
  -d "userid=oUpF8uMuAJO_M2pxb1Q9zNjWeS6p&u8.1=60&flag.2=true"
```

##### **方法四：使用 Task 任务批量写入（推荐大数据量）**

适用于千万级以上 OpenID 数据的批量写入场景。

**完整流程**：

**步骤1：准备数据文件**

```jsonl
{"userid":"oUpF8uMuAJO_M2pxb1Q9zNjWeS6o","bytesKv":{"1":1,"2":100},"uint32sKv":{"1":1000000}}
{"userid":"oUpF8uMuAJO_M2pxb1Q9zNjWeS6p","bytesKv":{"1":2,"2":200},"flagsWithExpireKv":{"1":{"flag":true}}}
```

**步骤2：生成任务元数据文件（Make）**

```sh
# 为 OpenID 数据生成任务元数据
saastool task make \
  -source ./users_openid.jsonl \
  -hash ./task_openid.json \
  -ds wuid \
  -appid wx1234567890abcdef \
  -accountid 2000 \
  -blocksize 200M \
  -desc "OpenID 用户数据批量写入任务"
```

**参数说明**：
- `-ds wuid`：指定数据空间为 WUID
- `-appid`：**必填**，微信 AppID
- `-accountid`：**必填**，广告主账号 ID

**步骤3-7：后续步骤与 DID 数据区相同**

```sh
# 3. 创建任务
saastool task create -hash ./task_openid.json

# 4. 上传数据分块
saastool task upload -sha256 <task_sha256>

# 5. 执行任务
saastool task run -sha256 <task_sha256>

# 6. 查询任务状态
saastool task info -sha256 <task_sha256>

# 7. 删除任务（可选）
saastool task delete -sha256 <task_sha256>
```

#### 2.3.3.4 注意事项

1. **AppID 与 AccountID 必填**：
   - 使用 OpenID 时，必须同时指定 `appid` 和 `accountid`
   - `appid` 为微信小程序/公众号/视频号的 AppID
   - `accountid` 为广告主账号 ID（由平台分配）
   - 缺少任意一个参数都会导致写入失败

2. **OpenID 格式**：
   - OpenID 使用原始字符串，无需任何哈希处理
   - 区分大小写，需保持原始格式
   - 典型格式：`oXXXX...`（28位字符）

3. **UnionID 与 OpenID**：
   - UnionID 和 OpenID 可混用（底层会统一转换为 WUID）
   - 建议优先使用 UnionID（跨应用唯一）
   - 同一用户的 UnionID 在不同应用下相同

4. **⚠️ 字段索引冲突风险**：
   - **OpenID 数据与手机号数据共用 WUID 区**，字段索引必须避免冲突
   - UINT8 字段：索引 1-64，值范围 0-255
   - UINT32 字段：索引 1-8，值范围 0-4294967295
   - FLAG 字段：索引 1-4，值为布尔型
   - **示例**：如果手机号使用 U8[1-32]，则 OpenID 应使用 U8[33-64]
   - **后果**：索引重复会导致后写入的数据覆盖先写入的数据，且无错误提示
   - **建议**：在项目配置文档中明确记录各数据类型的字段索引分配方案

5. **AppID 权限**：
   - 写入的 AppID 必须已在广告平台完成授权
   - 未授权的 AppID 无法写入数据
   - 如遇权限问题，请联系平台管理员

#### 2.3.3.5 写入方法对比

| 对比项 | CLI 工具 | API 接口 | HTTP Daemon | Task 任务 |
| --- | --- | --- | --- | --- |
| **适用场景** | 小批量数据、脚本自动化 | 程序集成、实时写入 | 轻量级 HTTP 服务 | 大批量数据（千万级+） |
| **数据量级** | < 100万 | < 1000万 | < 100万 | ≥ 1000万（亿级） |
| **AppID 指定** | 命令行参数 | API 字段 | URL 参数 | task make 参数 |
| **AccountID 指定** | 命令行参数 | API 字段 | 环境变量 | task make 参数 |

#### 2.3.3.6 最佳实践

1. **字段索引规划**（**最重要**）：
   - **务必与手机号数据协调字段索引分配，避免覆盖冲突**
   - 参考手机号章节的索引分配方案，确保 OpenID 使用不同的索引区间
   - 示例：如手机号使用 U8[1-32]，则 OpenID 使用 U8[33-64]
   - 在项目配置文档中明确记录索引分配规则
   - 避免后期因索引冲突导致数据混乱或丢失

2. **AppID 管理**：
   - 建议为每个微信应用配置独立的 AppID
   - 在配置文件或环境变量中统一管理 AppID 和 AccountID
   - 避免在代码中硬编码 AppID

3. **OpenID 格式验证**：
   - 写入前验证 OpenID 格式（通常以 `o` 开头，28位字符）
   - 检查 OpenID 是否为空或包含非法字符
   - 确保 OpenID 来源于微信官方 API

4. **UnionID 优先**：
   - 如果应用已开通 UnionID，建议优先使用 UnionID
   - UnionID 可跨应用共享数据，提升数据利用率
   - UnionID 需要在微信开放平台绑定应用

5. **数据验证**：
   - 写入后使用 `read` 命令验证数据正确性
   - 检查 `failed_userid` 并重试失败的记录
   - 定期验证 AppID 授权状态

6. **错误处理**：
   - API 返回的 `failed_userid` 可能包含权限错误或格式错误
   - 建议记录失败的 OpenID 并分析原因
   - 权限错误通常需要联系平台管理员处理

#### 2.3.3.7 OpenID 与手机号对比

| 对比项 | OpenID 数据 | 手机号数据 |
| --- | --- | --- |
| **用户标识** | OpenID / UnionID（原始值） | 手机号哈希（MD5/SHA256） |
| **必填参数** | `appid` + `accountid` | `hashtype` |
| **数据格式** | 原始字符串，无需哈希 | 必须先计算哈希值 |
| **跨应用** | UnionID 支持跨应用 | 手机号全局唯一 |
| **隐私保护** | 依赖微信体系 | 哈希后无法反推 |
| **适用场景** | 微信生态内的用户数据 | 通用用户数据，跨平台 |

**选择建议**：
- 微信小程序/公众号场景 → 使用 **OpenID 数据**
- 需要跨平台数据共享 → 使用 **手机号数据**
- 已有 UnionID 体系 → 优先使用 **UnionID**
- 数据隐私要求高 → 使用 **手机号哈希数据**

### 2.3.4 门店数据写入(GEO区)

先使用saastool info命令检查是否有对应数据区。

```sh
saastool info
```

如显示的dataspace节点下有`GEO`区，则可以使用`GEO`数据区。所不存在，则表明未开通`GEO`区。

```json
Info res: {
  "dataspace": {
    "geo": [
      "geo",
      "20010701"
    ]
  }
}
```

### 2.3.5 IP城市数据写入(GEOIP区)

先使用saastool info命令检查是否有对应数据区。

```sh
saastool info
```

如显示的dataspace节点下有`GEOIP`区，则可以使用`GEOIP`数据区。所不存在，则表明未开通`GEOIP`区。

```json
Info res: {
  "dataspace": {
    "geoip": [
      "geoip",
      "20010801"
    ]
  }
}
```

### 2.3.6 常住城市数据写入(GEOFAC区)

先使用saastool info命令检查是否有对应数据区。

```sh
saastool info
```

如显示的dataspace节点下有`GEOFAC`区，则可以使用`GEOFAC`数据区。所不存在，则表明未开通`GEOFAC`区。

```json
Info res: {
  "dataspace": {
    "geofac": [
      "geofac",
      "20010901"
    ]
  }
}
```

