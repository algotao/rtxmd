---
sidebar_position: 6
toc_min_heading_level: 2
toc_max_heading_level: 5
description: saasai 是 saastool 的 AI 友好衍生命令行工具，输出结构化 JSON、使用精细化退出码、支持 dry-run 与 stdin，适合 AI Agent、CI 流水线与自动化脚本可靠地消费命令结果。本文详细介绍 saasai 的全局约定、配置、各子命令（info/read/write/convert/resetds/columnclear/task/target/bind/grant/script/exp/admincode）以及它与 saastool 的区别。
keywords: [程序化广告, saasai工具, AI友好命令行, 结构化输出, JSON输出, 退出码, dry-run, AI Agent, 自动化脚本, 数据管理, 策略管理, sRTA]
---

# 6 saasai工具

saasai 是 saastool 的 **AI 友好衍生版本**，与 saastool **并存**（同一套后端 API，同一份 `cfg.toml` 配置），专为 AI Agent、CI 流水线与自动化脚本设计：

- **stdout 只输出结构化 JSON**（或 table）；失败时 **stdout 严格为空**，便于 `cmd > ok.json` 不被污染。
- **stderr 承载结构化错误 JSON**（以及进度、日志），失败时 JSON 格式与成功输出同构。
- **精细化退出码**（usage/config/auth/not-found/invalid/network/server/timeout 等），AI Agent 可据此决定是否重试。
- **破坏性命令全部支持 `--dry-run`**（delete / resetds / columnclear / create / bind / grant 等）。
- **`--hash-file -`、`--lua -`** 等参数支持从 stdin 读入。

:::tip
- saasai 与 saastool **完全独立**，原 saastool 的命令、参数、输出字节级保持不变，现有脚本无需修改。
- 建议：**人工操作继续用 saastool**；**Agent / 流水线 / 新脚本用 saasai**。
:::

