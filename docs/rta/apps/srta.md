---
sidebar_position: 7
toc_min_heading_level: 2
toc_max_heading_level: 5
description: 以SaaS的方式，让广告客户能够以低门槛、高灵活度的方式使用RTA能力。广告客户可以免除对接整套RTA时涉及到的工程投入、基建投入，专注在策略开发中；同时由于RTA-SaaS部署在平台域内，数据安全和合规性获得更强保障，进而可以衍生出更多玩法，解决更多业务问题。
keywords: [RTA, sRTA, SaaS]
---

# sRTA(alpha)-内部命名

## 1 产品概述
+ **产品定位**：

以SaaS的方式，让广告客户能够以低门槛、高灵活度的方式使用RTA能力。广告客户可以免除对接整套RTA时涉及到的工程投入、基建投入，专注在策略开发中；同时由于RTA-SaaS部署在平台域内，数据安全和合规性获得更强保障，进而可以衍生出更多玩法，解决更多业务问题。

:::warning
该功能目前处于alpha阶段，由RTA团队主动邀约。
:::

+ **适用行业与客户**：

  + **DID/OpenID无缝互通**：希望应用二方数据作用在特定业务中的（如小程序和app双端用增）。
  + **零成本服务器成本**：希望以RTA方式接入广告系统，但无法满足RTA对接门槛要求的；
  + **多方数据联合应用**：一方（客户）、二方（平台）、三方（服务商）数据实时获取，丰富应用场景；

* 产品对比：

| 产品对比 | RTA-SaaS | 完整RTA |
| --- | --- | --- |
| 工程 | 简单 <br /> 仅需做策略管理和数据管理 | 较复杂 <br /> 需实现策略管理和数据管理、网络、存储、日志等模块 |
| 数据 | 传至平台侧 | 保存在客户侧 |
| 策略 | 低代码LUA | 客户系统开发与实现 |
| 数据交互量级 | 由客户主动更新 | 取决于平台，请求级交互QPS峰值30w |
| 机器成本 | 无 | 较大 |
| 使用门槛 | 业务侧评估 | 业务侧评估 + 日耗门槛10w/天 |
| 客户数据安全性 | 向平台侧上传用户ID+标志位，平台侧无法理解用标志位的含义 | 以平均25万QPS向平台返回用户ID + 策略决策结果，平台侧无法理解策略ID的含义 |

## 2 使用流程

+ 实现数据批量上传
+ 实现数据增量更新
+ 实现策略LUA代码

## 3 模块一览
![sRTA](/img/srta.png)

## 4 对接协议与文档

### 4.1 策略维护接口

策略维护接口预计于 7 月中可用，当前提供人工维护支持。

### 4.2 数据底座

#### 4.2.1 一方数据

以下是一方数据存储中的结构示意.

##### 4.2.1.1 命名空间

每个客户可以有 1 个（设备号存储区）或 2 个（设备号+wuid存储区）命名空间。

![sRTA 存储](/img/srta_store1.png)

##### 4.2.1.2 命名空间内存储

存储区有三种类型的字段，可满足不同场景的诉求。

![sRTA 存储结构](/img/srta_store2.png)

uint8 共 128 个		uint32 共 16 个		flagWithExpire 共 8 个

##### 4.2.1.3 字段使用

每个数组的一个值可视为 `一列` 或 `一个维度`,每一列存贮什么内容由使用方自由发挥。

##### 4.2.1.4 使用示例

例如我们可将uint8 的第 0列用于App 的已安装状态，当该值为 1 时，即表示已安装。

![sRTA 存储结构](/img/srta_store3.png)

##### 4.2.1.5 底层存储示意

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
    uint8_t bytes[128];                        // byte型存储
    uint32_t uint32s[16];                      // uint32型存储
    struct FlagWithExpire flag_with_expire[8]; // flag型存储
};
```


##### 4.2.1.6 默认值
+ uint8默认值：0
+ uint32默认值：0
+ flagWighExpire默认值为：flag = false, default_flag = false，expire = 0


#### 4.2.2 二方数据

#### 4.2.3 三方数据

三方数据在存储中的结构与一方数据相同。多个来源的三方数据使用dataspace概念进行区分与授权管理。不同的dataspace在操作时隔离，在使用时基于授权机制决定是否作为 LUA 的入参。

### 4.3 数据管理

#### 4.3.1 交互协议proto

协议源码地址（协议在高频变动中，最新版本请拉取 [git源码](https://e.coding.net/rta/public/saasapi.git)：

```protobuf
syntax = "proto3";

package saasapi;

option go_package = "e.coding.net/rta/public/saasapi";

// SaasReq 命令请求
message SaasReq {
    oneof cmd {
        Read read                                = 10;  // 批量读取
        Write write                              = 11;  // 批量写入

        Task task_create                         = 20;  // 任务创建
        TaskList task_list                       = 21;  // 列出任务
        TaskRun task_run                         = 22;  // 执行任务
        TaskDelete task_delete                   = 23;  // 删除任务
        TaskInfo task_info                       = 24;  // 任务详情
    }
}

// Read 批量读取命令
message Read {
    string dataspace_id                          = 1;   // 数据空间ID
    string appid                                 = 2;   // 小程序/小游戏/公众号/视频号的appid
    repeated ReadItem read_items                 = 3;   // 批量获取命令
}

// ReadItem 读取命令
message ReadItem {
    string userid                                = 1;   // 用户ID
}

// Write 批量写入命令
message Write {
    string dataspace_id                          = 1;   // 数据空间ID
    string appid                                 = 2;   // 小程序/小游戏/公众号/视频号的appid
    bool is_clear_all_first                      = 3;   // 是否先清空该用户所有数据
    repeated WriteItem write_items               = 4;   // 批量写入命令
}

// WriteItem 写入命令
message WriteItem {
    string userid                                = 1;   // 用户ID
    Bytes write_bytes                            = 2;   // byte区域
    Uint32s write_uint32s                        = 3;   // uint32区域
    FlagsWithExpire write_flags_with_expire      = 4;   // 标志位区域
}

// Bytes 写入byte区域
message Bytes {
    bytes bytes                                  = 1;   // 写入的byte
    uint64 index_1                               = 2;   // 写入byte的索引值(0..63)
    uint64 index_2                               = 3;   // 写入byte的索引值(64..127)
}

// Uint32s 写入uint32区域
message Uint32s {
    repeated uint32 uint32s                      = 1;   // 写入的uint32
    uint64 index_1                               = 2;   // 写入uint32的索引值(0..15) 最多 16 个
    //uint64 index_2 = 3;                               // 写入uint32的索引值(当前不支持)
}

