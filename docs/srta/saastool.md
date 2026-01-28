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

源码：[saastool](https://git.algo.com.cn/public/saasapi/src/branch/master/cmd/saastool) 

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
    resetds            Reset data space

    convert            Convert data to write format
    
    task               Task commands    
    target             Target commands
    bind               Bind commands
    grant              Grant commands
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

### 4.1.2 info（获取Saas信息）

获取sRTA服务的基本信息，包括数据空间、策略ID等配置信息。

```sh
saastool info -help
```

```
Usage of info:
  -config string
        Config file. (default "cfg.toml")
```

**参数说明**

| 参数 | 必填 | 含义 | 样例 |
| --- | --- | --- | --- |
| -config | 否 | 配置文件路径 | cfg.toml（默认） |

**使用示例**

```sh
saastool info
```

### 4.1.3 read（读取用户数据）

读取指定用户在数据空间中的数据（包括字节、uint32和标志位）。

```sh
saastool read -help
```

```
Usage of read:
  -appid string
        Wechat appid
  -config string
        Config file. (default "cfg.toml")
  -ds string
        Data space ID (required)
  -userids string
        Device ID or Wechat UserID, separated by comma (required)
```

**参数说明**

| 参数 | 必填 | 含义 | 样例 |
| --- | --- | --- | --- |
| -userids | 是 | 用户ID列表，多个ID用逗号分隔；设备号MD5值（小写）或微信openid | cfcd208495d565ef66e7dff9f98764da |
| -ds | 是 | 数据空间ID | did、wuid、geo、geoip 或 geofac |
| -appid | 否 | 小程序ID，当ds为wuid时必填 | wx1111111111111111 |
| -config | 否 | 配置文件路径 | cfg.toml（默认） |

**使用示例**

```sh
# 读取did数据空间的用户数据
saastool read -ds did -userids cfcd208495d565ef66e7dff9f98764da

# 读取多个用户数据
saastool read -ds did -userids cfcd208495d565ef66e7dff9f98764da,a87ff679a2f3e71d9181a67b7542122c

# 读取wuid数据空间的用户数据
saastool read -ds wuid -userids o_e3j4ggVPO2CP8iCPBLunzKL79n -appid wx1111111111111111
```

### 4.1.4 write（写入用户数据

向指定数据空间写入用户数据。支持批量写入和清空操作。

```sh
saastool write -help
```

```
Usage of write:
  -appid string
        Wechat appid
  -batchsize uint
        Batch size to sync (default 10000)
  -clear
        Clear all data before write
  -config string
        Config file. (default "cfg.toml")
  -ds string
        Data space ID (required)
  -source string
        Source path or filename (required)
```

**参数说明**

| 参数 | 必填 | 含义 | 样例 |
| --- | --- | --- | --- |
| -source | 是 | 本地文件或目录路径，JSONL格式 | ./users.jsonl 或 ./data_dir/ |
| -ds | 是 | 数据空间ID | did、wuid、geo、geoip 或 geofac |
| -appid | 否 | 小程序ID，当ds为wuid时必填 | wx1111111111111111 |
| -batchsize | 否 | 批处理大小 | 10000（默认） |
| -clear | 否 | 写入前是否清空所有数据 | 不填时为false |
| -config | 否 | 配置文件路径 | cfg.toml（默认） |

**数据格式说明**

JSONL 文件格式，每行一个JSON对象，包含 userid 和数据字段：

```json
{"userid":"cfcd208495d565ef66e7dff9f98764da","writeBytes":{"bytes":"AQI=","index1":"3"}}
{"userid":"a87ff679a2f3e71d9181a67b7542122c","writeUint32s":{"uint32s":"100000","index1":"1"}}
```

**使用示例**

```sh
# 写入单个文件数据
saastool write -ds did -source ./users.jsonl

# 写入目录下所有文件
saastool write -ds did -source ./data_dir/ -batchsize 5000

# 写入前清空所有数据
saastool write -ds did -source ./users.jsonl -clear

# 为wuid数据空间写入数据
saastool write -ds wuid -source ./openid_users.jsonl -appid wx1111111111111111
```

### 4.1.5 resetds（重置数据空间）

重置指定数据空间，清除所有用户数据。

:::warning
此操作为破坏性操作，将删除数据空间中的所有数据，请谨慎使用。
:::

```sh
saastool resetds -help
```

```
Usage of resetds:
  -config string
        Config file. (default "cfg.toml")
  -ds string
        Data space ID (required)
```

**参数说明**

| 参数 | 必填 | 含义 | 样例 |
| --- | --- | --- | --- |
| -ds | 是 | 数据空间ID | 当前仅支持 geo、geoip 或 geofac |
| -config | 否 | 配置文件路径 | cfg.toml（默认） |

**使用示例**

```sh
# 重置did数据空间
saastool resetds -ds did

# 重置wuid数据空间
saastool resetds -ds wuid
```

### 4.1.6 convert（数据转换）

将简化的数据格式转换为saastool写入格式，便于批量数据导入。

```sh
saastool convert -help
```

```
Usage of convert:
  -config string
        Config file. (default "cfg.toml")
  -dest string
        Destination path or filename (required)
  -map string
        target map setting (required)
  -source string
        Source path or filename (required)
```

**参数说明**

| 参数 | 必填 | 含义 | 样例 |
| --- | --- | --- | --- |
| -source | 是 | 源数据文件或目录路径 | ./raw_data/ 或 ./raw_data.txt |
| -dest | 是 | 转换后数据的输出目录 | ./converted_data/ |
| -map | 是 | 映射配置文件路径（JSON格式） | ./map.json |
| -config | 否 | saastool配置文件路径 | cfg.toml（默认） |

**映射文件格式**

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
        }
    }
}
```

**使用示例**

```sh
saastool convert -map ./map.json -source ./raw_data/ -dest ./converted_data/
```

转换结果示例：

```json
{"userid":"692873b822ef89cb7e935ff370881026","writeBytes":{"bytes":"AQI=","index1":"3"}}
{"userid":"a763b592c846f0a78fb9b326d5c8ba78","writeBytes":{"bytes":"AwE=","index1":"6"}}
```

### 4.1.7 columnwrite（列式写入）

针对设备ID或openid用户的列式数据写入命令（当前未实现）。

```sh
saastool columnwrite -help
```

### 4.1.8 daemon（守护进程/HTTP服务）

以守护进程模式启动saastool HTTP服务，提供HTTP接口进行数据读写操作。

```sh
saastool daemon -help
```

**环境变量**

| 变量名 | 含义 | 样例 |
| --- | --- | --- |
| SRTA_ACCOUNT | sRTA账号（必填） | 2000 |
| SRTA_TOKEN | sRTA Token（必填） | test_token |
| SRTA_ENV | 环境类型：demo、prd 或 dev | demo、prd |
| SRTA_PORT | 服务监听端口（可选） | 8080（默认） |

**使用示例**

```sh
# 启动daemon模式
export SRTA_ACCOUNT=2000
export SRTA_TOKEN=mytoken
export SRTA_ENV=demo
export SRTA_PORT=8080
saastool daemon
```

启动后，HTTP服务监听在配置的端口（默认8080），支持 `/read` 和 `/write` 接口。

### 4.1.9 task（任务管理）命令列表



用于管理文件上传任务。任务管理分为两个阶段：
1. **本地处理阶段**：计算文件哈希和块大小（make）
2. **服务端操作阶段**：创建、查询、上传、下载、运行和删除任务

```sh
saastool task help
```

```
Usage:  saastool task COMMAND [OPTIONS]

