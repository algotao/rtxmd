# rtxmd 文档与代码差异审计清单

> 审计日期：2026-11-15
> 审计方式：先只读比对形成差异清单；其后按处理记录对部分条目做了修复/状态标记
> 文档项目：`/data/workspace/self/rtxmd`
> 对照代码：
> - `i2`：实时决策系统（Go 1.25.0），对应 RTA / sRTA 侧实现
> - `saasapi`：`saasai` / `saastool` CLI 与 SaaS API 服务实现
>
> 文档与代码映射：`docs/rta/*` → i2（RTA 侧）；`docs/srta/*` → i2（sRTA 决策）+ saasapi（`saasai` / `saastool` CLI）。

## 状态说明

| 状态 | 含义 |
| --- | --- |
| `⏸️ 忽略` | RTA 文档问题，本轮不处理、不跟进（仅留存记录） |
| `🔴 待处理` | sRTA 及相关问题，本轮聚焦对象 |
| `✅ 已修复` | 已修改文档或代码，差异消除（见对应处理记录） |
| `⏸️ 不公开` | 经确认为暂不公开或旧命名兼容用途，不写入公开文档，不作为差异跟进 |

本轮聚焦 **sRTA 及相关**（sRTA 文档 ↔ i2、`saasai.md`/`saastool.md` ↔ saasapi）；RTA 文档问题全部标记为 `⏸️ 忽略`。

---

# 第一部分 RTA 文档问题（⏸️ 忽略）

## 1.1 `rta/dev/proto.md` ↔ i2（14 项，全部忽略）

| # | 状态 | 分类 | 文档描述 | 代码实际 |
|---|---|---|---|---|
| 1 | ⏸️ 忽略 | 字段已删除 | `Product.id_str = 5`（proto.md:155/400）仍定义并"推荐使用" | `api/rta/tencent.proto:251`、`api/rtaproto/tencent.proto:130` 的 Product 只有 id/priority/timestamp/sdpa_product_id，无 `id_str` |
| 2 | ⏸️ 忽略 | 字段状态不符 | `siteset_id` 标注"(已禁用)"（proto.md:94/268） | `tencent.proto:133` 无禁用注释；`handler_tencent.go:156,950-958` 仍读取并按 SiteSet 统计 |
| 3 | ⏸️ 忽略 | wire 编码 | `doubtful_ids_list = 9` 无 packed（proto.md:64） | `tencent.proto:48` 为 `[packed=true]`（proto2 默认非 packed，影响二进制兼容） |
| 4 | ⏸️ 忽略 | 新增未记载 | Device 止于 `wx_openid=14`（proto.md:46-91） | 代码另有 wuid/resident_lbs/connection_type+枚举/province_name/city_name/ott_mark/installed_app_status/target_installed_app_hashs/brand_and_model/user_agent/latitude/longitude/location_accuracy（tencent.proto:63-129） |
| 5 | ⏸️ 忽略 | 新增未记载 | AdInfo 无内部子消息（proto.md:110-127） | 新增 `PartTargetInfo`、`InnerAdData inner_ad_data=99`（tencent.proto:173-198） |
| 6 | ⏸️ 忽略 | 新增未记载 | TargetInfo 到 `sp_action=18`，无 16 号字段 | 新增 `ExtFeatureFactors=16` 及 `RtaSceneId` 6 个场景枚举（tencent.proto:301-321），`handler_tencent.go:319-344` 已实际下发 |
| 7 | ⏸️ 忽略 | 新增未记载 | 响应无调试字段 | 新增 `Debug debug=990`、`DebugOut debug_out=990`（tencent.proto:243-248,379-398） |
| 8 | ⏸️ 忽略 | 已删除 | `SpAssistType`/`SpAssist`/`sp_action`（proto.md:178-203）完整描述 | 服务实际 proto `api/rta/tencent.proto:286-323` 已全部删除（仅废弃的 `rtaproto/tencent.proto` 保留） |
| 9 | ⏸️ 忽略 | 已删除 | `AdResult.raise_factor_to_tencent=12`（proto.md:232/424） | 实际服务 proto `tencent.proto:329-359` 已删除 |
| 10 | ⏸️ 忽略 | 字段名错 | `cached_device_type`/`float_embedding`/`dynamic_product_info`/`sdpa_dynamic_product_info`（proto.md:289/345/356/363） | 代码为 `cached_deviceid_type`/`embedding`/`dynamic_product_infos`/`sdpa_dynamic_product_infos` |
| 11 | ⏸️ 忽略 | 类型错 | `dsp_tag/pcvr/advertiser_id/sdpa_product_lib` 标为 string，`Product.timestamp` 标为 uint32（proto.md:377-398） | 代码为 uint64/float/uint64/uint64/uint64；与文档自带 proto 块也矛盾 |
| 12 | ⏸️ 忽略 | 层级错 | `sp_action` 列为 RtaResponse 顶层字段（proto.md:364） | 实际是 TargetInfo 成员，且服务 proto 已删除 |
| 13 | ⏸️ 忽略 | 包名 | `package tencent.ad.rta`（proto.md:25） | 代码 `package tencent` |
| 14 | ⏸️ 忽略 | 整类未覆盖 | 只描述腾讯主协议 | 代码另有 `tencentsp.proto`、`kuaishou.proto`、`qutoutiao.proto` 三套协议，文档无记载 |