// FlagsWithExpire 写入标志位区域
message FlagsWithExpire {
    repeated FlagWithExpire flags_with_expire    = 1;   // 写入的标志位
    uint64 index_1                               = 2;   // 写入标志位的索引值
}

// FlagWithExpire 标志位
message FlagWithExpire {
    bool flag                                    = 1;   // 标志位
    bool default_flag                            = 2;   // 默认值。超时后则回到默认值。
    uint32 expire                                = 3;   // 过期时间，为 0 则永不过期
}

// ColumnWrite 全量列式写入命令
message ColumnWrite {
    string dataspace_id                          = 1;   // 数据空间ID
    bool is_clear_all_first                      = 2;   // 是否先执行清空
    Bytes write_bytes                            = 3;   // byte区域
    Uint32s write_uint32s                        = 4;   // uint32区域
    FlagsWithExpire write_flags_with_expire      = 5;   // 标志位区域
}

message Task {
    string dataspace_id                          = 1;   // 数据空间ID
    string appid                                 = 2;   // 小程序/小游戏/公众号/视频号的appid
    string task_sha256                           = 3;   // 任务sha256
    string task_description                      = 4;   // 任务描述
    repeated FileInfo task_file_infos            = 5;   // 文件列表
    uint64 task_block_size                       = 6;   // 文件块字节大小（推荐200M）

    // 以下字段只在返回时填写，用于提供服务端的任务状态。在请求时填写会被忽略
    string create_time                           = 10;   // 创建时间
    string run_time                              = 11;   // 运行时间
    string finish_time                           = 12;   // 完成时间

    TaskStatus status                            = 15;   // 任务状态
}

// TaskList 任务列表
message TaskList {
    TaskStatus status_filter                     = 1;   // 只显示指定状态的任务
}

// TaskRun 任务运行
message TaskRun {
    string task_sha256                           = 1;   // 任务sha256
}

// TaskDelete 取消任务
message TaskDelete {
    string task_sha256                           = 1;   // 任务sha256
}

// TaskInfo 任务详情
message TaskInfo {
    string task_sha256                           = 1;   // 任务sha256
}

message FileInfo {
    string file_name                             = 1;   // 文件名
    uint64 file_size                             = 2;   // 文件大小
    repeated FileBlock file_blocks               = 3;   // 文件块列表
}

message FileBlock {
    string block_sha256                          = 1;   // 块的sha256
    uint64 block_length                          = 2;   // 块的字节长度
    bool uploaded                                = 3;   // 是否已上传（在TaskCreate/TaskInfo请求返回）
}

// SaasRes 命令返回
message SaasRes {
    ErrorCode code                               = 1;  // 返回码
    string status                                = 2;  // 返回信息的文本提示
    oneof res {
        ReadRes read_res                         = 10;  // 读取命令返回
        WriteRes write_res                       = 11;  // 写入命令返回

        Task task_create_res                     = 20;  // 创建任务返回状态
        TaskListRes task_list_res                = 21;  // 任务列表返回状态
        Task task_run_res                        = 22;  // 运行任务返回状态
        Task task_delete_res                     = 23;  // 删除任务返回状态
        Task task_info_res                       = 24;  // 任务详情返回状态
    }
}

message ReadRes {
    uint32 succ_cmd_count                        = 1;  // 成功的命令数量
    uint32 fail_cmd_count                        = 2;  // 失败的命令数量
    repeated ValueItem cmd_res                   = 3;  // 返回的命令
}

message WriteRes {
    //uint32 succ_cmd_count                        = 1;  // 成功的命令数量
    //uint32 fail_cmd_count                        = 2;  // 失败的命令数量
    repeated string failed_userid                = 3;  // 返回的失败的用户ID
}

// ValueItem 读取命令返回内容
message ValueItem {
    uint32 cmd_index                             = 1;  // 命令索引
    CmdErrorCode cmd_code                        = 2;  // 状态
    bytes bytes                                  = 3;  // byte区域
    repeated uint32 uint32s                      = 4;  // uint32区域
    repeated FlagWithExpire flags_with_expire    = 5;  // 标志位区域
    uint32 last_modify_time                      = 6;  // 最后修改时间
}

message TaskListRes {
    repeated Task tasks                          = 1;  // 任务列表
}

// ErrorCode 返回码
enum ErrorCode {
    SUCC                                         = 0;   // 成功
    INVALID_ACCOUNT                              = 101; // Account不合法
    INVALID_TIMESTAMP                            = 102; // 头信息缺少时间戳或不正确
    INVALID_SIGNATURE                            = 103; // 头信息缺少签名
    AUTH_FAIL                                    = 104; // 签名较验失败
    DISABLED_ACCOUNT                             = 105; // 账号已禁用
    INVALID_CONTENT_TYPE                         = 110; // 非法的Content-Type
    READ_BODY                                    = 111; // 读取 http body 失败
    DECODE_BODY                                  = 112; // 解码 body 失败
    QPS_LIMIT                                    = 113; // 并发请求量超限
    CMDS_LIMIT                                   = 114; // 命令数量超限
    CMDS_NULL                                    = 115; // 命令为空
    DATASPACE_NOT_EXISTS                         = 116; // 数据空间不存在

    TASK_EXISTS                                  = 120; // 任务已存在
    TASK_IS_NOT_EXISTS                           = 121; // 任务不存在
    TASK_NUM_LIMIT                               = 122; // 任务数达到上限
    TASK_BLOCK_SIZE                              = 123; // 块大小超限
    TASK_TOTAL_SIZE                              = 124; // 总文件大小超限
    TASK_MARSHAL                                 = 125; // 序列化

    TASK_IS_WATING                               = 130; // 任务未上传完毕
    TASK_IS_RUNNING                              = 131; // 任务已经在运行
    TASK_FAILED                                  = 132; // 任务已失败
    TASK_FINISHED                                = 133; // 任务已完成
 

    DATA_ERROR                                   = 201; // 数据错误
    CMD_ERROR                                    = 202; // 命令行执行错误
}

enum CmdErrorCode {
    OK                                           = 0;   // 成功
}

enum TaskStatus {
    ALL                                          = 0;   // 全部
    WAITING                                      = 1;   // 等待中
    READY                                        = 2;   // 上传完毕
    RUNNING                                      = 3;   // 运行中
    SUCCESS                                      = 4;   // 成功
    FAIL                                         = 5;   // 失败

    DELETED                                      = 10;   // 已删除，仅在执行删除成功时返回
}

