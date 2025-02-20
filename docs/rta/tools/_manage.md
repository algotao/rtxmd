---
sidebar_position: 3
draft: true
---
import { useState,useEffect } from 'react';
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';
import {DSPInfoTable, RuleTable, TargetsTable, BindsTable, NewTarget, Login} from "/js/devtool";

# 快捷管理
export function RTAManage(props) {
  const [inputs, setInputs] = useState({});
  const [dspInfo, setDSPInfo] = useState({});
  const [dspTargets, setDSPTargets] = useState([]);
  const [dspBinds, setDSPBinds] = useState([]);
  const [errInfo, setErrInfo] = useState("");
  const [lastUpdate, setLastUpdate ] = useState("");
  useEffect(()=>{
        const setting = localStorage.getItem("rta_auth");
        const jsonSetting = setting ? JSON.parse(setting) : {};
        setInputs(jsonSetting);
        setErrInfo("");
    },[]);
  const handleChange = (e) => {
        const name = e.target.name;
        const value = e.target.value;
        setInputs(values => ({...values, [name]: value}));
  }
  function onLogin(){
    fetch("https://api.algo.com.cn/rtacaller/auth",
      {
        method: 'POST',
        cache: "no-cache",
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({auth: {dspid: inputs.dspid, token: inputs.token}}),
      }
    )
    .then(res => res.json())
    .then(data =>{
      //console.log(data);
      if (data.state.code==0) {
        var dtmNow = new Date();
        setErrInfo("SUCC");
        setLastUpdate(dtmNow.toLocaleDateString() + " " + dtmNow.toLocaleTimeString());
        setDSPInfo(data.info);
        setDSPTargets(data.target.Records);
        setDSPBinds(data.bind.Records);
        localStorage.setItem("rta_auth", JSON.stringify(inputs));
      } else {
        setErrInfo(data.state.text);
      }
    });
  }
  return (
    <div className="container">
      <Login dspid={inputs.dspid} token={inputs.token} onValueChange={handleChange} onLogin={onLogin} />
      { errInfo!="" && errInfo!="SUCC" &&
        <div>
          <br />
          <div className="alert alert--danger" role="alert">
            {errInfo}
          </div>
        </div>
      }
      { errInfo=="SUCC" &&
        <div>
          <div>
            <br />
            <div className="alert alert--success" role="alert">
              拉取信息成功！最后刷新时间{lastUpdate}
            </div>
          </div>
          <Tabs>
            <TabItem value="dspinfo" label="信息" default>
              <DSPInfoTable dspinfo={dspInfo} />
            </TabItem>
            <TabItem value="rules" label="流量规则">
              <RuleTable rules={dspInfo.Rules} />
            </TabItem>
            <TabItem value="targets" label="策略">
              <TargetsTable targets={dspTargets} dspid={inputs.dspid} token={inputs.token}/>
            </TabItem>
          </Tabs>
        </div>
      }
    </div>
  );
}

<RTAManage />