Commands:
    list                 List tasks on server
    make                 Make file hash for upload task
    create               Create a task on server
    upload               Upload task's file block to server
    download             Download task's file block to local
    run                  Run a task on server
    delete               Delete a task on server
    info                 Get a task info on server

"help" is the default command.

Use "saastool task COMMAND -help" for more information about a command.
```

#### 4.1.9.1 task list（查询任务列表）

查询已创建的所有任务及其状态。

```sh
saastool task list -help
```

```
Usage of list:
  -config string
        Config file. (default "cfg.toml")
  -status string
        Filter status. enums 'all', 'waiting', 'running', 'success', 'fail', 'deleted'
```

**参数说明**

| 参数 | 必填 | 含义 | 样例 |
| --- | --- | --- | --- |
| -status | 否 | 任务状态过滤：all、waiting、running、success、fail、deleted | waiting（默认all） |
| -config | 否 | 配置文件路径 | cfg.toml（默认） |

**使用示例**

```sh
# 查询所有任务
saastool task list

# 查询正在运行的任务
saastool task list -status running

# 查询已完成的任务
saastool task list -status success
```

#### 4.1.9.2 task make（生成任务哈希）

计算本地文件或目录的SHA256哈希值，生成任务文件。这是上传文件前的必要步骤。

```sh
saastool task make -help
```

```
Usage of make:
  -appid string
        AppID for wuid dataspace
  -blocksize string
        Block size to make hash. using size mode K, M, G, T (default "50M")
  -config string
        Config file. (default "cfg.toml")
  -ds string
        DataSpace ID (required)
  -hashfile string
        Output hash file (required)
  -source string
        source file or directory path (required)
  -desc string
        Task description