**补充（签名相关，忽略）**：`sign.md` 描述的是签名 Header 的 KV 配置管理（sign_get/sign_set），不包含密码学签名算法，且该套接口在 i2 中无实现。代码里真实存在的两处 MD5 签名——`rtacaller/httpcmd.go:101-112`（`timestamp+SecKey`）与 `rtasaasapiserver/api.go:374`（`account+Token+timestamp`）——文档完全未记载。

## 1.2 `rta/_api/*` ↔ i2（6 项，全部忽略）

| # | 状态 | 分类 | 文档描述 | 代码实际 |
|---|---|---|---|---|
| 15 | ⏸️ 忽略 | 整套接口无实现 | JSON API `https://api.algo.com.cn/rta/$function$/$operate$`（common.md:32-37），function 含 info/sign/target/bind/exp/bitmap/filter | i2 全库无这些端点；`rtasaasapiserver` 为 protobuf 协议（`api.go:180,242,254`） |
| 16 | ⏸️ 忽略 | 路径不符 | `/rta/info/get`、`/rta/sign/get|set`、`/rta/target/get|set|delete`、`/rta/bind/get|set|delete` | 代码路由为 `/info`、`/target/list|create|delete`、`/bind/set|delete`；无 sign 路由、无 target/get、bind/get（`config.go:158-175`、`service.go:170-196`） |
| 17 | ⏸️ 忽略 | 鉴权机制 | `auth{dspid,token}` 放在 JSON body | 代码用 `Account/Time/Authorization` 三个 Header，`md5(account+Token+timestamp)`，时间窗 ±1800s（`api.go:287-289,339-343,374`） |
| 18 | ⏸️ 忽略 | 响应字段 | `code/msg/taskid/sandbox/data`（且 `taskid`/`task_id` 文档自身不一） | `SaasRes` 仅 code/status/data，无 taskid/sandbox（`api.go:86,246-254`） |
| 19 | ⏸️ 忽略 | 字段命名 | `targetid`/`targetdesc`（target.md:49-50,178） | 代码/示例/proto 统一为 `target_id`/`target_desc` |
| 20 | ⏸️ 忽略 | 限制未体现 | `response_cache_time` ≤7天、`priority`∈[1,100]、sandbox"开发中"却又设专章（common.md:44,100-107） | proto 均为无约束 uint；sandbox 状态文档自相矛盾 |

## 1.3 RTA 应用/规则/工具/架构文档 ↔ i2（12 项，全部忽略）

