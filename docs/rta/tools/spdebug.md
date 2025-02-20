---
sidebar_position: 4
draft: false
---

import {SPTool} from "/js/devtool.jsx";

# SP联调工具

<SPTool />

## 内网调试

如果在开发服务时暂时不能提供公网可访问的URL，请尝试`内网调试模式`。内网调试模式需要开发人员会使用Docker环境，通过在开发机运行RTA联调工具服务Docker程序以实现内网联调。

:::tip

该模式需要保证 **1.** `Docker运行机器` 能同时访问外网与内网。 **2.** 浏览器能访问 `Docker运行机器` ，两者也可以是同一台机器。 

对于存在办公网与开发网隔离情况的环境，请注意网络关联关系。

:::

安装Docker的方法与过程在此不再赘述，请参考 https://dockerdocs.cn/

### 步骤1：启动调试容器
```sh title="在容器宿主机的命令行运行"
docker run -p "8080:8080" rta-docker.pkg.coding.net/public/docker/rtacaller:latest

#运行后在屏幕显示类似内容即表示运行正常
2023/07/27 05:36:21 RTA Caller is listening on :8080

#在Mac Silicon芯片的系统上运行可能会多一行平台不匹配警告信息，并不影响使用（Apple Rosseta会自动转译）
```

### 步骤2：浏览器访问
用浏览器打开运行容器机器的IP及端口地址，如 `http://192.168.0.100:8080`。

### 步骤3：选择发起地区
打开 `RTA` --> `工具库` --> `SP联调工具`，鼠标移至模拟调试的`发起地区`按钮，从下拉菜单中选择`内网`。

### 步骤4：使用
如各环节均设置正确则`生成` `发送`等功能均可正常工作，如发生异常则会在内容/状态区域打印错误信息，请根据情况处理。