```

#### 4.3.2 API域名

数据管理测试URL：https://srta.algo.com.cn/
:::tip
非官方地址的沙盒环境，仅用于测试，请不要上传真实数据。
:::

:::warning
测试环境有可能会存在不稳定或服务关闭现象，在使用前请与研发先确认。 
:::

#### 4.3.3 API请求

HTTP Method：POST

HTTP Header 包含以下信息

| 字段名称 | 必填 | 描述 |
| :--- | :--- | :--- |
| Account | 是 | 客户在RTA SaaS系统中的账号ID |
| Authorization | 是 | 加密串32位md5，生成规则见下文 |
| Time | 是 | 请求发生的时间戳（秒），10位数字 |
| Content-Type | 是 | 固定值：application/x-protobuf <br/><br/>**特殊**：在使用/saas/task/upload接口时，该项值为application/octet-stream |
| Content-Encoding | **在上传时必填** | 当前服务端支持：gzip |

#### 4.3.4 加密串生成规则

Authorization=md5(Account+Token+Time)

注：Token为RTA前台设置的一个字符串，由 RTA团队提供

例:

 	Account=2000，Token=ABCDEF，Time=1743995833

    Authorization=md5(2000ABCDEF1743995833) = 8cc93e93ba55ccd546f1f44f437df04b

注：平台RTA服务器会对time与Authorization参数进行校验

1. time与RTA服务器时间gap超过30min，则验证失败
2. Authorization值和SaaS服务器按以上规则生成的值不一致，则验证失败

#### 4.3.5 API返回格式

API以protobuf格式返回，返回信息为SaasRes结构

#### 4.3.6.命令状态码定义

| 状态码 | proto常量 | 描述 |
| :--- | :--- | :--- |
| 101 | INVALID_ACCOUNT | Account不合法 |
| 102 | INVALID_TIMESTAMP | 头信息缺少时间戳或不正确 |
| 103 | INVALID_SIGNATURE | 头信息缺少签名 |
| 104 | AUTH_FAIL | 签名较验失败 |
| 105 | DISABLED_ACCOUNT | 账号已禁用 |
| 110 | INVALID_CONTENT_TYPE | 非法的Content-Type |
| 111 | READ_BODY | 读取 http body 失败 |
| 112 | DECODE_BODY | 解码 http body 失败 |
| 113 | QPS_LIMIT | 并发请求量超限 |
| 114 | CMDS_LIMIT | 命令数量超限 |
| 115 | CMDS_NULL | 命令为空 |
| 116 | DATASPACE_NOT_EXISTS | 数据空间不存在 |
| 120 | TASK_EXISTS | 任务已存在 |
| 121 | TASK_IS_NOT_EXISTS | 任务不存在 |
| 122 | TASK_NUM_LIMIT | 任务数达到上限 |
| 123 | TASK_BLOCK_SIZE | 块大小超限 |
| 124 | TASK_TOTAL_SIZE | 总文件大小超限 |
| 125 | TASK_MARSHAL | 序列化失败 |
| 130 | TASK_IS_WATING | 任务未上传完毕 |
| 131 | TASK_IS_RUNNING | 任务已经在运行 |
| 132 | TASK_FAILED | 任务已失败 |
| 133 | TASK_FINISHED | 任务已完成 |
| 201 | DATA_ERROR | 数据错误 |
| 202 | CMD_ERROR | 命令行执行错误 |

#### 4.3.7 任务状态码/过滤码定义

| 状态码 | proto常量 | 描述 |
| :--- | :--- | :--- |
| 0 | ALL | 全部 |
| 1 | WAITING | 等待中 |
| 2 | READY | 上传完毕 |
| 3 | RUNNING | 运行中 |
| 4 | SUCCESS | 成功 |
| 5 | FAIL | 失败 |
| 10 | DELETED | 已删除，仅在执行删除成功时返回 |

#### 4.3.8 实践建议

+ **人群包上传**：使用任务接口，支持亿级处理。 
  1. 准备好数据（每一行为WriteItem 的json化内容），如存在多个文件，请放入同一目录。
  2. 生成任务信息。遍历文件，分片计算sha256（单个分片大小上下限为 50-200MB，推荐 200M，文件尾不足分片大小的，按实际大小计算），填写任务结构。
  3. 使用任务创建接口创建任务，上传 2 对应的任务信息。
  4. 上传文件分片，可并发上传。在上传分片前，请先使用任务详情接口获取分片是否已上传的状态，如已上传则无须再次上传。
  5. 所有分片上传结束后，运行任务。
  6. 查询任务状态，获取成功或失败信息。

+ **实时写入**：更新用户数据的变更集。每秒每请求最多可操作 1W UID。超量诉求不予支持，请先检视自己的使用思路是否合理。
+ **实时读取**：获取用户数据的内容用于抽检。每秒每请求最多可操作100 UID。超量诉求不予支持。
+ **任务分片上传**：
  1. 使用gzip压缩，减少网络开销，提升上传效率。
  2. 分片机制对应于断点续传思路，使得在大量数据上传时不至于因为偶发网络波动而损失大量上传内容。
+ **JSON格式支持**：调试接口支持 JSON格式。出于成本节约目的，生产接口仅支持protobuf。

#### 4.3.9 基础协议

**请求参数**：

| 字段名称 | 字段类型 | 必填 | 描述 |
| :--- | :--- | :--- | :--- |
| SaasReq | SaasReq | 是 | 请求消息结构 |
|  |  |  | 以下字段根据操作选择 **唯一** 的一个 |
| SaasReq.read | Rea | 是 | 实时读取数据 |
| SaasReq.write | Write | 是 | 实时写入数据 |
| SaasReq.task_create | TaskCreate | 是 | 任务创建 |
| SaasReq.task_list | TaskList | 是 | 任务列表 |
| SaasReq.task_run | TaskRun | 是 | 任务执行 |
| SaasReq.task_delete | TaskDelete | 是 | 任务删除 |
| SaasReq.task_info | TaskInfo | 是 | 任务详情 |

**返回参数**：

| 字段名称 | 字段类型 | 必填 | 描述 |
| :--- | :--- | :--- | :--- |
| SaasRes | SaasRes | 是 | 返回消息结构 |
| SaasRes.code | ErrorCode | 是 | 返回状态码，请查阅[命令状态码定义](#436命令状态码定义) |
| SaasRes.status | string | 否 | 返回状态描述 |
|  |  |  | 以下字段根据操作返回唯一的一个 |
| SaasRes.read_res | ReadRes | 是 | 实时读取数据返回状态 |
| SaasRes.write_res | WriteRes | 是 | 实时写入数据返回状态 |
| SaasRes.task_create_res | Task | 是 | 任务创建返回状态 |
| SaasRes.task_list_res | TaskListRes | 是 | 任务列表返回状态 |
| SaasRes.task_run_res | Task | 是 | 任务执行返回状态 |
| SaasRes.task_delete_res | Task | 是 | 任务删除返回状态 |
| SaasRes.task_info_res | Task | 是 | 任务详情返回状态 |

#### 4.3.10 实时读

**说明**：该接口用于实时查询用户 ID下的数据信息（byte、uint32、flag），**少量抽样验证**当前结果是否符合预期。为了防止对线上业务产生冲击，该接口限制并发数 = **1**，QPS = **1**，单次查询 用户 ID数上限为 **100**。即同时只能有 1 个查询，每秒限制 1次，单次最多可查 100个。

**接口**：/saas/read

**请求参数**：

表格节点位于 SaasReq.read

| 字段名称 | 字段类型 | 必填 | 描述 |
| :--- | :--- | :--- | :--- |
| dataspace_id | string | 是 | 数据空间ID，当前支持did(设备号)、wuid(openid) |
| appid | string | 否 | 如appid不为空，且dataspace_id为wuid，则表示数据空间为wuid（微信生态用户标识） |
| read_items | array of ReadItem | 是 | 用户列表 |
| read_item.userid | string | 是 | 用户 ID |

**返回参数**：

表格节点位于 SaasRes.read_res

| 字段名称 | 字段类型 | 必填 | 描述 |
| :--- | :--- | :--- | :--- |
| succ_cmd_coun | uint32 | 是 | 成功的命令数量 |
| fail_cmd_count | uint32 | 是 | 失败的命令数量 |
| cmd_res | array of ValueItem | 否 | 失败命令信息 |
| value_item.cmd_index | uint32 | 是 | 命令编号，对应请求的数组编号 |
| value_item.cmd_code | CmdErrorCode | 是 | 子命令状态 |
| value_item.bytes | array of uint8 | 是 | uint8区域数值 |
| value_item.uint32s | array of uint32 | 是 | uint32区域数值 |
| value_item.flags_with_expire | array of FlagWithExpire | 是 | 标志位区域内容 |
| value_item.flags_with_expire.flag | bool | 是 | 标志位。在读取时，标志位未过期则返回flag值，过期则返回default_flag值 |
| value_item.flags_with_expire.default_flag | bool | 否 | 默认标志位。过期后则回到默认值 |
| value_item.flags_with_expire.expire | uint32 | 否 | 过期时间，为 0 则永不过期 |

#### 4.3.11 实时写

**说明**：该接口用于实时写入用户 ID下的数据信息（byte、uint32、flag），**即时更新**用户的部分/全部字段变更。为了防止对线上业务产生冲击，该接口限制并发数 = **1**，QPS = **1**，单次写入 用户 ID数上限为 **10000**。即同时只能有 1 个写入，每秒限制 1次，单次最多可写入 10000个。

**接口**：/saas/write

**请求参数**：

表格节点位于 SaasReq.write

| 字段名称 | 字段类型 | 必填 | 描述 |
| :--- | :--- | :--- | :--- |
| dataspace_id | string | 是 | 数据空间ID，当前支持did(设备号)、wuid(openid) |
| appid | string | 否 | 如appid不为空，且dataspace_id为wuid，则表示数据空间为wuid（微信生态用户标识） |
| is_clear_all_first | bool	| 否 | 是否先清空该用户的所有数据 |
| write_items | array of WriteItem | 是 | 批量写入命令 |
| write_item.userid | string | 是 | 用户 ID（设备号 or OpenID） |
| write_item.write_bytes | Bytes | 否 | 写入的uint8类型数值 |
| write_item.write_bytes.bytes | array of byte/bytes | 是 | 写入的byte数组，每个byte 的填写编号由下面index决定 |
| write_item.write_bytes.index_1 | uint64 | 是 | 写入byte的索引值(0..63)，位置使用bit位表示 |
| write_item.write_bytes.index_2 | uint64 | 是 | 写入byte的索引值(64..127)，位置使用bit位表示 |
| write_item.write_uint32s | Uint32s | 否 | 写入的uint32类型数值 |
| write_item.write_uint32s.uint32s | array of uint32 | 是 | 写入的uint32数组，每个uint32 的填写编号由下面index决定 |
| write_item.write_uint32s.index_1 | uint64 | 是 | 写入uint32的索引值(0..15)，位置使用bit位表示 |
| write_item.write_flags_with_expire | FlagsWithExpire | 否 | 写入的标志位类型值 |
| write_item.write_flags_with_expire.flags_with_expire | array of FlagWithExpire | 是 | 写入的标志位 |
| write_item.write_flags_with_expire.flags_with_expire.flag | bool | 是 | 标志位。在读取时，标志位未过期则返回flag值，过期则返回default_flag值 |
| write_item.write_flags_with_expire.flags_with_expire.default_flag | bool | 否 | 默认标志位。过期后则回到默认值 |
| write_item.write_flags_with_expire.flags_with_expire.expire | uint32 | 否 | 过期时间，为 0 则永不过期 |
| write_item.write_flags_with_expire.index_1 | uint64 | 是 | 写入flag的索引值(0..7)，位置使用bit位表示 |

**返回参数**：

表格节点位于 SaasRes.write_res

| 字段名称 | 字段类型 | 必填 | 描述 |
| :--- | :--- | :--- | :--- |
| faied_userid | array of string | 否 | 失败的用户ID |

#### 4.3.12 全列覆盖写(暂不可用)

**说明**：该接口用于设置全量用户的一个或多个列（byte、uint32、flag）状态。例如在拉活场景中，当天发生过唤起的用户会逐步从可设放变为不可投放（在 UV级将某列标记为不可投放），在跨天时全量用户又需变成可设放状态。在常规思路下需要记录变更用户集，跨天时将该用户集全部改写一遍，存在着数据量大且可能有遗漏的情形。通过此接口可快速设置全量用户的状态，即时生效。

**调用限制**：
  + 当有任务处于“运行”状态时，不可调用。
  + 每自然天调用上限为 10 次。

**数据覆盖规则**：
  + 调用后以逻辑覆盖的方式执行，非物理写入。
  + 调用后立即覆盖指定的所有列值，零等待。
  + 在此之后执行的写入动作(write/task run)包含覆盖列时，将新值写入该列。

**接口**：/saas/columwrite

**请求参数**：

表格节点位于 SaasReq.column_write

| 字段名称 | 字段类型 | 必填 | 描述 |
| :--- | :--- | :--- | :--- |
| is_clear_all_first | bool	| 否 | 是否先清空该用户的所有数据 |
| write_bytes | Bytes | 否 | 写入的uint8类型数值 |
| write_bytes.bytes | array of byte/bytes | 是 | 写入的byte数组，每个byte 的填写编号由下面index决定 |
| write_bytes.index_1 | uint64 | 是 | 写入byte的索引值(0..63)，位置使用bit位表示 |
| write_bytes.index_2 | uint64 | 是 | 写入byte的索引值(64..127)，位置使用bit位表示 |
| write_uint32s | Uint32s | 否 | 写入的uint32类型数值 |
| write_uint32s.uint32s | array of uint32 | 是 | 写入的uint32数组，每个uint32 的填写编号由下面index决定 |
| write_uint32s.index_1 | uint64 | 是 | 写入uint32的索引值(0..15)，位置使用bit位表示 |
| write_flags_with_expire | FlagsWithExpire | 否 | 写入的标志位类型值 |
| write_flags_with_expire.flags_with_expire | array of FlagWithExpire | 是 | 写入的标志位 |
| write_flags_with_expire.flags_with_expire.flag | bool | 是 | 标志位。在读取时，标志位未过期则返回flag值，过期则返回default_flag值 |
| write_flags_with_expire.flags_with_expire.default_flag | bool | 否 | 默认标志位。过期后则回到默认值 |
| write_flags_with_expire.flags_with_expire.expire | uint32 | 否 | 过期时间，为 0 则永不过期 |
| write_flags_with_expire.index_1 | uint64 | 是 | 写入flag的索引值(0..7)，位置使用bit位表示 |

**返回参数**：

仅使用顶层节点 SaasRes.code/SaasRes.status 表达操作成功/失败状态

#### 4.4.13 任务-创建

**说明**：任务用于大批量集中上传写入。适用于对亿级用户的一个或多列进行（byte、uint32、flag）变更，具有并发写入量大，批量集中执行的特点。该接口用于创建一个任务，通过描述待上传数据的摘要信息，允许后续任务数据的分块分批上传。新创建的任务将在 7 天内有效并等待分块上传，待任务数据全部上传完毕后，再通过运行接口执行写入任务。超过 7 天的任务则自动删除。

**接口**：/saas/task/create

**请求参数**：

表格节点位于 SaasReq.task_create

| 字段名称 | 字段类型 | 必填 | 描述 |
| :--- | :--- | :--- | :--- |
| dataspace_id | string | 是 | 数据空间ID，当前支持did(设备号)、wuid(openid) |
| is_clear_all_first | bool | 否 | 是否先清空该用户的所有数据 |
| task_sha256 | string | 是 | 任务sha256 |
| task_description | string | 否 | 任务描述，不重要，它是个对客户的助记符 |
| task_file_infos | array of FileInfo | 是 | 文件列表 |
| task_file_infos.file_name | string | 否 | 文件名，不重要，它是个对客户的助记符 |
| task_file_infos.file_size | uint64 | 是 | 文件大小 |
| task_file_infos.file_blocks | array of FileBlock | 是 | 文件块列表 |
| task_file_infos.file_blocks.block_sha256 | string | 是 | 块的sha256 |
| task_file_infos.file_blocks.block_size | uint64 | 是 | 块的大小。一般情况下块大小与task_block_size 一致，文件最后一块除外 |
| task_block_size | uint64 | 是 | 块的大小 |

**返回参数**：

表格节点位于 SaasRes.task_create_res

| 字段名称 | 字段类型 | 必填 | 描述 |
| :--- | :--- | :--- | :--- |
| task_sha256 | string | 是| 任务sha256 |
| task_description | string | 否 | 任务描述，不重要，它是个对客户的助记符 |
| task_file_infos | array of FileInfo | 是 | 文件列表 |
| task_file_infos.file_name | string | 否 | 文件名，不重要，它是个对客户的助记符 |
| task_file_infos.file_size | uint64 | 是 | 文件大小 |
| task_file_infos.file_blocks | array of FileBlock | 是 | 文件块列表 |
| task_file_infos.file_blocks.block_sha256 | string | 是 | 块的sha256 |
| task_file_infos.file_blocks.block_size | uint64 | 是 | 块的大小。一般情况下块大小与task_block_size 一致，文件最后一块除外。 |
| task_file_infos.file_blocks.uploaded | bool | 否 | 分块是否已上传。即使是刚创建的任务，也有可能因为分块曾经上传过而将此值标记为true。已经上传的分块无须再次上传 |
| create_time | string | 是 | 创建时间 |
| run_time | string | 否 | 运行时间 |
| finish_time | string | 否 | 完成时间 |
| task_block_size | uint64 | 是 | 块的大小 |
| status | TaskStatus | 是 | 任务状态<br/>WAITING = 1;// 等待中<br/>RUNNING = 2;// 运行中<br/>SUCCESS = 3;// 成功<br/>FAIL = 4;// 失败<br/>DELETED = 5; // 已删除，仅在执行删除成功时返回 |

#### 4.3.14 任务-列表

**说明**：该接口用于列出任务，查看各任务的状态。

**接口**：/saas/task/list

**请求参数**：

表格节点位于 SaasReq.task_list

| 字段名称 | 字段类型 | 必填 | 描述 |
| :--- | :--- | :--- | :--- |
| status_filter | TaskStatus | 否 | 显示指定状态的任务<br/>WAITING = 1;// 等待中<br/>RUNNING = 2;// 运行中<br/>SUCCESS = 3;// 成功<br/>FAIL = 4;// 失败<br/>DELETED = 5; // 已删除，仅在执行删除成功时返回 |

**返回参数**：

表格节点位于 SaasRes.task_list_res
| 字段名称 | 字段类型 | 必填 | 描述 |
| :--- | :--- | :--- | :--- |
| tasks | array of Task | 是 | 任务信息列表 |
| tasks.task_sha256 | string | 是 | 任务sha256 |
| tasks.task_description | string | 否 | 任务描述，不重要，它是个对客户的助记符 |
| tasks.create_time | string | 是 | 创建时间 |
| tasks.run_time | string | 否 | 运行时间 |
| tasks.finish_time | string | 否 | 完成时间 |
| tasks.task_block_size | uint64 | 是 | 块的大小 |
| tasks.status | TaskStatus | 是 | 任务状态<br/>WAITING = 1;// 等待中<br/>RUNNING = 2;// 运行中<br/>SUCCESS = 3;// 成功<br/>FAIL = 4;// 失败<br/>DELETED = 5; // 已删除，仅在执行删除成功时返回 |

#### 4.3.15 任务-执行

**说明**：该接口用于执行指定任务。将已处于全部分块上传完毕且未执行过的任务写入数据区。同一时间只能执行一个任务，当前有任务执行时，通过该接口调用多的其它任务将进入串行等待执行状态。

**接口**：/saas/task/run

**请求参数**：

表格节点位于 SaasReq.task_run

| 字段名称 | 字段类型 | 必填 | 描述 |
| :--- | :--- | :--- | :--- |
| task_sha256 | string | 是 | 任务sha256 |

**返回参数**：

顶层节点 SaasRes.code/SaasRes.status 表达操作成功/失败状态

表格节点位于 SaasRes.task_run_res

| 字段名称 | 字段类型 | 必填 | 描述 |
| :--- | :--- | :--- | :--- |
| task_sha256 | string | 是 | 任务sha256 |
| task_description | string | 否 | 任务描述，不重要，它是个对客户的助记符 |
| task_file_infos | array of FileInfo | 是 | 文件列表 |
| task_file_infos.file_name | string | 否 | 文件名，不重要，它是个对客户的助记符 |
| task_file_infos.file_size | uint64 | 是 | 文件大小 |
| task_file_infos.file_blocks | array of FileBlock | 是 | 文件块列表 |
| task_file_infos.file_blocks.block_sha256 | string | 是 | 块的sha256 |
| task_file_infos.file_blocks.block_size | uint64 | 是 | 块的大小。一般情况下块大小与task_block_size 一致，文件最后一块除外 |
| task_file_infos.file_blocks.uploaded | bool | 否 | 分块是否已上传。即使是刚创建的任务，也有可能因为分块曾经上传过而将此值标记为true。已经上传的分块无须再次上传 |
| task_block_size | uint64 | 是 | 块的大小 |
| create_time | string | 是 | 创建时间 |
| run_time | string | 否 | 运行时间 |
| finish_time | string | 否 | 完成时间 |
| task_block_size | uint64 | 是 | 块的大小 |
| status | TaskStatus | 是 | 任务状态<br/>WAITING = 1;// 等待中<br/>RUNNING = 2;// 运行中<br/>SUCCESS = 3;// 成功<br/>FAIL = 4;// 失败<br/>DELETED = 5; // 已删除，仅在执行删除成功时返回 |

#### 4.3.16 任务-删除

**说明**：该接口用于删除指定任务。对于处于等待上传、成功、失败的任务，直接删除。对于处于运行中的任务，先中断运行状态后进行删除。

**接口**：/saas/task/delete

**请求参数**：

表格节点位于 SaasReq.task_delete

| 字段名称 | 字段类型 | 必填 | 描述 |
| :--- | :--- | :--- | :--- |
| task_sha256 | string | 是 | 任务sha256 |

**返回参数**：

顶层节点 SaasRes.code/SaasRes.status 表达操作成功/失败状态

表格节点位于 SaasRes.task_delete_res

| 字段名称 | 字段类型 | 必填 | 描述 |
| :--- | :--- | :--- | :--- |
| task_sha256 | string | 是 | 任务sha256 |
| task_description | string | 否 | 任务描述，不重要，它是个对客户的助记符 |
| task_file_infos | array of FileInfo | 是 | 文件列表 |
| task_file_infos.file_name | string | 否 | 文件名，不重要，它是个对客户的助记符 |
| task_file_infos.file_size | uint64 | 是 | 文件大小 |
| task_file_infos.file_blocks | array of FileBlock | 是 | 文件块列表 |
| task_file_infos.file_blocks.block_sha256 | string | 是 | 块的sha256 |
| task_file_infos.file_blocks.block_size | uint64 | 是 | 块的大小。一般情况下块大小与task_block_size 一致，文件最后一块除外 |
| task_file_infos.file_blocks.uploaded | bool | 否 | 分块是否已上传。即使是刚创建的任务，也有可能因为分块曾经上传过而将此值标记为true。已经上传的分块无须再次上传 |
| task_block_size | uint64 | 是 | 块的大小 |
| create_time | string | 是 | 创建时间 |
| run_time | string | 否 | 运行时间 |
| finish_time | string | 否 | 完成时间 |
| task_block_size | uint64 | 是 | 块的大小 |
| status | TaskStatus | 是 | 任务状态<br/>WAITING = 1;// 等待中<br/>RUNNING = 2;// 运行中<br/>SUCCESS = 3;// 成功<br/>FAIL = 4;// 失败<br/>DELETED = 5; // 已删除，仅在执行删除成功时返回 |

#### 4.3.17 任务-详情

**说明**：该接口用于查看指定任务的详细信息。包括分块上传完成情况。

**接口**：/saas/task/info

**请求参数**：

表格节点位于 SaasReq.task_info

| 字段名称 | 字段类型 | 必填 | 描述 |
| :--- | :--- | :--- | :--- |
| task_sha256 | string | 是 | 任务sha256 |

**返回参数**：

顶层节点 SaasRes.code/SaasRes.status 表达操作成功/失败状态

表格节点位于 SaasRes.task_info_res


| 字段名称 | 字段类型 | 必填 | 描述 |
| :--- | :--- | :--- | :--- |
| task_sha256 | string | 是 | 任务sha256 |
| task_description | string | 否 | 任务描述，不重要，它是个对客户的助记符 |
| task_file_infos | array of FileInfo | 是 | 文件列表 |
| task_file_infos.file_name | string | 否 | 文件名，不重要，它是个对客户的助记符 |
| task_file_infos.file_size | uint64 | 是 | 文件大小 |
| task_file_infos.file_blocks | array of FileBlock | 是 | 文件块列表 |
| task_file_infos.file_blocks.block_sha256 | string | 是 | 块的sha256 |
| task_file_infos.file_blocks.block_size | uint64 | 是 | 块的大小。一般情况下块大小与task_block_size 一致，文件最后一块除外 |
| task_file_infos.file_blocks.uploaded | bool | 否 | 分块是否已上传。即使是刚创建的任务，也有可能因为分块曾经上传过而将此值标记为true。已经上传的分块无须再次上传 |
| task_block_size | uint64 | 是 | 块的大小 |
| create_time | string | 是 | 创建时间 |
| run_time | string | 否 | 运行时间 |
| finish_time | string | 否 | 完成时间 |
| task_block_size | uint64 | 是 | 块的大小 |
| status | TaskStatus | 是 | 任务状态<br/>WAITING = 1;// 等待中<br/>RUNNING = 2;// 运行中<br/>SUCCESS = 3;// 成功<br/>FAIL = 4;// 失败<br/>DELETED = 5; // 已删除，仅在执行删除成功时返回 |


#### 4.3.18 任务-上传数据文件分片

**说明**：该接口用于上传文件分块内容。注意该接口并不需要protobuf 的命令请求，而是以POST body 的方式直接上传文件内容分块，内容分块在上传时 `必须使用gzip压缩`。返回结果仍遵循protobuf协议。如上传大小超限，则会直接以 HTTP 413 状态码返回。

此项请求与其他不同，请参阅 [API请求](#433-api请求)

**接口**：/saas/task/upload

**请求参数**：（以url param 的形式填写）

| 字段名称 | 字段类型 | 必填 | 描述 |
| :--- | :--- | :--- | :--- |
| block_sha256 | string | 是 | 块的sha256 |

**返回参数**：

顶层节点 SaasRes.code/SaasRes.status 表达操作成功/失败状态

### 4.4 saastool工具

saastool 是提供给客户的便捷命令行工具，使客户在不开发或少开发的情况下即可实现【数据管理】的对应功能。

开发者也可以参考该工具的功能源码(golang)，实现贴合自身业务的处理逻辑。

源码：[saastool](https://rta.coding.net/p/public/d/saasapi/git/tree/master/cmd/saastool) 

#### 4.4.1 命令行

```sh
saastool help
```

```
Usage:  saastool COMMAND [OPTIONS]