| # | 状态 | 分类 | 文档描述 | 代码实际 |
|---|---|---|---|---|
| 21 | ⏸️ 忽略 | 功能已注释 | 快捷管理依赖 `/rtacaller/auth|setTarget|deleteTarget`（_manage.md:30,48,82） | `main.go:19-23` 三个路由整段注释，无 handler 实现（该文档标 `draft:true`） |
| 22 | ⏸️ 忽略 | 行为未披露 | debug.md 仅描述联调工具 | `main.go:25` + `reverseproxy.go:8-13`：rtacaller 还对 `/` 全量反代到 `https://wiki.algo.com.cn` |
| 23 | ⏸️ 忽略 | 死代码 | 未提及 | 代码有已注释的 SP 命令、未使用的 `SendSRTADebug*` 结构（httpcmd.go:101-120,740-975） |
| 24 | ⏸️ 忽略 | 端点不存在 | `POST /rta/bid`（http.md:29） | 全仓无此路由；实际为 `/tsaas`、`/tsaas_p3`（rtadsp.toml:18,22） |
| 25 | ⏸️ 忽略 | 数值无实现+自相矛盾 | 并发 10-20W（http.md:104）/ 20-30W（arch.md:15）/ 25W峰值30W（faq.md:62）；带宽 800-1000M vs 300-500M | 代码无限流逻辑；数值为平台经验值，文档内部互相冲突 |
| 26 | ⏸️ 忽略 | 时延口径 | 上限 60ms（http.md:21/faq.md:25）、二次 80ms（rtaex.md:29） | 代码仅 `durTime > 1s` 告警（handler_tencent.go:127-134），无 60/80ms 判定 |
| 27 | ⏸️ 忽略 | 错误率口径 | <1%（apply.md）/ <2%（http.md:22）/ >5%清退（assessment.md:21） | 代码无对应校验 |
| 28 | ⏸️ 忽略 | 缓存上限冲突 | 1-24小时（rule.md:46/apply.md:59） vs 最低1小时最高7天（faq.md:54） | 代码仅全局 `RejectCacheTime`（config.go:59,handler:200-203），无范围校验 |
| 29 | ⏸️ 忽略 | 字段映射错 | `__RTA_USER_WEIGHT__` 对应 `user_weight`（macro.md:20） | proto 只有 `user_weight_factor=6`（tencent.proto:291） |
| 30 | ⏸️ 忽略 | 架构定位 | arch.md 描述"客户侧 RTA DSP + Redis + protobuf/HSET"架构 | i2 实为平台侧多服务拓扑 + 自研 kvrocks V2/V3 紧凑编码 + Lua 沙箱（README.md:3-16）；arch.md:48"策略管理"小节还是空标题 |
| 31 | ⏸️ 忽略 | 文档过简 | decode.md 仅组件占位 | 代码实际支持 4 类解码（decode.go:41-147） |
| 32 | ⏸️ 忽略 | 无法验证 | ping"多地返回"（ping.md:3）、provider/服务商资料、apps/_rule 准入门槛 | 后端 ping 无地区参数（httpcmd.go:81-85,635-731），多地应由前端分部署实现；provider 等为行业知识，无代码对应 |

> RTA 部分已核对一致：核心消息头字段编号/类型、`OperatingSystem`/`CacheDeviceIdType`/`RequestType` 枚举、HTTP 传输层（`POST` + `application/x-protobuf`）、`code` 语义、全 optional 约定、debug.md 的镜像名/`:8080` 端口与日志文案（`main.go:27-28`）。

---

# 第二部分 sRTA 及相关（🔴 本轮聚焦）

## 2.1 sRTA 文档 ↔ i2（14 项）

### Lua / 沙箱（7 项）

| # | 状态 | 分类 | 文档描述 | 代码实际 |
|---|---|---|---|---|
| S1 | ✅ 已修复 | 漏列 | 系统全局函数仅 6 个（lua.md:13-22） | 还注册了 `ipairs`/`pairs`（baselib.go:23-31），文档示例自身大量使用 ipairs |
| S2 | ✅ 已修复 | 常量不可用 | `srta.OS_HARMONY`（lua.md:55） | 定义=7 但未注册进 Lua 模块（srtalib.go:34 vs 1214-1217），脚本访问得 nil |
| S3 | ⏸️ 不公开 | 函数漏列 | srta 函数列表 14 项（lua.md:102-120），5.5.2 标"待更新" | 注册 22 项，多出 `get_phase`/`has_price`/`get_did_unavailable`/`get_data`/`get_adlist`（srtalib.go:203-226） |
| S4 | ⏸️ 不公开 | 整套 API 缺失 | second.md 无 `has_price`/`PRICE_*`/`price_mask` | 已实现并在 todo 设计详述（srtalib.go:212,469,479-489,1239-1243） |
| S5 | ✅ 已修复 | 模块缺失 | 内置模块只有 string/time（lua.md:801-846） | 另有 math 模块（abs/floor/ceil/min/max，mathlib.go:25-31） |
| S6 | ✅ 已修复 | 漏列 | time 函数 10 项（lua.md:833-846） | 另有 `time.diff`（timelib.go:16,45-48） |
| S7 | 🔴 待处理 | 双向不一致 | hijack 桩含 `srta_get_extscore`/`srta_get_geo_nearest`/`srta_get_geo_points`（lua.md:1135-1195,1259-1276） | 沙箱不处理这三个，却支持文档未列的 `srta_get_pos_level`（hijack.go:58-120） |