```

**参数说明**

| 参数 | 必填 | 含义 | 样例 |
| --- | --- | --- | --- |
| -source | 是 | 本地文件或目录路径 | ./data.jsonl 或 ./data_dir/ |
| -hashfile | 是 | 输出的哈希文件路径 | ./task.json |
| -ds | 是 | 数据空间ID | did、wuid、geo、geoip 或 geofac |
| -blocksize | 否 | 块大小，支持 K/M/G/T 单位（50M-200M） | 100M、1G（默认50M） |
| -appid | 否 | 小程序ID，当ds为wuid时必填 | wx1111111111111111 |
| -desc | 否 | 任务描述 | 用户属性批量导入 |
| -config | 否 | 配置文件路径 | cfg.toml（默认） |

**使用示例**

```sh
# 计算单个文件的哈希
saastool task make -source ./users.jsonl -hashfile ./task.json -ds did

# 计算目录的哈希，指定块大小
saastool task make -source ./data_dir/ -hashfile ./task.json -ds did -blocksize 100M

# 为wuid数据空间创建任务
saastool task make -source ./users.jsonl -hashfile ./task.json -ds wuid -appid wx1111111111111111 -desc "openid用户导入"
```

#### 4.1.9.3 task create（创建任务）

将本地生成的任务文件上传到服务器，创建一个新任务。

```sh
saastool task create -help
```

```
Usage of create:
  -config string
        Config file. (default "cfg.toml")
  -hashfile string
        Input hash file (required)
```

**参数说明**

| 参数 | 必填 | 含义 | 样例 |
| --- | --- | --- | --- |
| -hashfile | 是 | 任务文件路径（由task make生成） | ./task.json |
| -config | 否 | 配置文件路径 | cfg.toml（默认） |

**使用示例**

```sh
saastool task create -hashfile ./task.json
```

#### 4.1.9.4 task upload（上传任务文件）

上传任务的文件块到服务器。

```sh
saastool task upload -help
```

```
Usage of upload:
  -config string
        Config file. (default "cfg.toml")
  -sha256 string
        Task SHA256 hash (required)
```

**参数说明**

| 参数 | 必填 | 含义 | 样例 |
| --- | --- | --- | --- |
| -sha256 | 是 | 任务SHA256哈希值 | abc123def456... |
| -config | 否 | 配置文件路径 | cfg.toml（默认） |

**使用示例**

```sh
saastool task upload -sha256 abc123def456...
```

#### 4.1.9.5 task download（下载任务文件）

从服务器下载任务的文件块到本地。

```sh
saastool task download -help
```

```
Usage of download:
  -config string
        Config file. (default "cfg.toml")
  -dest string
        Destination path (required)
  -sha256 string
        Task SHA256 hash (required)
```

**参数说明**

| 参数 | 必填 | 含义 | 样例 |
| --- | --- | --- | --- |
| -sha256 | 是 | 任务SHA256哈希值 | abc123def456... |
| -dest | 是 | 目标下载路径 | ./output/ |
| -config | 否 | 配置文件路径 | cfg.toml（默认） |

**使用示例**

```sh
saastool task download -sha256 abc123def456... -dest ./output/
```

#### 4.1.9.6 task run（运行任务）

在服务器上运行任务，处理已上传的数据。

```sh
saastool task run -help
```

```
Usage of run:
  -config string
        Config file. (default "cfg.toml")
  -sha256 string
        Task SHA256 hash (required)
```

**参数说明**

| 参数 | 必填 | 含义 | 样例 |
| --- | --- | --- | --- |
| -sha256 | 是 | 任务SHA256哈希值 | abc123def456... |
| -config | 否 | 配置文件路径 | cfg.toml（默认） |

**使用示例**

```sh
saastool task run -sha256 abc123def456...
```

#### 4.1.9.7 task delete（删除任务）

从服务器删除任务。

```sh
saastool task delete -help
```

```
Usage of delete:
  -config string
        Config file. (default "cfg.toml")
  -sha256 string
        Task SHA256 hash (required)
```

**参数说明**

| 参数 | 必填 | 含义 | 样例 |
| --- | --- | --- | --- |
| -sha256 | 是 | 任务SHA256哈希值 | abc123def456... |
| -config | 否 | 配置文件路径 | cfg.toml（默认） |

**使用示例**

```sh
saastool task delete -sha256 abc123def456...
```

#### 4.1.9.8 task info（获取任务信息）

获取服务器上的任务详细信息。

```sh
saastool task info -help
```

```
Usage of info:
  -config string
        Config file. (default "cfg.toml")
  -sha256 string
        Task SHA256 hash (required)
