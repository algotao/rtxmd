---
sidebar_position: 3
toc_min_heading_level: 2
toc_max_heading_level: 5
description: 深入解析程序化广告数据管理协议，掌握RTA SaaS系统核心操作！本文详细介绍了数据交互的proto协议、API域名、请求与返回格式、加密规则及命令状态码，涵盖任务管理、策略绑定、实时读写等关键功能，为广告主提供高效、精准的数据管理指南。
keywords: [程序化广告, 数据管理, RTA SaaS系统, proto协议, API域名, 加密规则, 命令状态码, 任务管理, 策略绑定, 实时读写]
---

# 3 API使用说明

## 3.1 交互协议proto

协议源码地址（协议在高频变动中，最新版本请拉取 [git源码](https://git.algo.com.cn/public/saasapi.git)：

```protobuf
syntax = "proto3";

package saasapi;

option go_package = "git.algo.com.cn/public/saasapi";

// SaasReq 命令请求
message SaasReq {
    oneof cmd {
        Info info                                = 5;   // 获取账号设置

        Read read                                = 10;  // 批量读取
        Write write                              = 11;  // 批量写入
        ColumnWrite column_write                 = 12;  // 全量列式写入

        Task task_create                         = 20;  // 任务创建
        TaskList task_list                       = 21;  // 列出任务
        TaskRun task_run                         = 22;  // 执行任务
        TaskDelete task_delete                   = 23;  // 删除任务
        TaskInfo task_info                       = 24;  // 任务详情

        TargetList target_list                   = 50;  // 列出策略及绑定

        BindSet bind_set                         = 61;  // 设置绑定
        BindDelete bind_delete                   = 62;  // 解除绑定

        ScriptRun script_run                     = 90;  // 运行脚本
        ScriptUpdate script_update               = 91;  // 脚本升级

        ExpList exp_list                         = 100; // 列出实验
        ExpGet exp_get                           = 101; // 获取实验报表
    }
}

// Info 获取账号信息
message Info {

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
}

// Uint32s 写入uint32区域
message Uint32s {
    repeated uint32 uint32s                      = 1;   // 写入的uint32
    uint64 index_1                               = 2;   // 写入uint32的索引值(0..7) 最多 8 个
}

// FlagsWithExpire 写入标志位区域
message FlagsWithExpire {
    repeated FlagWithExpire flags_with_expire    = 1;   // 写入的标志位
    uint64 index_1                               = 2;   // 写入标志位的索引值(0..3) 最多 4 个
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
    uint64 task_block_size                       = 6;   // 文件块字节大小（推荐50M）
    string source_path                           = 7;   // 任务数据源路径
    uint64 task_size                             = 8;   // 任务所有文件的总大小

    // 以下字段只在返回时填写，用于提供服务端的任务状态。在请求时填写会被忽略
    string create_time                           = 10;   // 创建时间
    string run_time                              = 11;   // 运行时间
    string finish_time                           = 12;   // 完成时间
    uint32 running_block                         = 13;   // 正在运行的块编号
    uint32 total_block                           = 14;   // 总块数

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

// FileInfo 任务文件信息
message FileInfo {
    string file_name                             = 1;   // 文件名
    uint64 file_size                             = 2;   // 文件大小
    repeated FileBlock file_blocks               = 3;   // 文件块列表
}

// FileBlock 文件块信息
message FileBlock {
    string block_sha256                          = 1;   // 块的sha256
    uint64 block_length                          = 2;   // 块的字节长度
    bool uploaded                                = 3;   // 是否已上传（在TaskCreate/TaskInfo请求返回）
}

// TargetList 列出策略
message TargetList {
    repeated string targets                      = 1;   // 指定要列出的绑定的策略列表，如不指定则返回全部
    bool list_bind                               = 2;   // 是否同时列出绑定信息
}

// BindSet 设置绑定
message BindSet {
    repeated Bind binds                          = 2;   // 设置绑定内容
}

// BindDelete 删除绑定
message BindDelete {
    repeated Bind binds                          = 2;   // 解除绑定内容
}

// ScriptRun 运行脚本
message ScriptRun {
    string lua_script                            = 1;   // 要调试的lua脚本
    string server_did                            = 2;   // 将从服务端读取该DID下的数据
    string appid                                 = 3;   // 小程序/小游戏/公众号/视频号的appid
    string server_openid                         = 4;   // 将从服务端读取该openid下的数据，需与appid配对使用
    OS os                                        = 5;   // 操作系统
}

// ScriptUpdate 升级脚本
message ScriptUpdate {
}

// ExpList 列出实验
message ExpList {

}

// ExpGet 获取实验报表
// select base_fields, {EXT_FIELDS} 
// where day between {WHERE_BEGIN_DAY} and {WHERE_END_DAY} 
//    and expid in {WHERE_EXP_ID}
//    and target = {WHERE_TARGET}
//    and advertiser_id in {WHERE_ADVERTISER_ID}
// group by {GROUP_BY}
message ExpGet {
    repeated string ext_fields                   = 1;   // 扩展字段（除基础字段必然输出外，其余字段需在这里填写，也可以使用*输出全部扩展字段）
    uint64 where_begin_day                       = 10;  // 起始日期
    uint64 where_end_day                         = 11;  // 结束日期
    repeated uint32 where_bucket_id              = 12;  // 实验ID(1-10)
    string where_target                          = 13;  // 策略ID
    repeated uint64 where_advertiser_id          = 14;  // 广告主ID
    repeated string group_by                     = 20;  // 当前支持广告主ID(advertiser_id)
    uint32 total_flag                            = 30;  // 是否汇总，0=不汇总，1=汇总
}

// SaasRes 命令返回
message SaasRes {
    ErrorCode code                               = 1;  // 返回码
    string status                                = 2;  // 返回信息的文本提示
    oneof res {
        InfoRes info_res                         = 5;  // 账号信息返回

        ReadRes read_res                         = 10;  // 读取命令返回
        WriteRes write_res                       = 11;  // 写入命令返回

        Task task_create_res                     = 20;  // 创建任务返回状态
        TaskListRes task_list_res                = 21;  // 任务列表返回状态
        Task task_run_res                        = 22;  // 运行任务返回状态
        Task task_delete_res                     = 23;  // 删除任务返回状态
        Task task_info_res                       = 24;  // 任务详情返回状态

        TargetListRes target_list_res            = 50;  // 列出策略及绑定返回状态

        BindSetRes bind_set_res                  = 61;  // 设置绑定返回状态
        BindDeleteRes bind_delete_res            = 62;  // 删除绑定返回状态

        ScriptRunRes script_run_res              = 90;  // 运行脚本返回
        ScriptUpdateRes script_update_res        = 91;  // 升级脚本返回

        ExpListRes exp_list_res                  = 100; // 实验列表返回
        ExpGetRes exp_get_res                    = 101; // 实验报表返回
    }
}

message DataSpace {
    repeated string did                          = 1;   // 设备ID区
    repeated string wuid                         = 2;   // OpenID区
}

// InfoRes 账号信息返回
message InfoRes {
    DataSpace dataspace                          = 1;  // 可用数据区列表
    repeated string target_id                    = 2;  // 策略ID列表

}

// ReadRes 读记录返回
message ReadRes {
    uint32 succ_cmd_count                        = 1;  // 成功的命令数量
    uint32 fail_cmd_count                        = 2;  // 失败的命令数量
    repeated ValueItem cmd_res                   = 3;  // 返回的命令
}

// WriteRes 写记录返回
message WriteRes {
    //uint32 succ_cmd_count                      = 1;  // 成功的命令数量
    //uint32 fail_cmd_count                      = 2;  // 失败的命令数量
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
    uint32 version                               = 7;  // 存储版本
}

// TaskListRes 任务列表返回
message TaskListRes {
    repeated Task tasks                          = 1;  // 任务列表
}

// TargetListRes 策略列表返回
message TargetListRes {
    map<string, Binds> target_list               = 1;  // 绑定列表
}

message Binds {
    repeated Bind binds                          = 1; 
}

// Bind 绑定信息
message Bind {
    int64 bind_id                                = 1;  // 绑定的ID
    BindType bind_type                           = 2;  // 绑定类型
    string target_id                             = 3;  // 策略ID
    int64 account_id                             = 4;  // 广告主ID
    BindSourceType bind_source                   = 5;  // 绑定操作来源
}


// BindType 绑定类型
enum BindType {
    UnknownBindType                              = 0;
    AdgroupId                                    = 1;  // 广告
    AccountId                                    = 3;  // 广告主
}

// BindSourceType 绑定操作来源
enum BindSourceType {
    DefaultBindSourceType                        = 0;  // 广告主或未填写
    ThirdPartyApi                                = 1;  // 第三方API
    ADQ                                          = 2;  // ADQ平台
    MP                                           = 3;  // MP平台
    MktApi                                       = 4;  // MarketingAPI
}

// BindSetRes 设置绑定返回
message BindSetRes {
    int32 success_num                            = 1;  // 成功数
    int32 error_num                              = 2;  // 错误数
    repeated BindError errors                    = 3;  // 绑定错误的记录
}

// BindDeleteRes 删除绑定返回
message BindDeleteRes {
    int32 success_num                            = 1;  // 成功数
    int32 error_num                              = 2;  // 错误数
    repeated BindError errors                    = 3;  // 绑定错误的记录
}

// BindError 绑定错误信息
message BindError {
    int64 bind_id                                = 1;  // 错误绑定的绑定ID
    int32 bind_type                              = 2;  // 绑定类型
    string reason                                = 3;  // 错误绑定原因
}


// ScriptRunRes 运行脚本返回
message ScriptRunRes {
    string print_output                           = 1;  // print输出
    string error_output                           = 2;  // 错误信息
    string targets_output                         = 3;  // 策略输出
    string dataspace_out                          = 4;  // 数据区输出
}

// ScriptUpdateRes 升级脚本返回
message ScriptUpdateRes {
}

// ExpListRes 实验列表返回
message ExpListRes {
    repeated ExpBucket buckets                    = 1;  // 实验桶
}

message ExpBucket {
    uint32 bucket_id                              = 1;  // 分桶号
    uint32 pt_exp_id                              = 2;  // 平台实验ID
    uint32 percent                                = 3;  // 流量百分比
}

// ExpGetRes 实验报表返回
message ExpGetRes {
    repeated ExpData exp_data                      = 1;  // 实验数据
}

message ExpData {
    uint64 time                                    = 1;  // 日期
    uint32 bucket_id                               = 2;  // 分桶ID
    ExpBaseFields base_fields                      = 3;  // 基础字段
    map <string, double> ext_fields                = 4;  // 扩展字段
    map<string, uint64> group                      = 5;  // 分组
}

message ExpBaseFields {
    double cost                                   = 1;  // 花费
    int64 exposure                                = 2;  // 曝光量
    int64 click                                   = 3;  // 点击量
    double cpm                                    = 4;  // 千次曝光价格
    double cpc                                    = 5;  // 单次点击价格
    double cpa                                    = 6;  // 单次转化成本
    double ctr                                    = 7;  // 点击率
    double cvr                                    = 8;  // 浅层转化率
    double cvr_second                             = 9;  // 深层转化率
    int64 conversion                              = 10; // 浅层转化量
    int64 conversion_second                       = 11; // 深层转化量
}

// ErrorCode 返回码
enum ErrorCode {
    SUCC                                         = 0;   // 成功
    INVALID_ACCOUNT                              = 101; // Account不合法
    INVALID_TIMESTAMP                            = 102; // 头信息缺少时间戳或不正确
    INVALID_SIGNATURE                            = 103; // 头信息缺少签名
    AUTH_FAIL                                    = 104; // 签名校验失败
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

    API_ERROR                                    = 301; // 调用内部API错误

    TARGET_ERROR                                 = 401; // Target参数错误
}

enum CmdErrorCode {
    OK                                           = 0;   // 成功
}

// TaskStatus 任务状态
enum TaskStatus {
    ALL                                          = 0;   // 全部
    WAITING                                      = 1;   // 等待中
    READY                                        = 2;   // 上传完毕
    RUNNING                                      = 3;   // 运行中
    SUCCESS                                      = 4;   // 成功
    FAIL                                         = 5;   // 失败

    DELETED                                      = 10;  // 已删除，仅在执行删除成功时返回
}

enum OS {
    OS_UNKNOWN                                   = 0;
    IOS                                          = 1; 
    ANDROID                                      = 2;
}

// MAX 最大限定
enum MAX {
    MAX_UNKNOWN                                  = 0;
    U8                                           = 64;
    U32                                          = 8;
    FLAG                                         = 4;
}
```

## 3.2 API域名

数据管理测试URL：https://srta.algo.com.cn
:::tip
非官方地址的沙盒环境，仅用于测试，请不要上传真实数据。
:::

:::warning
测试环境有可能会存在不稳定或服务关闭现象，在使用前请与研发先确认。 
:::

**数据管理正式URL：https://api.rta.qq.com**

## 3.3 API请求

HTTP Method：POST

HTTP Header 包含以下信息

| 字段名称 | 必填 | 描述 |
| :--- | :--- | :--- |
| Account | 是 | 客户在RTA SaaS系统中的账号ID |
| Authorization | 是 | 加密串32位md5，生成规则见下文 |
| Time | 是 | 请求发生的时间戳（秒），10位数字 |
| Content-Type | 是 | 固定值：application/x-protobuf <br/><br/>**特殊**：在使用/saas/task/upload接口时，该项值为application/octet-stream |
| Content-Encoding | **在上传时必填** | 当前服务端支持：gzip |

## 3.4 加密串生成规则

Authorization=md5(Account+Token+Time)

注：Token为RTA前台设置的一个字符串，由 RTA团队提供

例:

    Account=2000，Token=ABCDEF，Time=1743995833

    Authorization=md5(2000ABCDEF1743995833) = 8cc93e93ba55ccd546f1f44f437df04b

注：平台RTA服务器会对time与Authorization参数进行校验

1. time与RTA服务器时间gap超过30min，则验证失败
2. Authorization值和SaaS服务器按以上规则生成的值不一致，则验证失败

## 3.5 API返回格式

API以protobuf格式返回，返回信息为SaasRes结构

## 3.6.命令状态码定义

| 状态码 | proto常量 | 描述 |
| :--- | :--- | :--- |
| 0 | SUCC | 成功 |
| 101 | INVALID_ACCOUNT | Account不合法 |
| 102 | INVALID_TIMESTAMP | 头信息缺少时间戳或不正确 |
| 103 | INVALID_SIGNATURE | 头信息缺少签名 |
| 104 | AUTH_FAIL | 签名校验失败 |
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
| 301 | API_ERROR | 调用内部API错误 |
| 401 | TARGET_ERROR | 策略ID错误 |

## 3.7 任务状态码/过滤码定义

| 状态码 | proto常量 | 描述 |
| :--- | :--- | :--- |
| 0 | ALL | 全部 |
| 1 | WAITING | 等待中 |
| 2 | READY | 上传完毕 |
| 3 | RUNNING | 运行中 |
| 4 | SUCCESS | 成功 |
| 5 | FAIL | 失败 |
| 10 | DELETED | 已删除，仅在执行删除成功时返回 |

## 3.8 实践建议

+ **人群包上传**：使用任务接口，支持亿级处理。 
  1. 准备好数据（每一行为WriteItem 的json化内容），如存在多个文件，请放入同一目录。
  2. 生成任务信息。遍历文件，分片计算sha256（单个分片大小上下限为 10-200MB，推荐 200M，文件尾不足分片大小的，按实际大小计算），填写任务结构。
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

## 3.9 基础协议

**请求参数**：

| 字段名称 | 字段类型 | 必填 | 描述 |
| :--- | :--- | :--- | :--- |
| SaasReq | SaasReq | 是 | 请求消息结构 |
|  |  |  | 以下字段根据操作选择 **唯一** 的一个 |
| SaasReq.info | [Info](#310-获取账号设置-info) | 唯一 | 获取账号设置 |
| SaasReq.read | [Read](#311-实时读-read) | 唯一 | 实时读取数据 |
| SaasReq.write | [Write](#312-实时写-write) | 唯一 | 实时写入数据 |
| SaasReq.task_create | [TaskCreate](#314-任务-创建-taskcreate) | 唯一 | 任务创建 |
| SaasReq.task_list | [TaskList](#315-任务-列表-tasklist) | 唯一 | 任务列表 |
| SaasReq.task_run | [TaskRun](#316-任务-执行-taskrun) | 唯一 | 任务执行 |
| SaasReq.task_delete | [TaskDelete](#317-任务-删除-taskdelete) | 唯一 | 任务删除 |
| SaasReq.task_info | [TaskInfo](#318-任务-详情-taskinfo) | 唯一 | 任务详情 |
| SaasReq.target_list | [TargetList](#320-策略-列表-targetlist) | 唯一 | 列出策略及绑定 |
| SaasReq.bind_set | [BindSet](#321-策略绑定-设置-bindset) | 唯一 | 设置绑定 |
| SaasReq.bind_delete | [BindDelete](#322-策略绑定-解除-binddelete) | 唯一 | 解除绑定 |
| SaasReq.script_run | [ScriptRun](#323-脚本-运行-scriptrun) | 唯一 | 调试运行脚本 |
| SaasReq.script_update | [ScriptUpdate](#324-脚本-运行-scriptupdate) | 唯一 | 更新脚本 |
| SaasReq.exp_list | [ExpList](#325-实验-列表-explist) | 唯一 | 实验列表 |
| SaasReq.exp_get | [ExpGet](#326-实验-报表-expdata) | 唯一 | 实验报表 |


**返回参数**：

| 字段名称 | 字段类型 | 必填 | 描述 |
| :--- | :--- | :--- | :--- |
| SaasRes | SaasRes | 是 | 返回消息结构 |
| SaasRes.code | ErrorCode | 是 | 返回状态码，请查阅[命令状态码定义](#36命令状态码定义) |
| SaasRes.status | string | 否 | 返回状态描述 |
|  |  |  | 以下字段根据操作返回 **唯一** 的一个 |
| SaasRes.info | [InfoRes](#310-获取账号设置-info) | 唯一 | 账号信息返回 |
| SaasRes.read_res | [ReadRes](#311-实时读-read) | 唯一 | 实时读取数据返回状态 |
| SaasRes.write_res | [WriteRes](#312-实时写-write) | 唯一 | 实时写入数据返回状态 |
| SaasRes.task_create_res | [Task](#314-任务-创建-taskcreate) | 唯一 | 任务创建返回状态 |
| SaasRes.task_list_res | [TaskListRes](#315-任务-列表-tasklist) | 唯一 | 任务列表返回状态 |
| SaasRes.task_run_res | [Task](#316-任务-执行-taskrun) | 唯一 | 任务执行返回状态 |
| SaasRes.task_delete_res | [Task](#317-任务-删除-taskdelete) | 唯一 | 任务删除返回状态 |
| SaasRes.task_info_res | [Task](#318-任务-详情-taskinfo) | 唯一 | 任务详情返回状态 |
| SaasRes.target_list_res | [TargetListRes](#320-策略-列表-targetlist) | 唯一 | 列出策略及绑定返回状态 |
| SaasRes.bind_set_res | [BindSetRes](#321-策略绑定-设置-bindset) | 唯一 | 任务详情返回状态 |
| SaasRes.bind_delete_res | [BindDeleteRes](#322-策略绑定-解除-binddelete) | 唯一 | 设置绑定返回状态 |
| SaasRes.script_run_res | [ScriptRun](#323-脚本-运行-scriptrun) | 唯一 | 调试运行脚本返回状态 |
| SaasRes.script_update_res | [ScriptUpdate](#324-脚本-运行-scriptupdate) | 唯一 | 更新脚本返回状态 |
| SaasRes.exp_list_res | [ExpList](#325-实验-列表-explist) | 唯一 | 实验列表返回状态 |
| SaasRes.exp_get_res | [ExpGet](#326-实验-报表-expdata) | 唯一 | 实验报表返回状态 |

## 3.10 获取账号设置 Info

**说明**：该接口用于查询账号信息

**接口**：/saas/info

**请求参数**：

表格节点位于 SaasReq.info

| 字段名称 | 字段类型 | 必填 | 描述 |
| :--- | :--- | :--- | :--- |
| | | | 空 |

**返回参数**：

表格节点位于 SaasRes.info_res

| 字段名称 | 字段类型 | 必填 | 描述 |
| :--- | :--- | :--- | :--- |
| dataspace | array of DataSpace | 否 | 可用数据区列表 |
| dataspace.did | array of string | 否 | 设备ID数据分区号 |
| dataspace.wuid | array of string | 否 | OpenId数据分区号 |
| target_id | array of string  | 否 | 策略ID列表 |

## 3.11 实时读 Read

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
| succ_cmd_count | uint32 | 是 | 成功的命令数量 |
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

## 3.12 实时写 Write

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
| write_item.write_uint32s | Uint32s | 否 | 写入的uint32类型数值 |
| write_item.write_uint32s.uint32s | array of uint32 | 是 | 写入的uint32数组，每个uint32 的填写编号由下面index决定 |
| write_item.write_uint32s.index_1 | uint64 | 是 | 写入uint32的索引值(0..7)，位置使用bit位表示 |
| write_item.write_flags_with_expire | FlagsWithExpire | 否 | 写入的标志位类型值 |
| write_item.write_flags_with_expire.flags_with_expire | array of FlagWithExpire | 是 | 写入的标志位 |
| write_item.write_flags_with_expire.flags_with_expire.flag | bool | 是 | 标志位。在读取时，标志位未过期则返回flag值，过期则返回default_flag值 |
| write_item.write_flags_with_expire.flags_with_expire.default_flag | bool | 否 | 默认标志位。过期后则回到默认值 |
| write_item.write_flags_with_expire.flags_with_expire.expire | uint32 | 否 | 过期时间，为 0 则永不过期 |
| write_item.write_flags_with_expire.index_1 | uint64 | 是 | 写入flag的索引值(0..3)，位置使用bit位表示 |

**返回参数**：

表格节点位于 SaasRes.write_res

| 字段名称 | 字段类型 | 必填 | 描述 |
| :--- | :--- | :--- | :--- |
| failed_userid | array of string | 否 | 失败的用户ID |

## 3.13 全列覆盖写(暂不可用) ColumnWrite

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
| write_uint32s | Uint32s | 否 | 写入的uint32类型数值 |
| write_uint32s.uint32s | array of uint32 | 是 | 写入的uint32数组，每个uint32 的填写编号由下面index决定 |
| write_uint32s.index_1 | uint64 | 是 | 写入uint32的索引值(0..7)，位置使用bit位表示 |
| write_flags_with_expire | FlagsWithExpire | 否 | 写入的标志位类型值 |
| write_flags_with_expire.flags_with_expire | array of FlagWithExpire | 是 | 写入的标志位 |
| write_flags_with_expire.flags_with_expire.flag | bool | 是 | 标志位。在读取时，标志位未过期则返回flag值，过期则返回default_flag值 |
| write_flags_with_expire.flags_with_expire.default_flag | bool | 否 | 默认标志位。过期后则回到默认值 |
| write_flags_with_expire.flags_with_expire.expire | uint32 | 否 | 过期时间，为 0 则永不过期 |
| write_flags_with_expire.index_1 | uint64 | 是 | 写入flag的索引值(0..3)，位置使用bit位表示 |

**返回参数**：

仅使用顶层节点 SaasRes.code/SaasRes.status 表达操作成功/失败状态

## 3.14 任务-创建 TaskCreate

**说明**：任务用于大批量集中上传写入。适用于对亿级用户的一个或多列进行（byte、uint32、flag）变更，具有并发写入量大，批量集中执行的特点。该接口用于创建一个任务，通过描述待上传数据的摘要信息，允许后续任务数据的分块分批上传。新创建的任务将在 7 天内有效并等待分块上传，待任务数据全部上传完毕后，再通过运行接口执行写入任务。超过 7 天的任务自动删除。

**接口**：/saas/task/create

**请求参数**：

表格节点位于 SaasReq.task_create

| 字段名称 | 字段类型 | 必填 | 描述 |
| :--- | :--- | :--- | :--- |
| dataspace_id | string | 是 | 数据空间ID，当前支持did(设备号)、wuid(openid) |
| appid | string | 否 | 如appid不为空，且dataspace_id必须wuid，表示数据空间为wuid（微信生态用户标识） |
| task_sha256 | string | 是 | 任务sha256 |
| task_description | string | 否 | 任务描述，不重要，它是个对客户的助记符 |
| task_file_infos | array of FileInfo | 是 | 文件列表 |
| task_file_infos.file_name | string | 否 | 文件名，不重要，它是个对客户的助记符 |
| task_file_infos.file_size | uint64 | 是 | 文件大小 |
| task_file_infos.file_blocks | array of FileBlock | 是 | 文件块列表 |
| task_file_infos.file_blocks.block_sha256 | string | 是 | 块的sha256 |
| task_file_infos.file_blocks.block_size | uint64 | 是 | 块的大小。一般情况下块大小与task_block_size 一致，文件最后一块除外 |
| task_block_size | uint64 | 是 | 块的大小 |
| source_path | string | 是 | 任务数据源路径 |
| task_size | uint64 | 是 | 任务所有文件的总大小 |

**返回参数**：

表格节点位于 SaasRes.task_create_res

| 字段名称 | 字段类型 | 必填 | 描述 |
| :--- | :--- | :--- | :--- |
| dataspace_id | string | 是 | 数据空间ID，当前支持did(设备号)、wuid(openid) |
| appid | string | 否 | 如appid不为空，且dataspace_id必须wuid，表示数据空间为wuid（微信生态用户标识） |
| task_sha256 | string | 是| 任务sha256 |
| task_description | string | 否 | 任务描述，不重要，它是个对客户的助记符 |
| task_file_infos | array of FileInfo | 是 | 文件列表 |
| task_file_infos.file_name | string | 否 | 文件名，不重要，它是个对客户的助记符 |
| task_file_infos.file_size | uint64 | 是 | 文件大小 |
| task_file_infos.file_blocks | array of FileBlock | 是 | 文件块列表 |
| task_file_infos.file_blocks.block_sha256 | string | 是 | 块的sha256 |
| task_file_infos.file_blocks.block_size | uint64 | 是 | 块的大小。一般情况下块大小与task_block_size 一致，文件最后一块除外。 |
| task_file_infos.file_blocks.uploaded | bool | 否 | 分块是否已上传。即使是刚创建的任务，也有可能因为分块曾经上传过而将此值标记为true。已经上传的分块无须再次上传 |
| task_block_size | uint64 | 是 | 块的大小 |
| source_path | string | 否 | 任务数据源路径 |
| task_size | uint64 | 否 | 任务所有文件的总大小 |
| create_time | string | 是 | 创建时间 |
| run_time | string | 否 | 运行时间 |
| finish_time | string | 否 | 完成时间 |
| running_block | uint32 | 否 | 当前运行块 |
| total_block | uint32 | 否 | 总块数 |
| status | TaskStatus | 是 | 任务状态<br/>WAITING = 1;// 等待中<br/>READY = 2;// 上传完毕<br/>RUNNING = 3;// 运行中<br/>SUCCESS = 4;// 成功<br/>FAIL = 5;// 失败<br/>DELETED = 10; // 已删除，仅在执行删除成功时返回 |

## 3.15 任务-列表 TaskList

**说明**：该接口用于列出任务，查看各任务的状态。

**接口**：/saas/task/list

**请求参数**：

表格节点位于 SaasReq.task_list

| 字段名称 | 字段类型 | 必填 | 描述 |
| :--- | :--- | :--- | :--- |
| status_filter | TaskStatus | 否 | 任务状态<br/>WAITING = 1;// 等待中<br/>READY = 2;// 上传完毕<br/>RUNNING = 3;// 运行中<br/>SUCCESS = 4;// 成功<br/>FAIL = 5;// 失败<br/>DELETED = 10; // 已删除，仅在执行删除成功时返回 |

**返回参数**：

表格节点位于 SaasRes.task_list_res
| 字段名称 | 字段类型 | 必填 | 描述 |
| :--- | :--- | :--- | :--- |
| tasks | array of Task | 是 | 任务信息列表 |
| tasks.dataspace_id | string | 是 | 数据空间ID，当前支持did(设备号)、wuid(openid) |
| tasks.appid | string | 否 | 如appid不为空，且dataspace_id必须wuid，表示数据空间为wuid（微信生态用户标识） |
| tasks.task_sha256 | string | 是 | 任务sha256 |
| tasks.task_description | string | 否 | 任务描述，不重要，它是个对客户的助记符 |
| tasks.task_block_size | uint64 | 是 | 块的大小 |
| tasks.source_path | string | 否 | 任务数据源路径 |
| tasks.task_size | uint64 | 否 | 任务所有文件的总大小 |
| tasks.create_time | string | 是 | 创建时间 |
| tasks.run_time | string | 否 | 运行时间 |
| tasks.finish_time | string | 否 | 完成时间 |
| tasks.running_block | uint32 | 否 | 当前运行块 |
| tasks.total_block | uint32 | 否 | 总块数 |
| tasks.status | TaskStatus | 是 | 任务状态<br/>WAITING = 1;// 等待中<br/>READY = 2;// 上传完毕<br/>RUNNING = 3;// 运行中<br/>SUCCESS = 4;// 成功<br/>FAIL = 5;// 失败<br/>DELETED = 10; // 已删除，仅在执行删除成功时返回 |

## 3.16 任务-执行 TaskRun

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
| dataspace_id | string | 是 | 数据空间ID，当前支持did(设备号)、wuid(openid) |
| appid | string | 否 | 如appid不为空，且dataspace_id必须wuid，表示数据空间为wuid（微信生态用户标识） |
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
| source_path | string | 否 | 任务数据源路径 |
| task_size | uint64 | 否 | 任务所有文件的总大小 |
| create_time | string | 是 | 创建时间 |
| run_time | string | 否 | 运行时间 |
| finish_time | string | 否 | 完成时间 |
| running_block | uint32 | 否 | 当前运行块 |
| total_block | uint32 | 否 | 总块数 |
| status | TaskStatus | 是 | 任务状态<br/>WAITING = 1;// 等待中<br/>READY = 2;// 上传完毕<br/>RUNNING = 3;// 运行中<br/>SUCCESS = 4;// 成功<br/>FAIL = 5;// 失败<br/>DELETED = 10; // 已删除，仅在执行删除成功时返回 |

## 3.17 任务-删除 TaskDelete

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
| dataspace_id | string | 是 | 数据空间ID，当前支持did(设备号)、wuid(openid) |
| appid | string | 否 | 如appid不为空，且dataspace_id必须wuid，表示数据空间为wuid（微信生态用户标识） |
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
| source_path | string | 否 | 任务数据源路径 |
| task_size | uint64 | 否 | 任务所有文件的总大小 |
| create_time | string | 是 | 创建时间 |
| run_time | string | 否 | 运行时间 |
| finish_time | string | 否 | 完成时间 |
| running_block | uint32 | 否 | 当前运行块 |
| total_block | uint32 | 否 | 总块数 |
| status | TaskStatus | 是 | 任务状态<br/>WAITING = 1;// 等待中<br/>READY = 2;// 上传完毕<br/>RUNNING = 3;// 运行中<br/>SUCCESS = 4;// 成功<br/>FAIL = 5;// 失败<br/>DELETED = 10; // 已删除，仅在执行删除成功时返回 |

## 3.18 任务-详情 TaskInfo

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
| dataspace_id | string | 是 | 数据空间ID，当前支持did(设备号)、wuid(openid) |
| appid | string | 否 | 如appid不为空，且dataspace_id必须wuid，表示数据空间为wuid（微信生态用户标识） |
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
| source_path | string | 否 | 任务数据源路径 |
| task_size | uint64 | 否 | 任务所有文件的总大小 |
| create_time | string | 是 | 创建时间 |
| run_time | string | 否 | 运行时间 |
| finish_time | string | 否 | 完成时间 |
| running_block | uint32 | 否 | 当前运行块 |
| total_block | uint32 | 否 | 总块数 |
| status | TaskStatus | 是 | 任务状态<br/>WAITING = 1;// 等待中<br/>READY = 2;// 上传完毕<br/>RUNNING = 3;// 运行中<br/>SUCCESS = 4;// 成功<br/>FAIL = 5;// 失败<br/>DELETED = 10; // 已删除，仅在执行删除成功时返回 |

## 3.19 任务-上传数据文件分片 TaskUpload

**说明**：该接口用于上传文件分块内容。注意该接口并不需要protobuf 的命令请求，而是以POST body 的方式直接上传文件内容分块，内容分块在上传时 `必须使用gzip压缩`。返回结果仍遵循protobuf协议。如上传大小超限，则会直接以 HTTP 413 状态码返回。

此项请求与其他不同，请参阅 [API请求](#33-api请求)

**接口**：/saas/task/upload

**请求参数**：（以url param 的形式填写）

| 字段名称 | 字段类型 | 必填 | 描述 |
| :--- | :--- | :--- | :--- |
| block_sha256 | string | 是 | 块的sha256 |

**返回参数**：

顶层节点 SaasRes.code/SaasRes.status 表达操作成功/失败状态

## 3.20 策略-列表 TargetList

**说明**：该接口用于查看策略列表，以及获取完整绑定列表。

**接口**：/saas/target/list

**请求参数**：

表格节点位于 SaasReq.target_list

| 字段名称 | 字段类型 | 必填 | 描述 |
| :--- | :--- | :--- | :--- |
| targets | array of string | 否 | 当该项为空时，获取所有策略。当该项有一个或更多值时，则仅列出列表内的策略 |
| list_bind | bool | 否 | 是否同时列出绑定信息 |


**返回参数**：

顶层节点 SaasRes.code/SaasRes.status 表达操作成功/失败状态

表格节点位于 SaasRes.target_list_res


| 字段名称 | 字段类型 | 必填 | 描述 |
| :--- | :--- | :--- | :--- |
| target_list | map of Binds | 否 | 策略及绑定列表 |
| target_list.\<key\> | string | 否 | 策略ID |
| target_list.binds.bind_id | int64 | 否 | 绑定的ID |
| target_list.binds.bind_type | BindType | 是 | 绑定类型<br/>AdgroupId = 1;//广告ID<br/>AccountId = 3;//广告主ID  |
| target_list.binds.account_id | int64 | 否 | 广告主ID |
| target_list.binds.bind_source | BindSourceType | 否 | 绑定操作来源<br/>DefaultBindSourceType = 0;  //广告主或未填写<br/>ThirdPartyApi = 1;//第三方API<br/>ADQ = 2;//ADQ平台<br/>MP = 3;//MP平台<br/>MktApi = 4;//MarketingAPI |

## 3.21 策略绑定-设置 BindSet

**说明**：该接口用于将广告主ID或广告ID绑定至策略。如相关ID已绑定至其它策略，使用本功能将覆盖原绑定。

**接口**：/saas/bind/set

**请求参数**：

表格节点位于 SaasReq.bind_set

| 字段名称 | 字段类型 | 必填 | 描述 |
| :--- | :--- | :--- | :--- |
| binds | array of Binds | 是 | 绑定列表 |
| binds.bind_id | int64 | 是 | 绑定的ID |
| binds.bind_type | BindType | 是 | 绑定类型<br/>AdgroupId = 1;//广告ID<br/>AccountId = 3;//广告主ID  |
| binds.account_id | int64 | 是 | 广告主ID |
| binds.bind_source | BindSourceType | 否 | 绑定操作来源<br/>DefaultBindSourceType = 0;  //广告主或未填写<br/>ThirdPartyApi = 1;//第三方API<br/>ADQ = 2;//ADQ平台<br/>MP = 3;//MP平台<br/>MktApi = 4;//MarketingAPI |

**返回参数**：

顶层节点 SaasRes.code/SaasRes.status 表达全局的操作成功/失败状态。ID级别的绑定失败状态需至errors节点查看原因

表格节点位于 SaasRes.bind_set_res

| 字段名称 | 字段类型 | 必填 | 描述 |
| :--- | :--- | :--- | :--- |
| success_num | int32 | 否 | 成功数 |
| error_num | int32 | 否 | 失败数 |
| errors | array of BindError | 否 | 绑定失败的记录 |
| errors.bind_id | int64 | 是 | 绑定错误的绑定ID |
| errors.bind_type | BindType | 是 | 绑定类型<br/>AdgroupId = 1;//广告ID<br/>AccountId = 3;//广告主ID  |
| errors.reason | string | 是 | 绑定错误原因 |

## 3.22 策略绑定-解除 BindDelete

**说明**：该接口用于将广告主ID或广告ID从策略解绑。解绑成功后相关广告将不再受RTA决策控制。

**接口**：/saas/bind/delete

**请求参数**：

表格节点位于 SaasReq.bind_delete

| 字段名称 | 字段类型 | 必填 | 描述 |
| :--- | :--- | :--- | :--- |
| binds | array of Binds | 是 | 解绑列表 |
| binds.bind_id | int64 | 是 | 要解绑的ID |
| binds.bind_type | BindType | 是 | 解绑定类型<br/>AdgroupId = 1;//广告ID<br/>AccountId = 3;//广告主ID  |

**返回参数**：

顶层节点 SaasRes.code/SaasRes.status 表达全局的操作成功/失败状态。ID级别的解绑失败状态需至errors节点查看原因

表格节点位于 SaasRes.bind_delete_res

| 字段名称 | 字段类型 | 必填 | 描述 |
| :--- | :--- | :--- | :--- |
| success_num | int32 | 否 | 成功数 |
| error_num | int32 | 否 | 失败数 |
| errors | array of BindError | 否 | 解绑失败的记录 |
| errors.bind_id | int64 | 是 | 解绑错误的ID |
| errors.bind_type | BindType | 是 | 绑定类型<br/>AdgroupId = 1;//广告ID<br/>AccountId = 3;//广告主ID  |
| errors.reason | string | 是 | 错误解绑原因 |


## 3.23 脚本-运行 ScriptRun

**说明**：该接口用于调试 LUA 脚本，LUA 将在服务端沙箱环境运行并返回结果。调试模式下 print 函数将生效，可用于输出中间状态。关于该函数使用的更多信息，请参阅[代码调试](./lua.md#56-代码调试)。

**接口**：/saas/script/run

**请求参数**：

表格节点位于 SaasReq.script_run

| 字段名称 | 字段类型 | 必填 | 描述 |
| :--- | :--- | :--- | :--- |
| lua_script | string | 是 | LUA脚本 |
| server_did | string | 是 | 将从服务端读取该DID下的数据 |
| appid | string | 否 | 小程序/小游戏/公众号/视频号的appid |
| server_openid | string | 否 | 将从服务端读取该openid下的数据，需与appid配对使用 |
| os | os OS | 否 | 操作系统<br/>IOS = 1;<br/>Android = 2;<br/>默认 2  |

**返回参数**：

顶层节点 SaasRes.code/SaasRes.status 表达全局的操作成功/失败状态。

表格节点位于 SaasRes.script_run_res

| 字段名称 | 字段类型 | 必填 | 描述 |
| :--- | :--- | :--- | :--- |
| print_output | string | 否 | 调用print函数的打印输出 |
| error_output | string | 否 | LUA脚本运行错误 |
| targets_output | string | 否 | 策略输出内容 |
| dataspace_out | string | 否 | 数据区输出内容 |


## 3.24 脚本-运行 ScriptUpdate
:::warning
当前禁用
:::

## 3.25 实验-列表 ExpList

**说明**：该接口用于查询实验列表

**接口**：/saas/exp/list

**请求参数**：

表格节点位于 SaasReq.exp_list

| 字段名称 | 字段类型 | 必填 | 描述 |
| :--- | :--- | :--- | :--- |
| | | | 空 |

**返回参数**：

表格节点位于 SaasRes.exp_list_res

| 字段名称 | 字段类型 | 必填 | 描述 |
| :--- | :--- | :--- | :--- |
| buckets | array of ExpBucket | 否 | 实验分桶列表 |
| buckets.bucket_id | uint32 | 否 | 分桶号 |
| buckets.pt_exp_id | uint32 | 否 | 平台实验ID |
| buckets.percent | uint32  | 否 | 流量百分比 |

## 3.26 实验-报表 ExpData

**说明**：该接口用于查询实验数据报表

**接口**：/saas/exp/get

**请求参数**：

表格节点位于 SaasReq.exp_get

| 字段名称 | 字段类型 | 必填 | 描述 |
| :--- | :--- | :--- | :--- |
| ext_fields | array of string | 否 | 扩展字段（除基础字段必然输出外，其余字段需在这里填写，也可以使用*输出全部扩展字段） |
| where_begin_day | uint64 | 是 | 起始日期 |
| where_end_day | uint64 | 是 | 结束日期 |
| where_bucket_id | array of uint32 | 否 | 实验分桶编号(1-10)。如该字段为空，则取全部分桶数据。 |
| where_target | string | 是 | 策略ID |
| where_advertiser_id | array of uint64 | 否 | 广告主ID。如该字段为空，则取策略下全部广告主数据。如指定广告主ID，则仅取指定数据。广告主ID必须与策略有绑定关系。 |
| group_by | array of string | 否 | 分类汇总。当前支持广告主ID(advertiser_id) |
| total_flag | uint32 | 否 | 是否汇总，0=不汇总，1=汇总 |

**返回参数**：

表格节点位于 SaasRes.exp_list_res

| 字段名称 | 字段类型 | 必填 | 描述 |
| :--- | :--- | :--- | :--- |
| exp_data | array of ExpData | 否 | 实验分桶列表 |
| exp_data.time | uint64 | 否 | 分桶号 |
| exp_data.base_fields | object of ExpBaseFields | 否 | 常用实验指标 |
| exp_data.base_fields.cost | float64 | 否 | 花费(元) |
| exp_data.base_fields.exposure | int64 | 否 | 曝光量(次) |
| exp_data.base_fields.click | int64 | 否 | 点击量(次) |
| exp_data.base_fields.cpm | float64 | 否 | 千次曝光价格(元) |
| exp_data.base_fields.cpc | float64 | 否 | 单次点击价格(元) |
| exp_data.base_fields.cpa | float64 | 否 | 单次转化成本(元) |
| exp_data.base_fields.ctr | float64 | 否 | 点击率 |
| exp_data.base_fields.cvr | float64 | 否 | 浅层转化率 |
| exp_data.base_fields.cvr_second | float64 | 否 | 深层转化率|
| exp_data.base_fields.conversion | int64 | 否 | 浅层转化量 |
| exp_data.base_fields.conversion_second | int64 | 否 | 深层转化量 |
| exp_data.ext_fields | map of \<string, float64\>  | 否 | 扩展实验指标 |
| exp_data.ext_fields.\<key\> | string  | 否 | 实验指标名称 |
| exp_data.ext_fields.\<value\> | float64  | 否 | 指标值 |
| exp_data.group | map of \<string, uint64\>  | 否 | 分组 |
| exp_data.group.\<key\> | string  | 否 | 分组名称 |
| exp_data.group.\<value\> | uint64  | 否 | 分组值 |

### 3.26.1 扩展实验指标

扩展实验指标字段仅在明确需要拉取时返回，如该字段值返回值为0，则返回字段不存在。

:::tip
扩展实验指标与广告优化目标类型及广告主回传强相关，数量庞杂。sRTA团队不提供相关指标的解释工作。
:::

| 字段名称 | 字段类型 | 描述 |
| :--- | :--- | :--- |
| og_6 | float64 | 优化目标-关注 |
| og_7 | float64 | 优化目标-点击 |
| og_10 | float64 | 优化目标-跳转按钮点击 |
| og_105 | float64 | 优化目标- 注册(App) |
| og_106 | float64 | 优化目标-次日留存 |
| og_108 | float64 | 优化目标-完成购买数量 |
| og_112 | float64 | 优化目标-快应用加桌面 |
| og_114 | float64 | 优化目标-小游戏创角 |
| og_115 | float64 | 优化目标-游戏授权 |
| og_119 | float64 | 优化目标-授信 |
| og_120 | float64 | 优化目标-提现 |
| og_121 | float64 | 优化目标-广告变现 |
| og_202 | float64 | 优化目标-商品收藏 |
| og_204 | float64 | 优化目标-下单 |
| og_205 | float64 | 优化目标-付费 |
| og_301 | float64 | 优化目标-关键页面访问 |
| og_302 | float64 | 优化目标-H5注册 |
| og_307 | float64 | 优化目标-领券 |
| og_315 | float64 | 优化目标-浏览量 |
| og_316 | float64 | 优化目标-阅读文章 |
| og_318 | float64 | 优化目标-预授信 |
| og_403 | float64 | 优化目标-电话拨打 |
| og_405 | float64 | 优化目标-表单预约 |
| og_406 | float64 | 优化目标-完件 |
| og_409 | float64 | 优化目标-有效线索 |
| og_412 | float64 | 优化目标-加企微客户 |
| og_413 | float64 | 优化目标-选课 |
| og_418 | float64 | 优化目标-外链点击 |
| og_419 | float64 | 优化目标-购券 |
| og_421 | float64 | 优化目标-加群 |
| og_501 | float64 | 优化目标-打开公众号 |
| og_503 | float64 | 优化目标-关注后点击菜单栏 |
| og_10000 | float64 | 优化目标-综合线索收集 |
| og_10004 | float64 | 优化目标-首次购买会员 |
| og_10006 | float64 | 优化目标-微信流量预约 |
| og_10007 | float64 | 优化目标-首次下单 |
| og_10008 | float64 | 优化目标-点赞 |
| og_10009 | float64 | 优化目标-咨询留资 |
| og_10601 | float64 | 优化目标-次留 |
| og_10801 | float64 | 优化目标-首次付费 |
| bo_6 | float64 | 推广目标-公众号关注数 |
| bo_7 | float64 | 推广目标-公众号内下单人数 |
| bo_23 | float64 | 推广目标-关键页面访问数 |
| bo_25 | float64 | 推广目标-公众号注册数 |
| bo_26 | float64 | 推广目标-公众号发消息数 |
| bo_41 | float64 | 推广目标-公众号付费人数 |
| 101_conversion_cost | float64 | 下单单价 |
| 204_amount | float64 | 下单金额 |
| 204_roi | float64 | 下单ROI |
| 204_roi_fd | float64 | 首日下单ROI(T+1更新) |
| 204_roi_tw | float64 | 3日下单ROI |
| 204_roi_ow | float64 | 7日下单ROI |
| 204_roi_td | float64 | 15日下单ROI |
| 204_roi_om | float64 | 30日下单ROI |
| order_cost | float64 | 下单成本 |
| order_count | float64 | 下单数 |
| roi | float64 | ROI |
| md_mg_purchase_uv | float64 | 小游戏首次付费人数 |
| md_mg_purchase_val1 | float64 | 小游戏首日付费金额（广告主回传）(分) |
| md_mg_purchase_val | float64 | 小游戏付费金额(分) |
| weapp_reg_uv | float64 | 小游戏注册人数 |
| active_count | float64 | 激活数 |
| install_count | float64 | 安装数 |
| 107_count | float64 | 加入购物车数 |
| 402_at_count | float64 | 开口数 |
| send_goods_count | float64 | 发货数(次) |
| sign | float64 | 签收数(次) |
| 409_405_at_rate | float64 | 表单有效率 |
| 409_at_cost | float64 | 有效销售线索成本 |
| 409_at_count | float64 | 有效销售线索数 |
| 415_at_cost | float64 | 试驾成本 |
| 415_at_count | float64 | 试驾数 |
| 405_at_cost | float64 | 表单预约成本(元) |
| 405_at_count | float64 | 表单预约数 |
| 108_at_cost | float64 | 完成购买成本(元) |
| 108_at_count | float64 | 完成购买数 |
| 119_aog_action | float64 | 授信数 |
| 406_aog_action | float64 | 完件数 |
| 119_cvr_click | float64 | 点击授信率 |
| 406_cvr_click | float64 | 点击完件率 |
| finance_credit_pcvr_after_cali_bias | float64 | pcvrbias金融pdcvr修正后授信(校正后) |
| finance_credit_pcvr_before_cali_bias | float64 | pcvrbias金融pdcvr修正后授信(校正前) |
| finance_apply_original_pcvr_bias | float64 | 原始pcvrbias（金融pdcvr完件） |
| industry_finance_apply_pcvr_bias | float64 | pcvrbias(金融pdcvr完件) |
| active_cost | float64 | 激活成本 |
| active_register_rate | float64 | 激活注册率 |
| md_acti_pur_val | float64 | 付费金额(激活口径) |
| md_acti_pur_val_fd_roi |  float64| 首日付费金额(激活口径) |
| md_pur_val_3 | float64 | 3日付费金额(激活口径) |
| md_pur_val_3_roi | float64 | 3日ROI(激活口径) |
| md_pur_val_7 | float64 | 7日付费金额(激活口径) |
| md_pur_val_7_roi | float64 | 7日ROI(激活口径) |
| md_pur_val_14 | float64 | 14日付费金额(激活口径) |
| md_pur_val_14_roi | float64 | 14日ROI(激活口径) |
| md_pur_val_30 | float64 | 30日付费金额(激活口径) |
| md_pur_val_30_roi | float64 | 30日ROI(激活口径) |