Commands:
    write              Write user's 'bytes / uint32s / flags'
    read               Read user's 'bytes / uint32s / flags'
    columnwrite        Write columns for 'deviceid / openid' users

    convert            Convert data to write format

    task               Task commands

"help" is the default command.

Use "saastool COMMAND -help" for more information about a command.

```

task 命令列表

```sh
saastool task help
```

```
Usage:  saastoola task COMMAND [OPTIONS]

Commands:
    make                 Make file hash for upload task
    create               Create a task on server
    list                 List tasks on server
    run                  Run a task on server
    delete               Delete a task on server
    info                 Get a task info on server
    upload               Upload task's file block to server

"help" is the default command.

Use "saastool task COMMAND -help" for more information about a command.
```

### 4.4.2 cfg.toml配置文件

saastool需要一个配置文件，其中可填写自己的Account、Token。使用配置文件可实现多账号多环境的区分。

该配置文件默认名称为 `cfg.toml`，请置于saastool 同目录下。也可以通过 -cfg 参数指定别的配置文件，例如 `saastool -cfg my.toml`。

```toml
# 样例
[auth]
account = "2000"
token = "test"

[apiurls]
baseurl = "http://localhost:8080"
writepath = "/saas/write"
readpath  = "/saas/read"
columnwritepath = "/saas/column_write"
tasklistpath = "/saas/tasklist"
taskcancelpath = "/saas/taskcancel"
taskdetailpath = "/saas/taskdetail"
```

### 4.4.3 数据转换参考

为了方便客户入手，saastool实现了一个数据转换功能。可以将客户侧的简单数据格式转换成saas服务所需要的上传/写入格式。

#### 4.4.3.1.数据准备

客户侧的数据格式为两例格式，用 TAB分隔。首列为用户 ID，次列为以空格分隔的标签数组。

```
692873b822ef89cb7e935ff370881026    news_1 music_2
a763b592c846f0a78fb9b326d5c8ba78    music_3 video_1
```

+ 注：news_n 新闻app安装用户及打分
+ 注：music_n 音乐app安装用户及打分
+ 注：video_n 视频app安装用户及打分

分配各 App 所占的数值列n。这里假设news 为第 0 列，music 为第 1 列，video 为第 2 列。

##### 4.4.3.2 建立映射

根据各列的分配，编写映射文件 `map.json`，指定在对应类型下各列的写入位置。

```json
{
    "targets": {
        "news_1": {
            "write_byte": 1,
            "write_byte_pos": 0
        },
        "music_2": {
            "write_byte": 2,
            "write_byte_pos": 1
        },
        "music_3": {
            "write_byte": 3,
            "write_byte_pos": 1
        },
        "video_1": {
            "write_byte": 1,
            "write_byte_pos": 2
        }
    }
}
```

##### 4.4.3.3 运行转换

```sh
saastool convert -map map.json -source ./notconverted/ -dest ./converted/
```

成功后输出转换后的文件

```json
{"userid":"692873b822ef89cb7e935ff370881026","writeBytes":{"bytes":"AQI=","index1":"3"}}
{"userid":"a763b592c846f0a78fb9b326d5c8ba78","writeBytes":{"bytes":"AwE=","index1":"6"}}
```

##### 4.4.3.4 提交写入

经过转换后的文件。可以通过 `write`（实时写入）命令，或 task 任务流进行上传写入。

### 4.5 LUA语法说明

#### 4.5.1 系统函数支持表

出于安全及性能原因，RTA SaaS禁用了大量不必要的 LUA功能。以下为支持的全局函数列表。

| 函数名 | 功能 |
| :--- | :--- |
| next | 对table进行遍历 |
| print | 打印信息（注：**在生产环境中该函数被设置为不输出**） |
| tonumber | 转换为数字 |
| tostring | 转换为文本 |
| type | 获取变量类型 |
| unpack | 将table 的元素解包为多值返回 |

#### 4.5.2 内置模块time

time为时间计算相关功能函数，系统使用uint32为基础格式，存放Unix Timestamp。

##### 4.5.2.1 函数列表

| 函数名 | 功能 |
| :--- | :--- |
| time.now | 获取当前时间 |
| time.date | 获取日期，一次返回年月日 |
| time.hour | 获取小时 |
| time.minute | 获取分钟 |
| time.second | 获取秒 |
| time.weekday | 获取星期几，星期日为 0，星期一为 1，以此类推 |
| time.truncate | 向下取整，第二参数可指定取整类型 |
| time.addtime | 增减时间，可一次增减时分秒 |
| time.adddate | 增减日期，可一次增减年月日 |
| time.setdate | 设置日期，可一次设置年月日时分秒 |

##### 4.5.2.1.1 time.now函数

函数获取当前时间戳，返回值为uint32类型。

```lua
now = time.now()
```

##### 4.5.2.1.2 time.date函数

函数传入时间戳，一次返回年、月、日三个值。

```lua
now = time.now()
year, month, day = time.date(now)
```

##### 4.5.2.1.3 time.hour函数

函数传入时间戳，返回小时。

```lua
now = time.now()
hour = time.hour(now)
```

##### 4.5.2.1.4 time.minute函数

函数传入时间戳，返回分钟。

```lua
now = time.now()
minute = time.minute(now)
```

##### 4.5.2.1.5 time.second函数

函数传入时间戳，返回秒。

```lua
now = time.now()
second = time.second(now)
```

##### 4.5.2.1.6 time.weekday函数

函数传入时间戳，返回星期几。星期天为 0，星期一为 1，以此类推。

```lua
now = time.now()
weekday = time.weekday(now)
```

##### 4.5.2.1.7 time.truncate函数

函数传入时间戳，及截断精度，返回截断后的时间戳。

时间精度可以是以下值：month、day、hour、minute。

```lua
now = time.now()
month_start = time.truncate(now, "month") -- 本月开始时间戳
today_start = time.truncate(now, "day") -- 今天开始时间戳
hour_start = time.truncate(now, "hour") -- 本小时开始时间戳
minute_start = time.truncate(now, "minute") -- 本分钟开始时间戳
```

##### 4.5.2.1.8 time.addtime函数

函数传入时间戳，及增减时间（时分秒），时分秒可为 0 或 负值，返回增减后的时间戳。

```lua
now = time.now()
newstamp = time.addtime(now, -1, 1, 1) -- 前1小时，再增加1分1秒
```

##### 4.5.2.1.9 time.adddate函数

函数传入时间戳，及增减日期（年月日），年月日可为 0 或 负值，返回增减后的时间戳。

```lua
now = time.now()
newstamp = time.adddate(now, -1, 1, 1) -- 去年，再增加1月1天
```

##### 4.5.2.1.10 time.setdate函数

函数传入年月日时分秒，返回时间戳。

```lua
newstamp = time.setdate(2025, 6, 18, 12，13,14) -- 2025:06:18 12:13:14
```

#### 4.5.3 内置模块srta

服务内置了名为 srta 的模块，提供了访问数据的功能及相关常量。

| 常量名称 | 含义 | 适用函数或变量 |
| :--- | :--- | :-- |
| srta.DS_DID | 默认设备数据空间编号 | srta.get_dsdata() |
| srta.DS_WUID | 默认 WUID数据空间编号 | srta.get_dsdata() |
| srta.U8 | UINT8字段区 | dsdata |
| srta.U32 | UINT32字段区 | dsdata |
| srta.FLAG | FLAG字段区 | dsdata |
| srta.TARGETINFO_ENABLE | 策略参竞 | target_info |
| srta.TARGETINFO_CPC_PRICE | CPC出价 | target_info |
| srta.TARGETINFO_CPA_PRICE | CPA出价 | target_info |
| srta.TARGETINFO_USER_WEIGHT_FACTOR | 用户权重系数	target_info |
| srta.TARGETINFO_CPC_FACTOR | CPC出价系统 | target_info |

##### 4.5.3.2 函数列表

| 函数名 | 功能 |
| :--- | :--- |
| srta.get_dsdata | 获取数据空间数据 |
| srta.get_targets | 获取需决策的策略ID列表 |
| srta.get_apps | 获取App安装态(需授权) |
| srta.get_scores | 获取模型分(需授权) |

##### 4.6.3.2.1 srta.get_dsdata函数

返回的数据以 LUA Table 结构存在，定义如下
```lua
didData = srta.get_dsdata(srta.DS_DID) -- 获取设备数据
-- 以下为字段返回值示例
didData = {
    [1]: {0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, .... 0, 0, 0, 0, 0, 0, 0, 0},
    [2]: {0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0},
    [3]: {false, false, false, false,false, false, false, false}
}
```

##### 4.5.3.2.2 srta.get_targets函数

返回的数据以 LUA Table 结构存在，定义如下

```lua
targets = srta.get_targets() -- 获取策略列表
-- 以下为字段返回值示例
targets = {"news", "music", "video_for_new"}
```

##### 4.5.3.2.3 srta.get_apps函数

一次可以获得多个App安装态，每个返回值为 true(已安装)/false(未安装)/nil(无权限或不可靠)中的一个状态

```lua
app1, app2, app3 = srta.get_apps(app1hash, app2hash, app3hash) -- 获取App安装态，可支持多个。
-- 以下为字段返回值示例
app1 = true
app2 = false
app3 = nil
```

##### 4.5.3.2.3 srta.get_scores函数

一次可以获得多个模型安装态，每个返回值为数字/nil(无权限或不可靠)中的一个状态

```lua
score1, score2, score3 = srta.get_apps(model1, model2, model1) -- 获取模型分，可支持多个。
-- 以下为字段返回值示例
score1 = 0
score2 = 80
score3 = nil
```

#### 4.5.4 主函数入口

业务逻辑由使用方实现，为便于系统调用，约定使用main函数名。该函数无入口参数，后续所需数据通过调用内置函数获取

```lua
function main()
    didData = srta.get_dsdata(srta.DS_DID) -- 获取DID数据
    
    -- 客户逻辑
    