```

**参数说明**

| 参数 | 必填 | 含义 | 样例 |
| --- | --- | --- | --- |
| -sha256 | 是 | 任务SHA256哈希值 | abc123def456... |
| -config | 否 | 配置文件路径 | cfg.toml（默认） |

**使用示例**

```sh
saastool task info -sha256 abc123def456...
```

### 4.1.10 target（策略管理）命令列表

用于管理策略/目标，包括创建、查询和删除策略。

```sh
saastool target help
```

```
Usage:  saastool target COMMAND [OPTIONS]

Commands:
    list                 List targets
    create               Create a new target
    delete               Delete an existing target

"help" is the default command.

Use "saastool target COMMAND -help" for more information about a command.
```

#### 4.1.10.1 target list（查询策略列表）

查询已创建的所有策略及其信息。

```sh
saastool target list -help
```

```
Usage of list:
  -config string
        Config file. (default "cfg.toml")
  -targets string
        Target IDs. Use commas to separate multiple IDs
  -b
        List Binds
```

**参数说明**

| 参数 | 必填 | 含义 | 样例 |
| --- | --- | --- | --- |
| -targets | 否 | 目标ID列表，多个ID用逗号分隔 | target1,target2 |
| -b | 否 | 是否列出绑定信息 | 不填时仅列出策略名称 |
| -config | 否 | 配置文件路径 | cfg.toml（默认） |

**使用示例**

```sh
# 查询所有策略
saastool target list

# 查询指定策略
saastool target list -targets my_target

# 查询多个策略及其绑定信息
saastool target list -targets target1,target2 -b
```

#### 4.1.10.2 target create（创建策略）

创建一个新的策略。

```sh
saastool target create -help
```

```
Usage of create:
  -config string
        Config file. (default "cfg.toml")
  -target string
        Target ID (required)
  -desc string
        Task description
```

**参数说明**

| 参数 | 必填 | 含义 | 样例 |
| --- | --- | --- | --- |
| -target | 是 | 策略ID，3-20个字符 | my_target |
| -desc | 否 | 策略描述 | 核心用户策略 |
| -config | 否 | 配置文件路径 | cfg.toml（默认） |

**使用示例**

```sh
# 创建简单策略
saastool target create -target my_target

# 创建带描述的策略
saastool target create -target my_target -desc "核心用户策略"
```

#### 4.1.10.3 target delete（删除策略）

删除已创建的策略。

```sh
saastool target delete -help
```

```
Usage of delete:
  -config string
        Config file. (default "cfg.toml")
  -target string
        Target ID (required)
```

**参数说明**

| 参数 | 必填 | 含义 | 样例 |
| --- | --- | --- | --- |
| -target | 是 | 策略ID | my_target |
| -config | 否 | 配置文件路径 | cfg.toml（默认） |

**使用示例**

```sh
saastool target delete -target my_target
```

### 4.1.11 bind（策略绑定）命令列表

用于将广告主账户和广告组与策略进行绑定。

```sh
saastool bind help
```

```
Usage:  saastool bind COMMAND [OPTIONS]

Commands:
    setaccount           Set Account binds
    setad                Set AdGroup binds
    delete               Delete binds

"help" is the default command.

Use "saastool bind COMMAND -help" for more information about a command.
```

#### 4.1.11.1 bind setaccount（绑定账户）

将广告主账户与策略进行绑定。

```sh
saastool bind setaccount -help
```

```
Usage of setaccount:
  -config string
        Config file. (default "cfg.toml")
  -target string
        Target ID (required)
  -accounts string
        Advertiser IDs. Use commas to separate multiple IDs (required)
```

**参数说明**

| 参数 | 必填 | 含义 | 样例 |
| --- | --- | --- | --- |
| -target | 是 | 策略ID | my_target |
| -accounts | 是 | 广告主ID列表，多个ID用逗号分隔 | 123,456,789 |
| -config | 否 | 配置文件路径 | cfg.toml（默认） |

**使用示例**

```sh
# 绑定单个账户
saastool bind setaccount -target my_target -accounts 123

# 绑定多个账户
saastool bind setaccount -target my_target -accounts 123,456,789
```

#### 4.1.11.2 bind setad（绑定广告组）

将广告组与策略进行绑定。

```sh
saastool bind setad -help
```

```
Usage of setad:
  -config string
        Config file. (default "cfg.toml")
  -target string
        Target ID (required)
  -account int64
        Advertiser ID (required)
  -ads string
        AdGroup IDs. Use commas to separate multiple IDs (required)
```

**参数说明**

| 参数 | 必填 | 含义 | 样例 |
| --- | --- | --- | --- |
| -target | 是 | 策略ID | my_target |
| -account | 是 | 广告主ID | 123 |
| -ads | 是 | 广告组ID列表，多个ID用逗号分隔 | 1001,1002,1003 |
| -config | 否 | 配置文件路径 | cfg.toml（默认） |

**使用示例**

```sh
# 绑定单个广告组
saastool bind setad -target my_target -account 123 -ads 1001