### API（4 项）

| # | 状态 | 分类 | 文档描述 | 代码实际 |
|---|---|---|---|---|
| S8 | ✅ 已修复 | 限制数值 | `where_begin_time` 不早于 T-2（api.md:2111） | 代码 T-7（rtexp_get.go:81-86），设计文档 RTEXP_DESIGN.md:138 也写 T-2 |
| S9 | ✅ 已修复 | 限制未实现 | ResetDs：有运行任务不可调用、每日上限 5 次（api.md:1133-1135） | `resetds.go:29-77` 只做类型校验+DEL，无这两项（对比 columnclear.go:48-53 有运行任务检查） |
| S10 | 🔴 待处理 | 枚举未处理 | ScriptDebug `os=HARMONY(7)`（api.md:1735、proto:760） | `script_debug.go:131-162` 两个 switch 均无 HARMONY 分支，传 7 不生效 |
| S11 | ✅ 已修复 | 数值自相矛盾 | `uint32s_kv` key "1-4"（api.md:1069），proto/清零处写"1-8" | 实际为 1-8（srtalib.go:29、columnclear.go:74-82） |

### 其它（3 项）

| # | 状态 | 分类 | 文档描述 | 代码实际 |
|---|---|---|---|---|
| S12 | 🔴 待处理 | 公式错误 | 经纬度转换用 `(lng+180)/(lat+90)×1e6`（workflow.md:2174-2187），示例天安门→296397128 | 代码读出直接 `/1e6`、无偏移，并校验 `lng∈[-180,180]`（ds_redis_saas.go:132-139）；照文档写入会被范围检查丢弃，且与文档自身示例 116397128 矛盾 |
| S13 | 🔴 待处理 | 列编号 | "uint8 的第 0 列"（workflow.md:229） | 实际 1-based（1-64，srtalib.go:760、hijack.go:171-175） |
| S14 | 🔴 待处理 | 状态失效 | `return results`"2026 年 9 月底停止支持"（lua.md:92,252,577,1012,1043；workflow.md:144） | 到期后代码仍完整保留该路径（ds_redis_saas.go:1009-1040） |

## 2.2 `saasai.md` / `saastool.md` ↔ saasapi（24 项）

### saasai.md（8 项）

| # | 状态 | 分类 | 文档描述 | 代码实际 |
|---|---|---|---|---|
| A1 | 🔴 待处理 | 命令不可用 | `rtexp` 子命令及整节用法（saasai.md:158,864-909） | `cmd_rtexp.go:11` 有定义但 `main.go:68-82` 注册列表无 `newRTExpCmd()`，执行报 unknown command |
| A2 | 🔴 待处理 | 配置位置错 | `#demo=true` 写在 `[apiurls]` 段内（saasai.md:111-120） | `Demo` 是顶层键，须写在任何 `[table]` 之前（client.go:11-16）；按文档写不生效 |
| A3 | 🔴 待处理 | 契约不符 | JSON 模式下 stderr 为纯净 JSON/空（saasai.md:104,979） | `logInfo/logDebug` 只检查 quiet/verbosity，不检查 outputFormat（log.go:29-42），`-v` 时 stderr 有 `[info]` 纯文本 |
| A4 | 🔴 待处理 | 示例缺字段 | 多处输出示例无 `schema_version`（部分无 `code`）（saasai.md:279,413,453,499,771,922） | `output.go` 恒定输出 `schema_version:"v1"` 与 `code` |
| A5 | 🔴 待处理 | 示例值非法 | `rtexp --base 0,1,5,6,10`（saasai.md:896,899,904,908），范围标 1-10 | 代码拒绝 0（cmd_rtexp.go:145-147） |
| A6 | 🔴 待处理 | 默认值未实现 | `--begin/end-time` 默认今天0点/当前分钟（saasai.md:880-881） | flag 默认 0 且原样透传（cmd_rtexp.go:24-25,100-112） |
| A7 | 🔴 待处理 | 必填未校验 | `bind setad --account` 标必填（saasai.md:660） | 默认 0，RunE 无校验（cmd_bind.go:82-128） |
| A8 | 🔴 待处理 | 校验未实现 | target/script 名称 3-20 字符（saasai.md:539,793） | CLI 仅检查非空（cmd_target.go:64-66、cmd_script.go:99-101） |

