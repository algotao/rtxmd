---
sidebar_position: 3
toc_min_heading_level: 2
toc_max_heading_level: 5
description: 以SaaS的方式，让广告客户能够以低门槛、高灵活度的方式使用RTA能力。广告客户可以免除对接整套RTA时涉及到的工程投入、基建投入，专注在策略开发中；同时由于RTA-SaaS部署在平台域内，数据安全和合规性获得更强保障，进而可以衍生出更多玩法，解决更多业务问题。
keywords: [RTA, sRTA, SaaS]
---

# 4 saastool工具

saastool 是提供给客户的便捷命令行工具，使客户在不开发或少开发的情况下即可实现【数据管理】【策略管理】的对应功能。

开发者也可以参考该工具的功能源码(golang)，实现贴合自身业务的处理逻辑。

源码：[saastool](https://rta.coding.net/p/public/d/saasapi/git/tree/master/cmd/saastool) 

## 4.1 命令行

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

"help" is the default command.

Use "saastool COMMAND -help" for more information about a command.
```

### 4.1.1 task（任务管理）命令列表

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

### 4.1.2 target（策略列表）命令列表

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

### 4.1.3 bind（策略绑定）命令列表

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

## 4.2 cfg.toml配置文件

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

## 4.3 数据转换参考

为了方便客户入手，saastool实现了一个数据转换功能。可以将客户侧的简单数据格式转换成saas服务所需要的上传/写入格式。

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

#### 4.3.2 建立映射

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

#### 4.3.3 运行转换

```sh
saastool convert -map map.json -source ./notconverted/ -dest ./converted/
```

成功后输出转换后的文件

```json
{"userid":"692873b822ef89cb7e935ff370881026","writeBytes":{"bytes":"AQI=","index1":"3"}}
{"userid":"a763b592c846f0a78fb9b326d5c8ba78","writeBytes":{"bytes":"AwE=","index1":"6"}}
```

#### 4.3.4 提交写入

经过转换后的文件。可以通过 `write`（实时写入）命令，或 task 任务流进行上传写入。