# 绑定多个广告组
saastool bind setad -target my_target -account 123 -ads 1001,1002,1003
```

#### 4.1.11.3 bind delete（删除绑定）

删除账户或广告组与策略的绑定关系。

```sh
saastool bind delete -help
```

```
Usage of delete:
  -config string
        Config file. (default "cfg.toml")
  -idtype int
        ID Type. empty is Automatic matching, 1=AdGroup, 3=Account
  -ids string
        IDs for delete. Use commas to separate multiple IDs (required)
```

**参数说明**

| 参数 | 必填 | 含义 | 样例 |
| --- | --- | --- | --- |
| -ids | 是 | 要删除的ID列表，多个ID用逗号分隔 | 1001,1002 |
| -idtype | 否 | ID类型：空=自动匹配，1=广告组，3=账户 | 1 或 3 |
| -config | 否 | 配置文件路径 | cfg.toml（默认） |

**使用示例**

```sh
# 自动匹配ID类型删除
saastool bind delete -ids 1001,1002

# 删除广告组绑定
saastool bind delete -idtype 1 -ids 1001,1002,1003

# 删除账户绑定
saastool bind delete -idtype 3 -ids 123,456
```

### 4.1.12 grant（授权管理）命令列表

用于管理数据空间的授权，允许其他账号访问您的数据。

```sh
saastool grant help
```

```
Usage:  saastool grant COMMAND [OPTIONS]

Commands:
    list                 List data grants
    add                  Add data grant
    delete               Delete data grant

"help" is the default command.

Use "saastool grant COMMAND -help" for more information about a command.
```

#### 4.1.12.1 grant list（查询授权列表）

查询已授权给他人以及他人授权给您的权限。

```sh
saastool grant list -help
```

```
Usage of list:
  -config string
        Config file. (default "cfg.toml")
```

**参数说明**

| 参数 | 必填 | 含义 | 样例 |
| --- | --- | --- | --- |
| -config | 否 | 配置文件路径 | cfg.toml（默认） |

**使用示例**

```sh
saastool grant list
```

#### 4.1.12.2 grant add（添加授权）

为其他账号授权访问您的数据。

```sh
saastool grant add -help
```

```
Usage of add:
  -config string
        Config file. (default "cfg.toml")
  -account uint
        sRTA account ID (required)
  -ds uint
        Raw data space ID (required)
  -index string
        Grant index. Format: "1, 2, 4, 55-64" (required)
```

**参数说明**

| 参数 | 必填 | 含义 | 样例 |
| --- | --- | --- | --- |
| -account | 是 | 被授权的目标账号ID | 2001 |
| -ds | 是 | 数据空间ID | 1 |
| -index | 是 | 授权位索引，支持单个或范围格式 | 1,2,4,55-64 |
| -config | 否 | 配置文件路径 | cfg.toml（默认） |

**使用示例**

```sh
# 授权单个位
saastool grant add -account 2001 -ds 1 -index 1

# 授权多个位和范围
saastool grant add -account 2001 -ds 1 -index "1,2,4,10-20"
```

#### 4.1.12.3 grant delete（删除授权）

撤销已授予其他账号的数据访问权限。

```sh
saastool grant delete -help
```

```
Usage of delete:
  -config string
        Config file. (default "cfg.toml")
  -account uint
        sRTA account ID (required)
  -ds uint
        Raw data space ID (required)
  -index string
        Grant index. Format: "1, 2, 4, 55-64" (required)
```

**参数说明**

| 参数 | 必填 | 含义 | 样例 |
| --- | --- | --- | --- |
| -account | 是 | 目标账号ID | 2001 |
| -ds | 是 | 数据空间ID | 1 |
| -index | 是 | 要删除的授权位索引 | 1,2,4 |
| -config | 否 | 配置文件路径 | cfg.toml（默认） |

**使用示例**

```sh
saastool grant delete -account 2001 -ds 1 -index "1,2"
```

### 4.1.13 script（脚本管理）命令列表

用于管理Lua脚本，用于数据处理和业务逻辑定制。

```sh
saastool script help
```

```
Usage:  saastool script COMMAND [OPTIONS]

Commands:
    list                 List all scripts on server
    debug                Debug lua script on server
    create               Create lua script on server
    delete               Delete a script from server
    get                  Get script content from server
    use                  Use a script as default

"help" is the default command.

Use "saastool script COMMAND -help" for more information about a command.
```

#### 4.1.13.1 script list（查询脚本列表）

列出所有已创建的脚本及其状态。

```sh
saastool script list -help
```

```
Usage of list:
  -config string
        Config file. (default "cfg.toml")