end
```

较为完整的使用示例

```lua
-- 客户自定义变量，便于理解
IDXU8_NEWS = 1
IDXU8_MUISIC = 2
IDXU8_VIDEO = 3

IDXFLAG_NEWS = 1
IDXFLAG_MUSIC = 2

function main()
    didData = srta.get_dsdata(srta.DS_DID) -- 获取DID数据
    targets = srta.get_targets()
    local results = {} -- 返回结果
    
    for i, targetid in ipairs(targets) do -- 遍历待决策策略ID
        if targetid == "news" then -- 新闻拉活策略
            local is_news_installed = didData[srta.U8][IDXU8_NEWS] == 1 -- 是否新闻已安装
            local is_news_touched = didData[srta.U8][IDXFLAG_NEWS] -- 是否新闻已完成当天唤起
            if is_news_installed and is_news_touched then
                result[targetid] = { [srta.TARGETINFO_ENABLE] = true } -- 已安装未拉活，可出拉活广告
            end
        end

        if targetid == "music" then -- 音乐拉活策略
            local is_music_installed = didData[srta.U8][IDXU8_MUSIC] == 1 -- 是否音乐已安装
            local is_music_touched = didData[srta.U8][IDXFLAG_MUSIC] -- 是否音乐已完成当天唤起
            if is_music_installed and is_music_touched then
                result[targetid] = { [srta.TARGETINFO_ENABLE] = true } -- 已安装未拉活，可出拉活广告
            end
        end
    
        if targetid == "video_for_new" then -- 视频拉新策略
            local is_video_not_installed = didData[srta.U8][IDXU8_VIDEO] == 0 -- 是否视频未安装
            if is_video_not_installed then
                result[targetid] = { [srta.TARGETINFO_ENABLE] = true } -- 未安装，可出拉新广告
            end
        end
    end
end
```

#### 4.5.5 主函数返回

主函数返回一个结果，为table格式并可引用srta常量以设置以下成员编号

| 成员 | 类型 | 功能 |
| :--- | :--- | :-- |
| srta.TARGETINFO_ENABLE | bool | 策略是否参竞 |
| srta.TARGETINFO_CPC_PRICE | int | 策略CPC出价 |
| srta.TARGETINFO_CPA_PRICE | int | 策略CPA出价 |
| srta.TARGETINFO_USER_WEIGHT_FACTOR | float | 策略用户权重系数 |
| srta.TARGETINFO_CPC_FACTOR | float | 策略CPC出价系数 |

#### 4.5.6 实验分桶
TODO

#### 4.5.7 上报统计
TODO

#### 4.5.8 自助联调
TODO

## 5 业务场景实践

algo写不动了，等更新吧