### saastool.md（16 项）

| # | 状态 | 分类 | 文档描述 | 代码实际 |
|---|---|---|---|---|
| B1 | 🔴 待处理 | flag 不存在 | `-cfg`/`-c`（saastool.md:57,1761） | 仅注册 `-config`（params.go:14），`-c`/`-cfg` 报 flag not defined |
| B2 | 🔴 待处理 | 帮助拼写 | `Usage: saastool`（saastool.md:419,715,948） | 代码输出 `saastoola`（task.go:42、target.go:34、bind.go:32） |
| B3 | 🔴 待处理 | 帮助文字 | "Clear columns for data space"；"Realtime exp commands"（saastool.md:31,42） | help.go:21,32 为 "for **a** data space"；"**RT Exp** commands" |
| B4 | 🔴 待处理 | 枚举未映射 | `task list -status deleted`（saastool.md:449,456） | switch 无 deleted 分支（task_list.go:40-51），静默落 ALL；proto 有 DELETED=10 |
| B5 | 🔴 待处理 | 示例值非法 | `-basebuckets 0,1,5,6,10`（saastool.md:1703,1732,1735） | 拒绝 0（rtexp_get.go:124-126） |
| B6 | 🔴 待处理 | 帮助块大不符 | rtexp get help（saastool.md:1679-1696） | `-normalize` 实际 uint；时间默认值文案不同；`-basebuckets`/`-target` 文档多标 (required)；`-expbuckets` 描述不同（params.go:154-172） |
| B7 | 🔴 待处理 | 类型/required 标注 | exp get `-beginday/-endday uint64 (required)`（saastool.md:1492-1497） | 实际渲染 `uint`，无 (required) |
| B8 | 🔴 待处理 | 类型标注 | exp grant `-account uint64 (required)`（saastool.md:1605,1634） | 实际 `uint`，无 (required)（params.go:198-200） |
| B9 | 🔴 待处理 | 类型/必填 | bind setad `-account int64 (required)`（saastool.md:1010,1021） | 实际 `int`，无校验（params.go:102-104、bind_setad.go:21-64） |
| B10 | 🔴 待处理 | 帮助块混入 | 大量 `-help` 块被加 `(required)`（saastool.md:113,174,245,276,489,542 等） | 实际 help 文案无此后缀 |
| B11 | 🔴 待处理 | 示例超上限 | `-blocksize 1G` 示例（saastool.md:507） | 合法范围 [50M,200M]，1G 报错（task_make.go:20-23,90-92） |
| B12 | 🔴 待处理 | 帮助文案 | task make `-appid/-ds/-source` 描述（saastool.md:484,489,495） | params.go:49,73,25 文案不同 |
| B13 | 🔴 待处理 | 必填表述矛盾 | wuid `-appid`"必填"（saastool.md:126,187,508），约束段又称可用 hashtype 替代 | 代码允许 appid 空 + hashtype∈{1,2}（read.go:49-61 等），约束段才正确 |
| B14 | 🔴 待处理 | 校验未实现 | target `-target` 3-20 字符（saastool.md:789） | 仅检查非空（target_create.go:28-31） |
| B15 | 🔴 待处理 | 校验未实现 | script `-name` 3-20 字符/字符集（saastool.md:1337） | 仅检查非空（script_create.go:30） |
| B16 | 🔴 待处理 | 示例值非法 | daemon 批量写 `flag.1=1758686629` 绝对时间戳（saastool.md:1934） | 纯数字按相对秒数处理且须 ≤30 天，该值报错（daemon.go:357-366） |

---

## 附：已核对一致的部分（sRTA 相关）

