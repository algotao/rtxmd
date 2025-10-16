---
sidebar_position: 4
toc_min_heading_level: 2
toc_max_heading_level: 5
description: 高效管理程序化广告数据与策略，saastool工具助您一臂之力！本文详细介绍saastool这一便捷命令行工具，它支持数据管理与策略管理，无需大量开发即可实现相应功能。还涵盖容器/服务模式、数据转换等特性，开发者可参考其源码定制逻辑，为程序化广告操作提供有力支持。
keywords: [程序化广告, saastool工具, 数据管理, 策略管理, 命令行工具, 容器模式, 数据转换, 任务管理, 策略列表, 策略绑定]
---

# 4 saastool工具

saastool 是提供给客户的便捷命令行工具，使客户在不开发或少开发的情况下即可实现【数据管理】【策略管理】的对应功能。

开发者也可以参考该工具的功能源码(golang)，实现贴合自身业务的处理逻辑。

源码：[saastool](https://rta.coding.net/p/public/d/saasapi/git/tree/master/cmd/saastool) 

## 4.1 命令行模式


```sh
saastool help
```

```
Usage:  saastool COMMAND [OPTIONS]

Commands:
    info               Saas Info
    write              Write user's 'bytes / uint32s / flags'
    read               Read user's 'bytes / uint32s / flags'
    columnwrite        Write columns for 'deviceid / openid' users

    convert            Convert data to write format
    
    task               Task commands    
    target             Target commands
    bind               Bind commands
    script             Script commands
    exp                Exp commands

    daemon             Run in daemon mode

"help" is the default command.

Use "saastool COMMAND -help" for more information about a command.
```

### 4.1.1 cfg.toml配置文件

saastool需要一个配置文件，其中可填写自己的Account、Token。使用配置文件可实现多账号多环境的区分。

该配置文件默认名称为 `cfg.toml`，请置于saastool 同目录下。也可以通过 -cfg 参数指定别的配置文件，例如 `saastool -cfg my.toml`。

```toml
# 样例
[auth]
account = "2000"
token = "test"

[apiurls]
baseurl = "https://api.rta.qq.com" # 正式环境
#baseurl = "https://srta.algo.com.cn" # 演示环境
```

### 4.1.2 task（任务管理）命令列表

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
    download             Download task's file block to local

"help" is the default command.

Use "saastool task COMMAND -help" for more information about a command.
```

### 4.1.3 target（策略列表）命令列表

```sh
saastool target help
```

```
Usage:  saastoola target COMMAND [OPTIONS]

Commands:
    list                 List targets

"help" is the default command.

Use "saastool target COMMAND -help" for more information about a command.
```

### 4.1.4 bind（策略绑定）命令列表

```sh
saastool bind help
```

```
Usage:  saastoola bind COMMAND [OPTIONS]

Commands:
    setaccount           Set Account binds
    setad                Set AdGroup binds
    delete               Delete binds

"help" is the default command.

Use "saastool bind COMMAND -help" for more information about a command.
```

### 4.1.5 script（脚本）命令列表

```sh
saastool script help
```

```
Usage:  saastoola script COMMAND [OPTIONS]

Commands:
    run                  Run lua script test on server

"help" is the default command.

Use "saastool script COMMAND -help" for more information about a command.
```

### 4.1.6 exp（实验）命令列表

```sh
saastool exp help
```

```
Usage:  saastoola exp COMMAND [OPTIONS]

Commands:
    list                 List exps
    get                  Get exp report

"help" is the default command.

Use "saastool exp COMMAND -help" for more information about a command.
```

## 4.2 容器/服务模式

saastool提供了容器版本。在容器中将默认启动为daemon并提供http接口供调用。使用容器版本可以简化配置及开发工作，在操作量不高时使用更通用的http交互形式提供数据读写。

:::warning
在执行复杂而繁重的处理时，推荐使用标准API。
:::

### 4.2.1 Docker Compose配置

:::tip[Demo环境]
```yml
services:
  saastool:
    image: rta-docker.pkg.coding.net/public/docker/rtacaller:20251016
    restart: unless-stopped
    environment:
      - SRTA_ACCOUNT=2000
      - SRTA_TOKEN=mytoken
      - SRTA_ENV=demo
    ports:
      - "8080:8080"
```
:::

:::tip[生产环境]
```yml
services:
  saastool:
    image: rta-docker.pkg.coding.net/public/docker/rtacaller:20251016
    restart: unless-stopped
    environment:
      - SRTA_ACCOUNT=2000
      - SRTA_TOKEN=mytoken
      - SRTA_ENV=prd
    ports:
      - "8080:8080"
```
:::

**环境变量**
| 变量名 | 含义 |
| --- | --- |
| SRTA_ACCOUNT | sRTA账号 |
| SRTA_TOKEN | sRTA Token |
| SRTA_ENV | 与Demo环境交互(demo) 或 与生产环境交互(prd) |

### 4.2.2 基础信息

在http交互时，sRTA daemon http服务使用 `Query String` 风格写入/读取数据。它是一种遵循Url规范的格式，通过字段key value来描述需要读取/写入的数据。

```uri
http://saastool/[OP]?ds=[DSID]&appid=[APPID]&clear=[CLEAR]
```

**OP类型**

| OP | 功能 |
| --- | --- |
| read | 单个读（适用于GET方法） |
| write | 单个写（适用于GET方法），批量写（适用于POST方法） |


**基础字段**

| 字段名 | 必填 | 含义 | 样例 |
| --- | --- | --- | --- |
| ds | 是 | 数据空间ID | did / wuid |
| appid | 否 | 小程序/小游戏/公众号/视频号的appid<br />数据空间为wuid类型时填写 | wx1111111111111111 |
| clear | 否 | 是否在写入前清空该userid下的全部数据。<br />**仅在write有效** | true。如不填该字段，则默认为false |


**读取操作字段**

读取操作仅需在url中增加用户ID

| 字段名 | 含义 | 样例 |
| --- | --- | --- |
| userid | 用户ID。设备号MD5值小写，或是openid | cfcd208495d565ef66e7dff9f98764da |

```sh
curl "http://saastool/read?ds=did&userid=cfcd208495d565ef66e7dff9f98764da"
```

**写入操作字段**

写入操作的写入信息采用 `字段类型名称.[编号]` 的格式。字段可以拼接在GET请求（单个写），也可以放在POST请求的Body中发送（批量写）。

单个写的用户ID拼接在url中。批量写的用户ID放置在body的每条记录中。

```uri
userid=cfcd208495d565ef66e7dff9f98764da&u8.1=10&u8.2=20&u32.1=100000&flag.1=true&flag.2=1758686629&flag.3=!3600
```

| 字段名 | 含义 | 样例 |
| --- | --- | --- |
| userid | 用户ID。设备号MD5值小写，或是openid。在使用GET请求时，该字段填在query中。 | cfcd208495d565ef66e7dff9f98764da |
| u8.[n] | 写入uint8数字区 | u8.1=10 |
| u32.[n] | 写入uint32数字区 | u32.1=1000000 |
| flag.[n] | 写入flag区 | 支持多种格式<br />flag.1=true 或 flag.1=false（置位且不过期）<br/ >flag.1=1758686629（在2025-09-24 12:03:49前为true，之后为false）<br/ >flag.1=!3600（在当前时间+3600秒之前为true，之后为false） |

### 4.2.2 单个读

使用HTTP GET方法发送read请求，读取单条数据。

读did数据：
```sh
curl "http://saastool/read?ds=did&userid=cfcd208495d565ef66e7dff9f98764da"
```

读wuid数据：
```sh
curl "http://saastool/read?ds=wuid&userid=o_e3j4ggVPO2CP8iCPBLunzKL79n&appid=wx1111111111111111"
```

### 4.2.2 单个写

使用HTTP GET方法发送write请求，写入单条数据

写did数据：
```sh
curl "http://saastool/write?ds=did&userid=cfcd208495d565ef66e7dff9f98764da&u8.2=20&u32.1=100000"
```

写did数据，并在写入前先清空：
```sh
curl "http://saastool/write?ds=did&userid=cfcd208495d565ef66e7dff9f98764da&u8.1=10&u32.1=100000&clear=true"
```

写wuid数据：
```sh
curl "http://saastool/write?ds=wuid&userid=o_e3j4ggVPO2CP8iCPBLunzKL79n&appid=wx1111111111111111&u8.1=10&u32.1=100000"
```

写wuid数据，并在写入前先清空：
```sh
curl "http://saastool/write?ds=wuid&userid=o_e3j4ggVPO2CP8iCPBLunzKL79n&appid=wx1111111111111111&u8.1=10&u32.1=100000&clear=true"
```

### 4.2.2 批量写

在http POST模式下，sRTA daemon http服务使用 Query String 规范标记公共字段，并在Body中携带写入信息。Header中的 `Content-Type` 约定为 `text/plain`。

*在url中带入的非公共字段将被忽略*

```sh
curl -X POST "http://saastool/write?ds=did" \
  -H "Content-Type: text/plain" \
  -d "userid=cfcd208495d565ef66e7dff9f98764da&u8.1=10&u32.1=100000" \
  -d "userid=a87ff679a2f3e71d9181a67b7542122c&u8.1=60&flag.2=true" \
  -d "userid=9dd4e461268c8034f5c8564e155c67a6&u8.2=200&u32.6=1000000&flag.3=!3600" 
```

### 4.2.3 容器中使用saastool

在容器中的saastool命令行仍然可以使用，运行时其配置依赖config文件，而不受环境变量的影响。

## 4.3 参考：数据转换

为了方便客户入手，saastool实现了一个数据转换功能。可以将客户侧的简单数据格式转换成saas服务所需要的上传/写入格式。

:::warning
不建议专业人士使用。此代码仅用于展示数据如何从原始状态转换成写入格式。
:::

### 4.3.1.数据准备

客户侧的数据格式为两例格式，用 TAB分隔。首列为用户 ID，次列为以空格分隔的标签数组。

```
692873b822ef89cb7e935ff370881026    news_1 music_2
a763b592c846f0a78fb9b326d5c8ba78    music_3 video_1
```

+ 注：news_n 新闻app安装用户及打分
+ 注：music_n 音乐app安装用户及打分
+ 注：video_n 视频app安装用户及打分

分配各 App 所占的数值列n。这里假设news 为第 0 列，music 为第 1 列，video 为第 2 列。

### 4.3.2 建立映射

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

### 4.3.3 运行转换

```sh
saastool convert -map map.json -source ./notconverted/ -dest ./converted/
```

成功后输出转换后的文件

```json
{"userid":"692873b822ef89cb7e935ff370881026","writeBytes":{"bytes":"AQI=","index1":"3"}}
{"userid":"a763b592c846f0a78fb9b326d5c8ba78","writeBytes":{"bytes":"AwE=","index1":"6"}}
```

### 4.3.4 提交写入

经过转换后的文件。可以通过 `write`（实时写入）命令，或 task 任务流进行上传写入。