```

**参数说明**

| 参数 | 必填 | 含义 | 样例 |
| --- | --- | --- | --- |
| -config | 否 | 配置文件路径 | cfg.toml（默认） |

**使用示例**

```sh
saastool script list
```

#### 4.1.13.2 script debug（调试脚本）

在服务器上调试Lua脚本（debug 和 run 是别名关系）。

```sh
saastool script debug -help
```

```
Usage of debug:
  -config string
        Config file. (default "cfg.toml")
  -lua string
        LUA file name (required)
  -did string
        device md5 (lower case) (required)
  -os uint
        1=iOS, 2=Android, 7=Harmony default=2
```

**参数说明**

| 参数 | 必填 | 含义 | 样例 |
| --- | --- | --- | --- |
| -lua | 是 | Lua脚本文件路径 | ./script.lua |
| -did | 是 | 设备md5值（小写） | abc123def456... |
| -os | 否 | 操作系统：1=iOS，2=Android，7=Harmony | 2（默认） |
| -config | 否 | 配置文件路径 | cfg.toml（默认） |

**使用示例**

```sh
# 调试脚本
saastool script debug -lua ./script.lua -did abc123def456 -os 2

# 使用 run 别名
saastool script run -lua ./script.lua -did abc123def456 -os 1
```

#### 4.1.13.3 script create（创建脚本）

在服务器上创建一个新的Lua脚本。

```sh
saastool script create -help
```

```
Usage of create:
  -config string
        Config file. (default "cfg.toml")
  -lua string
        LUA file name (required)
  -name string
        Name (required)
```

**参数说明**

| 参数 | 必填 | 含义 | 样例 |
| --- | --- | --- | --- |
| -lua | 是 | Lua脚本文件路径 | ./script.lua |
| -name | 是 | 脚本名称，3-20个字符，英文字母、数字和中划线 | my-script |
| -config | 否 | 配置文件路径 | cfg.toml（默认） |

**使用示例**

```sh
saastool script create -lua ./script.lua -name my-script
```

#### 4.1.13.4 script delete（删除脚本）

从服务器删除一个脚本。

```sh
saastool script delete -help
```

```
Usage of delete:
  -config string
        Config file. (default "cfg.toml")
  -name string
        Name (required)
```

**参数说明**

| 参数 | 必填 | 含义 | 样例 |
| --- | --- | --- | --- |
| -name | 是 | 脚本名称 | my-script |
| -config | 否 | 配置文件路径 | cfg.toml（默认） |

**使用示例**

```sh
saastool script delete -name my-script
```

#### 4.1.13.5 script get（获取脚本内容）

从服务器获取指定脚本的内容。

```sh
saastool script get -help
```

```
Usage of get:
  -config string
        Config file. (default "cfg.toml")
  -name string
        Name (required)
```

**参数说明**

| 参数 | 必填 | 含义 | 样例 |
| --- | --- | --- | --- |
| -name | 是 | 脚本名称 | my-script |
| -config | 否 | 配置文件路径 | cfg.toml（默认） |

**使用示例**

```sh
saastool script get -name my-script
```

#### 4.1.13.6 script use（设置默认脚本）

将指定的脚本设置为默认脚本。

```sh
saastool script use -help
```

```
Usage of use:
  -config string
        Config file. (default "cfg.toml")
  -name string
        Name (required)
```

**参数说明**

| 参数 | 必填 | 含义 | 样例 |
| --- | --- | --- | --- |
| -name | 是 | 脚本名称 | my-script |
| -config | 否 | 配置文件路径 | cfg.toml（默认） |

**使用示例**

```sh
saastool script use -name my-script
```

### 4.1.14 exp（实验管理）命令列表

用于管理和查询实验数据。

```sh
saastool exp help
```

```
Usage:  saastool exp COMMAND [OPTIONS]

Commands:
    list                 List exps
    get                  Get exp report
    grant                Experiment authorization management

"help" is the default command.

Use "saastool exp COMMAND -help" for more information about a command.
```

#### 4.1.14.1 exp list（查询实验列表）

列出所有已创建的实验。

```sh
saastool exp list -help
```

```
Usage of list:
  -config string
        Config file. (default "cfg.toml")
