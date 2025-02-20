---
sidebar_position: 1
description: RTA调用方与被调方的基于http协议交互约定，包含请求与回复示例、状态码约定、超时上限等。
keywords: [RTA, http, https, cookie, keep-alive]
---

# HTTP规范

调用方与被调方的基于http协议交互

## 交互基本规范
|  名称 | 说明 |
|  ----  | ----  |
| 协议版本 | 支持 `http/1.1` 及 `http/2` 版本的交互方式。 |
| 传输加密 | 支持 `http` `https`，支持 `TLS1.2` `TLS1.3` 传输层安全性协议 |
| 请求方法 | 调用方使用 `POST` 方法发送数据。 |
| 响应状态 | 被调方应使用http `200` 状态码响应。服务异常除外。 |
| 保持连接 | 为了提高交互性能，当交互协议使用 `http/1.1` 时 `Keep-Alive` 机制必须开启。**Header中可不填充该字段** |
| 数据类型 | 请求及回复均使用 Protobuf格式 `Content-Type: application/x-protobuf; charset=UTF-8` 。**Header中可不填充该字段** |
| 压缩支持 | 不支持。 |
| 时延上限 | `60ms` 包括网络传输时间+内部处理时间。 |
| 超时率 | 超时率需控制在 `2%` 以内，超过该指标将被系统自动打压。 |

## 示例

### 请求Header

```http
POST /rta/bid HTTP/1.1
Host: api.algo.com.cn
Content-Length: 95

(body)
```

### 请求Body
以下是对body进行protobuf可视化打印后的内容
```protobuf
id:  "Jo825w_uEe2xLlJUAFwvSQ"
device:  <
  os:  OS_ANDROID
  imei_md5sum:  "e669d85a800adf5107ec10c3094d6b1d"
  oaid_md5sum:  "ad804af4ad8021c923b15af7c6edd9cc"
  cached_deviceid_type:  OAID_MD5
>
```

### 响应Header

下例是较为常见的Header内容。

```http
HTTP/1.1 200 OK
Connection: keep-alive
Content-Length: 68
Content-Type: application/x-protobuf; charset=UTF-8
Date: Sat, 30 Jul 2022 09:55:04 GMT
Server: nginx

(body)
```

为了节约传输量，可尽量精简响应头中的不重要内容。

```http
HTTP/1.1 200 OK
Content-Length: 68

(body)
```

### 响应Body
以下是对body进行protobuf可视化打印后的内容
```protobuf
code:  0
out_target_id:  "txnews_dau"
out_target_id:  "txvideo_dau"
target_infos:  <
  out_target_id:  "txnews_dau"
  user_weight_factor:  0.8
>
target_infos:  <
  out_target_id:  "txvideo_dau"
  user_weight_factor:  1.2
>
```

## 更多信息

### HTTP状态码
只要能进入到逻辑层，请保证只回复 `200` 状态码。RTA与RTB不同的是，在RTA模式下未明确约定的状态有可能会被视为**参竞**。例如 `204` 状态码在RTB中被视为**不参竞**，而在RTA中将被视为**错误**。

### HTTP压缩
**不支持**。由于RTA交互内容的体积较小，HTTP压缩带来的收益不明显，且引入压缩机制会占用更多算力，其投入产出比不划算。

### Cookie能力
**不支持**。RTA的每个请求都是独立的，属于无状态协议，Cookie在这场景中并不适用。无论是由于负载均衡的会话保持还是业务逻辑产生的该类诉求，均应重新审视其技术合理性。

### 分块传输
**支持**。支持被调方以 `Transfer-Encoding: chunked` 编码方式返回，正常情况下无须特别关注。由于RTA交互内容的体积较小，该传输机制并不会带来显著的收益或开销。

## 技术挑战

- **并发请求大**：在典型的接入场景中，每秒并发请求量可达10-20W。
- **可用时间短**：时延上限为60ms，包括网络传输时间+内部处理时间。
- **质量要求高**：短时间的质量问题会触发调用方的QPS控制。长期超标的质量问题会触发平台的清退标准。