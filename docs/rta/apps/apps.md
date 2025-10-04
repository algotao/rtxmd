---
sidebar_position: 1
description: 全面解析程序化广告模式，助力精准营销决策！本文深入对比了RTA、RTB、PDB等主流程序化广告模式的操作难易度、责任分配、参与环节及适用场景，提供模式选择指南，指导广告主根据自身能力与目标，高效选择最适合的广告投放模式，优化营销效果。
keywords: [程序化广告模式, RTA, RTB, PDB, 模式对比, 模式选择, 广告投放, 精准营销, 营销效果优化]
---

# 模式一览

## 模式对比

<table>
    <tr align="center">
        <td rowspan="2">产品</td>
        <td rowspan="2">模式</td>
        <td rowspan="2">难易</td>
        <td colspan="6">负责方</td>
    </tr>
    <tr align="center">
        <td>召回</td>
        <td>粗排</td>
        <td>pCTR</td>
        <td>pCVR</td>
        <td>出价</td>
        <td>加权</td>
    </tr>
    <tr align="center">
        <td rowspan="4"> RTA<br /><br />媒体粗选，客户过滤</td>
        <td>人群圈选</td>
        <td rowspan="6">易<br /><br /> | <br /> | <br /> ↓ <br /><br /> 难</td>
        <td rowspan="4">媒体(主)<br /> 客户(辅)</td>
        <td rowspan="4">媒体</td>
        <td>媒体</td>
        <td>媒体</td>
        <td>固定</td>
        <td>无</td>
    </tr>
    <tr align="center">
        <td>用户调权</td>
        <td>媒体</td>
        <td>媒体</td>
        <td>固定</td>
        <td>客户</td>
    </tr>
    <tr align="center">
        <td>CPA出价</td>
        <td>媒体</td>
        <td>媒体</td>
        <td>客户</td>
        <td>无</td>
    </tr>
    <tr align="center">
        <td>CPC出价</td>
        <td>媒体</td>
        <td>客户</td>
        <td>客户</td>
        <td>无</td>
    </tr>
    <tr align="center">
        <td rowspan="2">RTB<br /><br />客户粗选，媒体过滤</td>
        <td>CPC出价</td>
        <td rowspan="2">客户(主)<br /> 媒体(辅)</td>
        <td rowspan="2">客户</td>
        <td>媒体</td>
        <td>客户</td>
        <td>客户</td>
        <td>无</td>
    </tr>
    <tr align="center">
        <td>CPM出价</td>
        <td>客户</td>
        <td>客户</td>
        <td>客户</td>
        <td>无</td>
    </tr>
    <tr align="center">
        <td>合约PDB</td>
        <td>人群圈选</td>
        <td>--</td>
        <td>媒体(主)<br /> 客户(辅)</td>
        <td>--</td>
        <td>--</td>
        <td>--</td>
        <td>--</td>
        <td>--</td>
    </tr>
    <tr align="center">
        <td>合约PD</td>
        <td>人群圈选</td>
        <td>--</td>
        <td>客户(主)<br /> 媒体(辅)</td>
        <td>--</td>
        <td>--</td>
        <td>--</td>
        <td>--</td>
        <td>--</td>
    </tr>
</table>

## 模式选择

选择何种参与模式需根据客户现有能力而定。

- **RTA-人群圈选**：客户拥有强于媒体侧的0/1类用户数据，例如已安装/未安装，黑名单。用于拉新、拉活、排黑等场景。所有接入RTA的客户均需实现该项能力。
- **RTA-用户调权**：客户拥有目标人群的简单价值分类，例如按照价值分为高、中、低三档。用于调节不同等级人群的广告竞争力，优化获客人群构成分布。
- **RTA-CPA出价**：客户拥有人群的转化后价值判断能力，但不能预估pCVR。例如游戏用户大R，或金融大R。用于追求ROI或全局收益最大化的投放等场景。
- **RTA-CPC出价**：客户拥有人群的转化后价值与pCVR预估能力。例如平台电商拥有全面的站内行为数据，能预估CPA*pCVR，由更能理解流量点击率的媒体的预估pCTR。<br /><br />
- **RTB-CPC出价**：与RTA-CPC出价类似，区别是RTB-CPC在客户不能计算出价时，无法象RTA-CPC那样将决策权转交给媒体。
- **RTB-CPM出价**：两率(pCTR pCVR)全部由客户预估，并结合转化目标出价转换成eCPM，最终参与到竞价。<br /><br />
- **合约PDB**：投放端提前选量、预定，固定CPM价格。播放期客户仅有少量挑选余地。用于保价保量及素材实时推荐场景。
- **合约PD**：投放端提前选量，固定CPM价格。播放期竞争优先级与效果广告等同，客户不承诺拿量，媒体不承诺供量。用于保价不保量的场景。