```

**参数说明**

| 参数 | 必填 | 含义 | 样例 |
| --- | --- | --- | --- |
| -config | 否 | 配置文件路径 | cfg.toml（默认） |

**使用示例**

```sh
saastool exp list
```

#### 4.1.14.2 exp get（获取实验报告）

查询实验的数据报告。

```sh
saastool exp get -help
```

```
Usage of get:
  -config string
        Config file. (default "cfg.toml")
  -beginday uint64
        Begin day (required)
  -endday uint64
        End day (required)
  -target string
        Target ID (required)
  -bucketids string
        Bucket IDs. Use commas to separate multiple IDs. empty is all
  -uid string
        Advertiser IDs. Use commas to separate multiple IDs.
  -groupby string
        Group by. Use commas to separate multiple fields. empty is none
  -extfields string
        Ext fields. Use commas to separate multiple fields. * is all
  -total
        Total flag
```

**参数说明**

| 参数 | 必填 | 含义 | 样例 |
| --- | --- | --- | --- |
| -beginday | 是 | 开始日期（YYYYMMDD格式） | 20250101 |
| -endday | 是 | 结束日期（YYYYMMDD格式） | 20250131 |
| -target | 是 | 策略ID | my_target |
| -bucketids | 否 | 桶ID列表，用逗号分隔；留空表示所有 | 1,2,3 |
| -uid | 否 | 广告主ID列表，用逗号分隔 | 123,456 |
| -groupby | 否 | 分组字段，用逗号分隔；可选值：advertiser_id、user_weight_factor | advertiser_id |
| -extfields | 否 | 扩展字段，用逗号分隔；* 表示所有 | * |
| -total | 否 | 是否返回总计数据 | 不填时为false |
| -config | 否 | 配置文件路径 | cfg.toml（默认） |

**日期范围说明**

- 最早支持日期：20250101
- 最晚支持日期：21001231
- 格式：YYYYMMDD

**使用示例**

```sh
# 查询日期范围内的实验数据
saastool exp get -beginday 20250101 -endday 20250131 -target my_target

# 查询指定桶的数据
saastool exp get -beginday 20250101 -endday 20250131 -target my_target -bucketids 1,2,3

# 按广告主分组查询
saastool exp get -beginday 20250101 -endday 20250131 -target my_target -uid 123,456 -groupby advertiser_id

# 查询所有扩展字段及总计
saastool exp get -beginday 20250101 -endday 20250131 -target my_target -total -extfields "*"
```

#### 4.1.14.3 exp grant（实验授权管理）

管理实验的授权权限。

```sh
saastool exp grant help
```

```
Usage:  saastool exp grant COMMAND [OPTIONS]

Commands:
    list                 List experiment authorization
    add                  Add experiment authorization
    delete               Delete experiment authorization

"help" is the default command.

Use "saastool exp grant COMMAND -help" for more information about a command.
```

##### 4.1.14.3.1 exp grant list（查询实验授权列表）

查询实验授权情况。

```sh
saastool exp grant list -help
```

```
Usage of list:
  -config string
        Config file. (default "cfg.toml")
```

**参数说明**

| 参数 | 必填 | 含义 | 样例 |
| --- | --- | --- | --- |
| -config | 否 | 配置文件路径 | cfg.toml（默认） |

**使用示例**

```sh
saastool exp grant list
```

##### 4.1.14.3.2 exp grant add（添加实验授权）

为指定sRTA账户添加实验访问权限。

```sh
saastool exp grant add -help
```

```
Usage of add:
  -config string
        Config file. (default "cfg.toml")
  -account uint64
        sRTA account ID (required)
```

**参数说明**

| 参数 | 必填 | 含义 | 样例 |
| --- | --- | --- | --- |
| -account | 是 | sRTA账户ID | 12345 |
| -config | 否 | 配置文件路径 | cfg.toml（默认） |

**使用示例**

```sh
saastool exp grant add -account 12345
```

##### 4.1.14.3.3 exp grant delete（删除实验授权）

撤销指定sRTA账户的实验访问权限。

```sh
saastool exp grant delete -help
```

```
Usage of delete:
  -config string
        Config file. (default "cfg.toml")
  -account uint64
        sRTA account ID (required)
```

**参数说明**

| 参数 | 必填 | 含义 | 样例 |
| --- | --- | --- | --- |
| -account | 是 | sRTA账户ID | 12345 |
| -config | 否 | 配置文件路径 | cfg.toml（默认） |

**使用示例**

```sh
saastool exp grant delete -account 12345
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
    image: rta-docker.pkg.coding.net/public/docker/saastool:2025121617
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
    image: rta-docker.pkg.coding.net/public/docker/saastool:2025121617
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

### 4.2.3 单个读

使用HTTP GET方法发送read请求，读取单条数据。

读did数据：
```sh
curl "http://saastool/read?ds=did&userid=cfcd208495d565ef66e7dff9f98764da"
```

读wuid数据：
```sh
curl "http://saastool/read?ds=wuid&userid=o_e3j4ggVPO2CP8iCPBLunzKL79n&appid=wx1111111111111111"
```

