---
sidebar_position: 1
toc_max_heading_level: 5
draft: false
description: RTA申请各能力所需的流程、角色、沟通方式等的描述。
keywords: [RTA, 功能申请]
---

# 申请项目

## 申请
### 需申请

| 申请项 | 申请发起方 | 申请接收方 | 备注 |
| ----  | ---- | ---- | ---- |
| 新客准入| AMS运营 | RTA产研 | [准入申请](/docs/rta/rule/apply.md) |
| 重启准入 | AMS运营 | RTA产研 | [准入申请](/docs/rta/rule/apply.md) |
| openid交互 | AMS运营 | --- | ---- |
| 加权加价能力 | 客户/服务商 | RTA产研 | 线上沟通 |
| 赔付期加权加价 | 客户/服务商 | RTA产研 | 线上沟通 |
| DPA决策 | 客户/服务商 | RTA产研 | 线上沟通 |
| 二次请求 | 客户/服务商 | RTA产研 | 线上沟通 |
| 更多实验层 | 客户/服务商 | RTA产研 | 线上沟通 |
| 自定义实验分桶 | 客户/服务商 | RTA产研 | 线上沟通 |
| 变更BidURL | 客户/服务商 | RTA产研 | 线上沟通 |
| 增加非同集团主体白名单 | 最终客户 | RTA产研 | 最终客户授权邮件 |

### 无需申请，仅需确认

| 事项 | 需评估内容 | 备注 |
| ----  | ---- |---- |
| 增减下发站点集 | 需确认客户/服务商系统承载能力 | 线上确认 |
| 增减QPS上限 | 需确认客户/服务商系统承载能力 | 线上确认 |
| 调整缓存时间 | 需确认客户/服务商系统承载能力，上下限内可直接实施 | 线上确认 |
| 首个标准实验层 | --- | 线上确认 |
| 默认接受/拒绝 | --- | 线上确认 |
| 变更token | --- | 线上确认 |
| 关闭RTA | --- | 线上确认 |

### 不予支持

| 事项 | 备注 |
| ---- | ---- |
| 下发媒体特征 | 包括但不限于站点集ID、广告位ID。以及可能导致该结果的其它形式。 |
| 下发用户特征 | 包括但不限于是否已安装、人口标签。以及可能导致该结果的其它形式。 |
| 超过上下限的缓存时间 | 上下限(1小时-24小时) |
| 管理绑略绑定关系 | RTA产研团队不负责为客户绑定策略。请客户/服务商通过管理API操作 |

## 考核

请参阅[考核规则](/docs/rta/rule/assessment.md)