源码：[saasai](https://git.algo.com.cn/public/saasapi/src/branch/master/cmd/saasai)

## 6.1 基础约定

### 6.1.1 输出格式

saasai 默认 `--output json`，成功时写入 stdout 的统一结构（envelope）：

```json
{
  "schema_version": "v1",
  "status": "success",
  "code": 0,
  "command": "task list",
  "data": { /* ... 业务数据 ... */ }
}
```

失败时写入 **stderr**（stdout 为空）：

```json
{
  "schema_version": "v1",
  "status": "error",
  "code": 30,
  "command": "task info",
  "error": {
    "type": "NOT_FOUND",
    "message": "任务不存在",
    "retriable": false,
    "details": { "sha256": "abc..." }
  }
}
```

| 字段 | 说明 |
| --- | --- |
| `schema_version` | envelope 版本，当前 `v1` |
| `status` | `success` / `error` |
| `code` | 与进程退出码一致 |
| `command` | 子命令路径（如 `task list`） |
| `data` | 成功时的业务数据 |
| `error.type` | 错误类型枚举 |
| `error.retriable` | 是否可自动重试 |
| `error.details` | 额外诊断信息（如入参 sha256） |

### 6.1.2 退出码与错误类型

| code | type | 含义 | retriable |
| --- | --- | --- | --- |
| 0 | SUCCESS | 成功 | — |
| 1 | GENERAL_ERROR | 兜底错误 | ❓ |
| 2 | USAGE_ERROR | 参数错误 | ❌ |
| 10 | CONFIG_ERROR | 配置文件错误 | ❌ |
| 20 | AUTH_ERROR | 认证失败（账号/签名错误） | ❌ |
| 21 | PERMISSION_ERROR | 权限不足（账号被禁用） | ❌ |
| 30 | NOT_FOUND | 资源不存在（任务/数据空间等） | ❌ |
| 40 | INVALID_INPUT | 输入非法（文件解析失败、参数越界等） | ❌ |
| 50 | NETWORK_ERROR | 网络错误 | ✅ |
| 51 | SERVER_ERROR | 服务端 5xx / 未分类服务端错误 | ✅ |
| 60 | TIMEOUT | 超时 | ✅ |

:::tip[Agent 使用约定]
- `code ∈ {50, 51, 60}` 可退避后自动重试。
- `code ∈ {2, 10, 20, 21, 40}` **不可**盲目重试，必须先修正输入或配置。
- `code = 30` 按业务语义处理（例如可视作"已不存在"）。
:::

### 6.1.3 全局参数

| 参数 | 默认 | 含义 |
| --- | --- | --- |
| `-o` / `--output` | `json` | 输出格式：`json`（默认）或 `table` |
| `-c` / `--config` | `cfg.toml` | 配置文件路径（与 saastool 完全兼容） |
| `-q` / `--quiet` | false | 抑制 stderr 的进度与 info 日志（错误仍保留） |
| `-v` / `--verbose` | 0 | 计数：`-v` info，`-vv` debug（写入 stderr） |
| `--dry-run` | false | 破坏性命令仅打印"将要执行"的内容，不实际调用后端 |
| `-h` / `--help` | — | 任意层级均可附加 |

:::warning
`--output json`（默认）下，进度条与 info/debug 日志会**自动抑制**，确保 stderr 也是纯净 JSON。需要看进度请用 `-o table` 或显式加 `-v`。
:::

### 6.1.4 cfg.toml 配置文件

与 saastool **完全兼容**。默认名称 `cfg.toml`，置于 saasai 同目录；也可用 `-c` 或 `--config` 指定。

```toml
[auth]
account = "2000"
token = "test"

[apiurls]
baseurl = "https://api.rta.qq.com"      # 正式环境
#baseurl = "https://srta.algo.com.cn"   # 演示环境
```

### 6.1.5 参数命名对照（与 saastool）

saasai 采用 GNU 风格（双横线 kebab-case）；saastool 沿用 Go `flag` 风格。差异表：

| saastool | saasai | 语义 |
| --- | --- | --- |
| `-config` | `--config` / `-c` | 配置文件 |
| `-hashfile` | `--hash-file` | 任务哈希文件，saasai 额外支持 `-` 表示 stdin |
| `-userids` | `--user-ids` | 用户 ID 列表 |
| `-beginday` / `-endday` | `--begin-day` / `--end-day` | 日期区间 |
| `-bucketids` | `--bucket-ids` | 桶 ID |
| `-accountid` | `--account-id` | 账户 ID |
| `-hashtype` / `-idtype` | `--hash-type` / `--id-type` | 哈希/ID 类型 |
| `-blocksize` | `--block-size` | 块大小 |
| `-batchsize` | `--batch-size` | 批大小 |
| `-extfields` | `--ext-fields` | 扩展字段 |
| `-groupby` | `--group-by` | 分组 |
| `-b`（target list） | `--list-binds` | 是否列出绑定 |

## 6.2 命令总览

```sh
saasai --help
```

```
Available Commands:
  admincode   Manage admin codes
  bind        Manage target binds
  columnclear Clear columns for a data space (destructive!)
  convert     Convert data to write format (local, no network)
  exp         Manage experiments and exp grants
  grant       Manage data grants
  info        Get SaaS server info
  read        Read users' bytes / uint32s / flags
  resetds     Reset data space (destructive!)
  script      Manage lua scripts
  target      Manage targets
  task        Manage tasks
  write       Write users' bytes / uint32s / flags from files
```

:::info
saasai **不提供** `daemon` / `web` 子命令，这两类长驻服务仍由 saastool 承担。
:::

## 6.3 info

读取 sRTA 服务的基础信息（数据空间、策略 ID 等）。

| 参数 | 必填 | 含义 | 样例 |
| --- | --- | --- | --- |
| `--config` / `-c` | 否 | 配置文件路径 | `cfg.toml`（默认） |

```sh
saasai info
```

**输出示例**

```json
{
  "schema_version": "v1",
  "status": "success",
  "code": 0,
  "command": "info",
  "data": {
    "dataspace": { "did": ["did", "20010101"], "wuid": ["wuid", "20010201"] },
    "targetId": ["test44"]
  }
}
```

## 6.4 read（读取用户数据）

读取指定用户在数据空间中的数据（bytes / uint32s / flags）。

| 参数 | 必填 | 含义 | 样例 |
| --- | --- | --- | --- |
| `--ds` | 是 | 数据空间 ID | `did`、`wuid`、`geo`、`geoip`、`geofac` |
| `--user-ids` | 是 | 用户 ID 列表（逗号分隔，最多 100 个） | `cfcd208495d565ef66e7dff9f98764da` |
| `--appid` | 否 | 小程序 appid | `wx1111111111111111` |
| `--account-id` | 否 | 账户 ID，`--ds=wuid` 且 `--appid` 非空时必填 | `123` |
| `--id-type` | 否 | 哈希类型：0=DEFAULT、1=PHONE_MD5、2=PHONE_SHA256 | `1` |
| `--config` / `-c` | 否 | 配置文件路径 | `cfg.toml`（默认） |

:::tip[wuid 数据空间的参数约束]
- `--ds=wuid` 且 `--appid` 为空：`--id-type` 必须为 `1` 或 `2`。
- `--ds=wuid` 且 `--appid` 非空：必须指定 `--account-id`。
:::

**使用示例**

```sh
# did 单用户
saasai read --ds did --user-ids cfcd208495d565ef66e7dff9f98764da

# did 多用户
saasai read --ds did --user-ids cfcd208495d565ef66e7dff9f98764da,a87ff679a2f3e71d9181a67b7542122c

# wuid + openid
saasai read --ds wuid --user-ids o_e3j4ggVPO2CP8iCPBLunzKL79n --appid wx1111111111111111 --account-id 123

# wuid + 手机号 MD5
saasai read --ds wuid --id-type 1 --user-ids 6b23320fcfc29304d73ce8090bce8e96
```

## 6.5 write（写入用户数据）

向指定数据空间批量写入，source 可以是单文件或目录（递归处理）。

| 参数 | 必填 | 含义 | 样例 |
| --- | --- | --- | --- |
| `--source` | 是 | 本地文件或目录（JSONL 格式） | `./users.jsonl` 或 `./data_dir/` |
| `--ds` | 是 | 数据空间 ID | `did`、`wuid`、`geo` 等 |
| `--appid` | 否 | 小程序 appid | `wx1111111111111111` |
| `--account-id` | 否 | `--ds=wuid` + `--appid` 非空时必填 | `123` |
| `--id-type` | 否 | 哈希类型：0/1/2 | `1` |
| `--batch-size` | 否 | 批处理大小 | `10000`（默认） |
| `--clear` | 否 | 写入前清空所有数据（破坏性） | — |
| `--dry-run` | 否 | 仅预览 | — |
| `--config` / `-c` | 否 | 配置文件路径 | `cfg.toml`（默认） |

**数据格式（JSONL，每行一个 `WriteItem` 的 protojson）**

```json
{"userid":"cfcd208495d565ef66e7dff9f98764da","bytesKv":{"1":1,"2":100},"uint32sKv":{"1":1000000}}
{"userid":"a87ff679a2f3e71d9181a67b7542122c","bytesKv":{"1":2},"flagsWithExpireKv":{"1":{"flag":true}}}
```

**使用示例**

```sh
# 单文件
saasai write --ds did --source ./users.jsonl

# 整个目录（递归），batch=5000
saasai write --ds did --source ./data_dir/ --batch-size 5000

# 先清空再写入
saasai write --ds did --source ./users.jsonl --clear

# wuid + 手机号 MD5
saasai write --ds wuid --id-type 1 --source ./phone_write.jsonl --batch-size 2000

# 预览
saasai --dry-run write --ds did --source ./users.jsonl --clear
```

**输出示例**

```json
{
  "status": "success",
  "code": 0,
  "command": "write",
  "data": { "processed_items": 10000, "failed_items": 0 }
}
```

## 6.6 resetds（重置数据空间）

清除指定数据空间中的全部数据。

:::warning
破坏性操作，请先用 `--dry-run` 预览。
:::

| 参数 | 必填 | 含义 | 样例 |
| --- | --- | --- | --- |
| `--ds` | 是 | 数据空间 ID | `did`、`geo`、`geofac` |
| `--dry-run` | 否 | 仅预览 | — |
| `--config` / `-c` | 否 | 配置文件路径 | `cfg.toml`（默认） |

```sh
saasai --dry-run resetds --ds geo
saasai resetds --ds geo
```

## 6.7 convert（数据转换）

根据映射配置把原始数据（`userid\t[tag1 tag2 ...]` 格式）转换成 write 可消费的 JSONL。**纯本地操作，不访问后端**。

| 参数 | 必填 | 含义 | 样例 |
| --- | --- | --- | --- |
| `--map` | 是 | 映射配置文件（JSON） | `./map.json` |
| `--source` | 是 | 源数据文件或目录 | `./raw_data/` |
| `--dest` | 是 | 输出目录 | `./converted_data/` |

**映射文件样例**

```json
{
    "targets": {
        "news_1": { "write_byte": 1, "write_byte_pos": 0 },
        "music_2": { "write_byte": 2, "write_byte_pos": 1 }
    }
}
```

```sh
saasai convert --map ./map.json --source ./raw_data/ --dest ./converted_data/
```

## 6.8 columnclear（列清零）

对数据空间的列（byte/uint32/flag）清零。

:::warning
破坏性操作，建议先 `--dry-run`。
:::

| 参数 | 必填 | 含义 | 样例 |
| --- | --- | --- | --- |
| `--ds` | 是 | 数据空间 ID | `did`、`wuid` 等 |
| `--all` | 否 | 清零所有列 | — |
| `--u8` | 否 | uint8 列索引（1–64），逗号分隔 | `1,2,3` |
| `--u32` | 否 | uint32 列索引（1–8），逗号分隔 | `1,2` |
| `--flag` | 否 | flag 列索引（1–4），逗号分隔 | `1,2` |
| `--dry-run` | 否 | 仅预览 | — |
| `--config` / `-c` | 否 | 配置文件路径 | `cfg.toml`（默认） |

:::tip
必须指定 `--all` 或 `--u8` / `--u32` / `--flag` 之一。
:::

```sh
saasai --dry-run columnclear --ds did --u8 1,2,3
saasai columnclear --ds did --all
saasai columnclear --ds wuid --u32 1,2 --flag 1
```

## 6.9 task（任务管理）

文件上传任务的全生命周期管理。

```
Available Commands:
  create    Create a task on server
  delete    Delete a task on server
  download  Download task's file blocks to local
  info      Get a task info
  list      List tasks on server
  make      Make file hash for upload task (local, no network)
  run       Run a task on server
  upload    Upload task's file blocks to server
```

### 6.9.1 task list

| 参数 | 必填 | 含义 | 样例 |
| --- | --- | --- | --- |
| `--status` | 否 | `all`/`waiting`/`running`/`success`/`fail` | `running` |
| `--config` / `-c` | 否 | 配置文件路径 | `cfg.toml`（默认） |

```sh
saasai task list
saasai task list --status running
```

### 6.9.2 task make

本地计算文件 / 目录的分块 SHA256，输出 hash 文件。**不联网**。

| 参数 | 必填 | 含义 | 样例 |
| --- | --- | --- | --- |
| `--source` | 是 | 本地文件或目录 | `./data.jsonl` |
| `--hash-file` | 是 | 输出 hash 文件路径 | `./task.json` |
| `--ds` | 是 | 数据空间 ID | `did`、`wuid` |
| `--block-size` | 否 | 块大小，支持 `K/M/G/T`（50M–200M） | `100M`（默认 `50M`） |
| `--appid` | 否 | 小程序 appid | `wx1111111111111111` |
| `--account-id` | 否 | `--ds=wuid` + `--appid` 非空时必填 | `123` |
| `--hash-type` | 否 | 0/1/2 | `1` |
| `--desc` | 否 | 任务描述 | `"批量导入"` |

```sh
saasai task make --source ./users.jsonl --hash-file ./task.json --ds did
saasai task make --source ./data_dir/ --hash-file ./task.json --ds did --block-size 100M
saasai task make --source ./users.jsonl --hash-file ./task.json \
                 --ds wuid --appid wx1111111111111111 --account-id 123 \
                 --desc "openid 用户导入"
```

**输出示例**

```json
{
  "status": "success",
  "command": "task make",
  "data": {
    "hash_file": "./task.json",
    "task_sha256": "abc123...",
    "task_size": 1048576,
    "file_count": 1
  }
}
```

### 6.9.3 task create

上传 hash 文件到服务端，创建任务。**支持 `--hash-file -` 从 stdin 读取**。

| 参数 | 必填 | 含义 | 样例 |
| --- | --- | --- | --- |
| `--hash-file` | 是 | hash 文件路径，或 `-` 表示 stdin | `./task.json` |
| `--dry-run` | 否 | 仅预览 | — |

```sh
saasai task create --hash-file ./task.json
cat task.json | saasai task create --hash-file -
saasai --dry-run task create --hash-file ./task.json
```

### 6.9.4 task upload

| 参数 | 必填 | 含义 | 样例 |
| --- | --- | --- | --- |
| `--sha256` | 是 | 任务 SHA256 | `abc123...` |

```sh
saasai task upload --sha256 abc123...
```

**输出示例**

```json
{
  "status": "success",
  "command": "task upload",
  "data": {
    "sha256": "abc123...",
    "uploaded_blocks": 12,
    "skipped_blocks": 0,
    "total_files": 1
  }
}
```

### 6.9.5 task download

| 参数 | 必填 | 含义 | 样例 |
| --- | --- | --- | --- |
| `--sha256` | 是 | 任务 SHA256 | `abc123...` |
| `--dest` | 是 | 本地目标目录 | `./output/` |

```sh
saasai task download --sha256 abc123... --dest ./output/
```

### 6.9.6 task run

```sh
saasai task run --sha256 abc123...
saasai --dry-run task run --sha256 abc123...
```

### 6.9.7 task delete

```sh
saasai task delete --sha256 abc123...
saasai --dry-run task delete --sha256 abc123...
```

### 6.9.8 task info

```sh
saasai task info --sha256 abc123...
```

**任务不存在时的错误输出**（stderr，exit=30）：

```json
{
  "status": "error",
  "code": 30,
  "command": "task info",
  "error": {
    "type": "NOT_FOUND",
    "message": "任务不存在",
    "retriable": false,
    "details": { "sha256": "abc123..." }
  }
}
```

## 6.10 target（策略管理）

```
Available Commands:
  create  Create a target
  delete  Delete a target
  list    List targets
```

### 6.10.1 target list

| 参数 | 必填 | 含义 | 样例 |
| --- | --- | --- | --- |
| `--targets` | 否 | 策略 ID 列表，逗号分隔（空=全部） | `target1,target2` |
| `--list-binds` | 否 | 同时列出绑定 | — |

```sh
saasai target list
saasai target list --targets target1,target2 --list-binds
```

### 6.10.2 target create

| 参数 | 必填 | 含义 | 样例 |
| --- | --- | --- | --- |
| `--target` | 是 | 策略 ID（3–20 字符） | `my_target` |
| `--desc` | 否 | 策略描述 | `"核心策略"` |
| `--dry-run` | 否 | 仅预览 | — |

```sh
saasai target create --target my_target --desc "核心用户策略"
saasai --dry-run target create --target my_target
```

### 6.10.3 target delete

| 参数 | 必填 | 含义 | 样例 |
| --- | --- | --- | --- |
| `--target` | 是 | 策略 ID | `my_target` |
| `--dry-run` | 否 | 仅预览 | — |

```sh
saasai target delete --target my_target
saasai --dry-run target delete --target my_target
```

## 6.11 bind（策略绑定）

```
Available Commands:
  delete      Delete binds
  setaccount  Set Account binds
  setad       Set AdGroup binds
```

### 6.11.1 bind setaccount

| 参数 | 必填 | 含义 | 样例 |
| --- | --- | --- | --- |
| `--target` | 是 | 策略 ID | `my_target` |
| `--accounts` | 是 | 广告主 ID 列表（逗号分隔） | `123,456,789` |
| `--dry-run` | 否 | 仅预览 | — |

```sh
saasai bind setaccount --target my_target --accounts 123,456
```

### 6.11.2 bind setad

| 参数 | 必填 | 含义 | 样例 |
| --- | --- | --- | --- |
| `--target` | 是 | 策略 ID | `my_target` |
| `--account` | 是 | 广告主 ID | `123` |
| `--ads` | 是 | 广告组 ID 列表（逗号分隔） | `1001,1002` |
| `--dry-run` | 否 | 仅预览 | — |

```sh
saasai bind setad --target my_target --account 123 --ads 1001,1002,1003
```

### 6.11.3 bind delete

| 参数 | 必填 | 含义 | 样例 |
| --- | --- | --- | --- |
| `--target` | 是 | 策略 ID | `my_target` |
| `--ids` | 是 | 要删除的 ID 列表（逗号分隔） | `1001,1002` |
| `--id-type` | 否 | 0=自动匹配、1=广告组、3=账户 | `1` |
| `--dry-run` | 否 | 仅预览 | — |

```sh
saasai bind delete --target my_target --ids 1001,1002
saasai bind delete --target my_target --id-type 1 --ids 1001
saasai bind delete --target my_target --id-type 3 --ids 123
```

## 6.12 grant（授权管理）

```
Available Commands:
  add     Add data grant
  delete  Delete data grant
  list    List data grants
```

### 6.12.1 grant list

```sh
saasai grant list
```

### 6.12.2 grant add

| 参数 | 必填 | 含义 | 样例 |
| --- | --- | --- | --- |
| `--account` | 是 | 被授权的 sRTA 账号 ID | `2001` |
| `--ds` | 是 | Raw 数据空间 ID | `20010101` |
| `--index` | 是 | 授权位索引，支持单个或范围 | `"1,2,4,55-64"` |
| `--dry-run` | 否 | 仅预览 | — |

```sh
saasai grant add --account 2001 --ds 20010101 --index "1,2,4,10-20"
```

### 6.12.3 grant delete

参数同 `grant add`：

```sh
saasai grant delete --account 2001 --ds 20010101 --index "1,2"
```

## 6.13 script（脚本管理）

```
Available Commands:
  create  Create lua script on server
  debug   Debug lua script on server
  delete  Delete a script from server
  get     Get script content from server
  list    List all scripts on server
  use     Use a script as default
```

### 6.13.1 script list

```sh
saasai script list
```

### 6.13.2 script debug（别名：`run`）

在服务端运行本地 Lua 脚本进行调试。

| 参数 | 必填 | 含义 | 样例 |
| --- | --- | --- | --- |
| `--lua` | 是 | Lua 文件路径，或 `-` 表示 stdin | `./script.lua` |
| `--userid` | 是 | 测试用户 ID | `abc123...` |
| `--ds` | 否 | 数据空间 ID | `did` |
| `--os` | 否 | 1=iOS、2=Android、7=Harmony | `2`（默认） |

```sh
saasai script debug --lua ./script.lua --userid abc123 --os 2
saasai script run   --lua ./script.lua --userid abc123 --os 1
cat script.lua | saasai script debug --lua - --userid abc123 --ds did
```

**JSON 模式下的结构化输出**

```json
{
  "status": "success",
  "command": "script debug",
  "data": {
    "error_output": "...",
    "print_output": "...",
    "dataspace_output": "...",
    "targets_output": "..."
  }
}
```

### 6.13.3 script create

| 参数 | 必填 | 含义 | 样例 |
| --- | --- | --- | --- |
| `--lua` | 是 | Lua 文件路径，或 `-` | `./script.lua` |
| `--name` | 是 | 脚本名（3–20 字符） | `my-script` |
| `--dry-run` | 否 | 仅预览 | — |

```sh
saasai script create --lua ./script.lua --name my-script
cat script.lua | saasai script create --lua - --name my-script
```

### 6.13.4 script delete / get / use

| 参数 | 必填 | 含义 |
| --- | --- | --- |
| `--name` | 是 | 脚本名 |
| `--dry-run` | 否（仅 delete） | 仅预览 |

```sh
saasai script delete --name my-script
saasai script get    --name my-script
saasai script use    --name my-script
```

## 6.14 exp（实验管理）

```
Available Commands:
  get    Get exp report
  grant  Manage experiment authorizations
  list   List experiments
```

### 6.14.1 exp list

```sh
saasai exp list
```

### 6.14.2 exp get

| 参数 | 必填 | 含义 | 样例 |
| --- | --- | --- | --- |
| `--begin-day` | 是 | 开始日期（YYYYMMDD，范围 20250101–21001231） | `20250101` |
| `--end-day` | 是 | 结束日期 | `20250131` |
| `--target` | 是 | 策略 ID | `my_target` |
| `--bucket-ids` | 否 | 桶 ID 列表（逗号分隔，值范围 1–10；空=全部） | `1,2,3` |
| `--uid` | 否 | 广告主 ID 列表（逗号分隔） | `123,456` |
| `--group-by` | 否 | 分组字段（逗号分隔；允许：`advertiser_id`、`user_weight_factor`） | `advertiser_id` |
| `--ext-fields` | 否 | 扩展字段（逗号分隔；`*` 表示全部） | `*` |
| `--total` | 否 | 返回总计数据 | — |

```sh
saasai exp get --begin-day 20250101 --end-day 20250131 --target my_target
saasai exp get --begin-day 20250101 --end-day 20250131 --target my_target --bucket-ids 1,2,3
saasai exp get --begin-day 20250101 --end-day 20250131 --target my_target \
               --uid 123,456 --group-by advertiser_id
saasai exp get --begin-day 20250101 --end-day 20250131 --target my_target --total --ext-fields "*"
```

### 6.14.3 exp grant list / add / delete

```sh
saasai exp grant list
saasai exp grant add    --account 12345
saasai exp grant delete --account 12345
saasai --dry-run exp grant add --account 12345
```

| 参数 | 必填 | 含义 | 样例 |
| --- | --- | --- | --- |
| `--account` | 是（add/delete） | sRTA 账户 ID | `12345` |
| `--dry-run` | 否（仅 add/delete） | 仅预览 | — |

## 6.15 admincode（行政区划代码）

查询中国行政区划代码。

```sh
saasai admincode list
saasai -o table admincode list   # 人类可读
```

**返回数据示例**

```json
{
  "status": "success",
  "command": "admincode list",
  "data": {
    "adminCodes": [
      { "code": "110000", "province": "北京市", "city": "北京市" },
      { "code": "120000", "province": "天津市", "city": "天津市" },
      { "code": "310000", "province": "上海市", "city": "上海市" }
    ]
  }
}
```

## 6.16 AI Agent / 脚本集成范式

### 6.16.1 Bash

```sh
if saasai task info --sha256 "$H" > ok.json 2> err.json; then
    jq '.data' ok.json
else
    code=$?
    TYPE=$(jq -r '.error.type' err.json)
    RETRIABLE=$(jq -r '.error.retriable' err.json)
    case "$code" in
        50|51|60) echo "retriable (type=$TYPE), backoff..." ;;
        30)       echo "not found, skip" ;;
        2|10|20|21|40) echo "fix input first (type=$TYPE)"; exit 1 ;;
        *)        echo "unknown (type=$TYPE)"; exit 1 ;;
    esac
fi
```

### 6.16.2 Python

```python
import json, subprocess

res = subprocess.run(
    ["saasai", "-c", "cfg.toml", "task", "list"],
    capture_output=True, text=True,
)
if res.returncode == 0:
    data = json.loads(res.stdout)["data"]
else:
    err = json.loads(res.stderr)["error"]
    if err["retriable"]:
        ...  # schedule retry with backoff
    else:
        raise RuntimeError(f"{err['type']}: {err['message']}")
```

### 6.16.3 关键约定

- **永远先看 exit code**，再解析 stderr（error）或 stdout（data）。
- **失败时 stdout 一定为空**，可放心 `cmd > out.json` 或 `| jq`。
- **JSON 模式下 stderr 也是纯净 JSON**（或完全为空），方便 `2> err.json` 后直接解析。
- 需要人工可读时加 `-o table`；需要诊断时加 `-v` 或 `-vv`。

## 6.17 与 saastool 的关系

| 维度 | saastool | saasai |
| --- | --- | --- |
| 目标用户 | 人类（运维、开发） | AI Agent / CI / 自动化脚本 |
| 参数风格 | Go `flag`：`-config`、`-hashfile` | GNU：`--config`、`--hash-file` |
| 默认输出 | table（`task res: {...}` 等带前缀文本） | JSON envelope |
| 失败 stdout | 可能有 `Command failed.` 前缀文本 | 严格为空 |
| 退出码 | 0（成功）/ 1（失败） | 0 / 2 / 10 / 20 / 21 / 30 / 40 / 50 / 51 / 60 |
| `--dry-run` | 不支持 | 覆盖所有破坏性命令 |
| stdin 输入 | 不支持 | `--hash-file -`、`--lua -` |
| 守护进程/HTTP | 支持（`daemon` / `web`） | 不提供（仍由 saastool 承担） |
| 配置文件 | `cfg.toml` | `cfg.toml`（**完全共用**） |
| 账号/签名 | 同一套 `[auth]` 机制 | 同一套 `[auth]` 机制 |

:::tip
两个二进制 **共用同一份 `cfg.toml`**，账号 / Token / baseurl 完全兼容，可并存使用。
:::