### 4.2.4 单个写

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

### 4.2.5 批量写

在http POST模式下，sRTA daemon http服务使用 Query String 规范标记公共字段，并在Body中携带写入信息。Header中的 `Content-Type` 约定为 `text/plain`。

*在url中带入的非公共字段将被忽略*

```sh
curl -X POST "http://saastool/write?ds=did" \
  -H "Content-Type: text/plain" \
  -d "userid=cfcd208495d565ef66e7dff9f98764da&u8.1=10&u32.1=100000" \
  -d "userid=a87ff679a2f3e71d9181a67b7542122c&u8.1=60&flag.2=true" \
  -d "userid=9dd4e461268c8034f5c8564e155c67a6&u8.2=200&u32.6=1000000&flag.3=!3600" 
```

### 4.2.6 容器中使用saastool

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

## 4.4 常见任务流程

### 4.4.1 完整任务上传流程

这是最常见的数据上传场景，包括数据准备、上传、处理和下载结果。

```sh
# 1. 准备数据文件（users.jsonl）
# 示例格式：每行一个JSON对象，包含userid和数据

# 2. 生成任务哈希文件
saastool task make -source ./users.jsonl -hashfile ./task.json -ds did -blocksize 100M -desc "用户数据导入"

# 3. 在服务器创建任务
saastool task create -hashfile ./task.json
# 输出中会包含 task_sha256，后续命令使用此值

# 4. 上传文件块到服务器
saastool task upload -sha256 <task_sha256>

# 5. 查看任务状态
saastool task list -status running
saastool task info -sha256 <task_sha256>

# 6. 在服务器上运行任务（处理数据）
saastool task run -sha256 <task_sha256>

# 7. 查看任务完成状态
saastool task list -status success

# 8. 下载处理结果
saastool task download -sha256 <task_sha256> -dest ./output/

# 9. 删除任务
saastool task delete -sha256 <task_sha256>
```

### 4.4.2 策略创建和绑定流程

创建策略并关联账户和广告组的完整流程。

```sh
# 1. 创建策略
saastool target create -target my_strategy -desc "核心用户策略"

# 2. 查看策略列表
saastool target list

# 3. 绑定广告主账户到策略
saastool bind setaccount -target my_strategy -accounts 123,456,789

# 4. 绑定广告组到策略
saastool bind setad -target my_strategy -account 123 -ads 1001,1002,1003
saastool bind setad -target my_strategy -account 456 -ads 2001,2002

# 5. 查看策略和绑定信息
saastool target list -targets my_strategy -b

# 6. 删除绑定（如果需要）
saastool bind delete -idtype 1 -ids 1001  # 删除广告组绑定
saastool bind delete -idtype 3 -ids 123   # 删除账户绑定

# 7. 删除策略
saastool target delete -target my_strategy
```

### 4.4.3 脚本管理流程

创建、测试和管理Lua脚本的完整流程。

```sh
# 1. 创建脚本
saastool script create -lua ./my_script.lua -name my-script

# 2. 查看所有脚本
saastool script list

# 3. 获取脚本内容
saastool script get -name my-script

# 4. 本地测试脚本
saastool script debug -lua ./my_script.lua -did abc123def456 -os 2

# 5. 设置为默认脚本
saastool script use -name my-script

# 6. 删除脚本（如果需要）
saastool script delete -name my-script
```

### 4.4.4 实验数据查询流程

查询和管理实验数据的完整流程。

```sh
# 1. 查看所有实验
saastool exp list

# 2. 授予其他账户实验访问权限
saastool exp grant add -account 12345

# 3. 查询实验授权情况
saastool exp grant list

# 4. 查询特定日期范围的实验数据
saastool exp get -beginday 20250101 -endday 20250131 -target my_target

# 5. 按桶ID查询数据
saastool exp get -beginday 20250101 -endday 20250131 -target my_target -bucketids 1,2,3

# 6. 按广告主分组查询（包含所有扩展字段）
saastool exp get -beginday 20250101 -endday 20250131 -target my_target -groupby advertiser_id -extfields "*" -total

# 7. 撤销访问权限
saastool exp grant delete -account 12345
```

### 4.4.5 数据授权流程

管理数据空间授权的完整流程。

```sh
# 1. 查看现有授权
saastool grant list

# 2. 授权数据访问权限给其他账户
saastool grant add -account 2001 -ds 1 -index "1,2,3"
saastool grant add -account 2001 -ds 1 -index "10-20"

# 3. 查看授权情况
saastool grant list

# 4. 撤销部分权限
saastool grant delete -account 2001 -ds 1 -index "1,2"

# 5. 撤销所有权限
saastool grant delete -account 2001 -ds 1 -index "1-100"
```