- **appendix.md**：行政区划码映射（抽样 100000/110000/130100/133100/469001/500100/540000 等）与 `internal/saasgeo/admincode.go` 一致；`admincode_list.go` 返回字段 code/province/city 一致。
- **api.md 错误码/枚举**：SUCC=0 … PARAM_ERROR=401、任务状态码、MAX（U8=64/U32=8/FLAG=4）、OS 值（0/1/2/7）与 `api.go:29-70` 及 vendor saasapi proto 一致。
- **api.md 限制数值**：Read 单次 100、Write 单次 10000、任务≤10、ID 3-20 字符、TargetConfigUpdate≤10、块大小 10-200MiB 与 `api.go:60-67` 等一致。
- **Lua 数据读取语义**：`get_ds_u8/u32/flag` 列范围（1-64/1-8/1-4）、取不到返回 0/0/false、FLAG 过期回退默认值、只接受 `DS_*` 常量（srtalib.go:695-821）一致。
- **Lua 常量与场景系数**：DS_*/SITESET_*/SCENE_WECHAT_*/TARGETINFO_*/DC_TAG_*/GEO_* 常量值与注册（srtalib.go:1198-1264）、场景扩展系数 0.2~5 区间（ds_redis_saas.go:1142-1160）一致。
- **second.md 核心**：价格上限 1e8 分、截断取整、广告级优先、拒绝粘性、改价隐含参竞、未知 adgroup_id 静默忽略、uint64 精度提示全部一致。
- **签名与脚本上线**：md5(Account+Token+Time)、±1800s 时间窗（api.go:286-388）、脚本上线需 lua_checked（script_use.go:49-55）一致。
- **saasai/saastool**：退出码/错误类型枚举与 retriable 标记（apperr.go:6-18,41-79）、全局 flag（main.go:56-65）、参数命名对照与 dry-run 覆盖、顶层/分组命令清单、daemon 环境变量与接口（daemon.go:29-95）、target config 字段语义、转换 map、admincode 结构、HTTP query 格式一致。

## 处理记录

| 条目 | 处理 | 改动位置 |
| --- | --- | --- |
| S1 | 已在 lua.md「5.1 系统函数列表」补充 `ipairs`/`pairs` 及说明 | `rtxmd/docs/srta/lua.md:15-24` |
| S2 | 已在 srta Lua 模块注册 `OS_HARMONY`（值 7），`srta.OS_HARMONY` 可用 | `i2/internal/saaslua/srtalib.go:1217` |
| S3 | 确认为暂不公开/历史命名兼容函数，不改代码也不公开文档，状态置 `⏸️ 不公开` | — |
| S4 | 确认 `has_price`/`PRICE_*`/`price_mask` 暂不公开，不改代码也不公开文档，状态置 `⏸️ 不公开` | — |
| S5 | 已新增「5.5 内置模块math」章节，列出 abs/floor/ceil/min/max 并给出示例；后续章节（被调函数 5.6、代码调试 5.7）顺延，锚点保持不变 | `rtxmd/docs/srta/lua.md:941` 起 |
| S6 | 已在 time 函数列表补充 `time.diff`，并新增「5.4.12 time.diff函数」小节（返回 `时间戳1 - 时间戳2`，单位秒） | `rtxmd/docs/srta/lua.md:845,944` |
| S8 | 已将 `where_begin_time` 限制由 T-2 改为 T-7，与 `rtexp_get.go:81-86` 一致 | `rtxmd/docs/srta/api.md:2111` |
| S9 | 已删除 ResetDs 的"运行中不可调用/每日上限 5 次"两条限制，改为提示语"在任务执行或写入时重置可能产生脏数据，建议在无执行时重置" | `rtxmd/docs/srta/api.md:1133` 附近 |
| S11 | 已将 `write_item.uint32s_kv` 的 key 范围由 1-4 统一为 1-8；核实 `internal/saasstore/geo_write.lua` 中 `read_kv2(8)`、`for i=0,7` 及 `geo_write.md` 的 `idx ∈ [1,8]`，与 srtalib/columnclear 的 8 列一致 | `rtxmd/docs/srta/api.md:1069` |

## 备注

- RTA 部分（第一部分）本轮已完成"忽略"标记；如后续需要恢复跟进，将对应条目的状态由 `⏸️ 忽略` 改为 `🔴 待处理` 即可。
- S3/S4 的 `⏸️ 不公开` 表示确认不纳入公开文档，如后续决定公开，可将状态改为 `🔴 待处理` 并同步补充文档。
- "代码有、文档无"类条目仅陈述 API 客观存在，不代表功能缺陷。
- 纯行业知识/平台运营类内容（provider 服务商资料、准入门槛、QPS/带宽经验值等）无代码对应，无法用代码验证。
