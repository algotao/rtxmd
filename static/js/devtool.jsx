import React, { useState, useEffect } from "react";
import CodeBlock from '@theme/CodeBlock';
import CodeEditor from '@uiw/react-textarea-code-editor';

async function RTAQuery(url, reqbody) {
  const response = await fetch(url,
    {
      method: 'POST',
      mode: 'cors',
      cache: "no-cache",
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(reqbody)
    }
  );
  return response.json();
}

async function RTAAPI(urlpath, areacode, reqbody) {
  var url = getHostURL(areacode) + urlpath;
  return RTAQuery(url, reqbody);
};

const getHostURL = (areacode) => {
  switch (areacode) {
    case 0:
      return "https://sh.algo.com.cn";
    case 1:
      return "https://bj.algo.com.cn";
    case 2:
      return "https://gz.algo.com.cn";
    case 3:
      return "";
    default:
      return "https://sh.algo.com.cn";
  }
};

async function SRTAAPI(urlpath, reqbody) {
  var url = "https://sh.algo.com.cn" + urlpath;
  return RTAQuery(url, reqbody);
};

export const CodeView = ({ language, title, code }) => {
  return (
    <CodeBlock language={language} title={title}>
      {code}
    </CodeBlock>
  );
}

export const InputItem = ({ name, defaultvalue, disabled, onchange, prepend, placeholder, colwidth }) => {
  return (
    <div className={colwidth + " col input-group"}>
      <div className="input-group-prepend">
        <span className="input-group-text">{prepend}</span>
      </div>
      <input type="text" className="form-control" placeholder={placeholder} name={name} defaultValue={defaultvalue} disabled={disabled} onChange={onchange} />
    </div>
  );
}

export const InputItemShort = ({ name, defaultvalue, disabled, onchange, prepend, placeholder, colwidth }) => {
  return (
    <div className={colwidth + " col input-group"}>
      <div className="input-group-prepend input-group-prepend-p">
        <span className="input-group-text">{prepend}</span>
      </div>
      <input type="text" className="form-control" placeholder={placeholder} name={name} defaultValue={defaultvalue} disabled={disabled} onChange={onchange} />
    </div>
  );
}

export const TextArea = ({ name, info, disabled, prepend, placeholder, colwidth, rows, cols, readOnly }) => {
  return (
    <div className={colwidth + " col input-group"}>
      <div className="input-group-prepend">
        <span className="input-group-text">{prepend}</span>
      </div>
      <textarea placeholder={placeholder} name={name} disabled={disabled} rows={rows} cols={cols} readOnly={readOnly} value={info} />
    </div>
  );
}

export default function LuaCodeEditor({name, code, onchange, language}) {
  return (
    <CodeEditor
      value={code}
      name={name}
      language={language}
      placeholder="请输入sRTA LUA代码."
      onChange={onchange}
      padding={15}
      style={{
        backgroundColor: "#f5f5f5",
        fontFamily: 'ui-monospace,SFMono-Regular,SF Mono,Consolas,Liberation Mono,Menlo,monospace',
      }}
    />
  );
}

export function RTATool() {
  const [inputs, setInputs] = useState({});
  const [localDomain, setLocalDomain] = useState(false);
  useEffect(() => {
    const setting = localStorage.getItem("tencent_rta_setting");
    const jsonSetting = setting ? JSON.parse(setting) : { hostArea: 0 };
    setInputs(jsonSetting);

    setLocalDomain(window.location.hostname != "wiki.algo.com.cn");
    //console.log(localDomain);
  }, []);
  const [codeSendBody, setSendBody] = useState("");
  const [codeSendHeader, setSendHeader] = useState("");
  const [codeRecvInfo, setRecvInfo] = useState("");
  const [codeRecvHeader, setRecvHeader] = useState("");
  const [codeRecvBody, setRecvBody] = useState("");
  const [codeRecvCodeClass, setRecvCodeClass] = useState("protobuf");
  const osInfoMap = new Map([[0, "未知"], [1, "iOS"], [2, "Android"]]);
  const didTypeMap = new Map([[0, "IDFA MD5"], [7, "CAID MD5"], [3, "OAID MD5"], [4, "AndroidID MD5"], [1, "IMEI MD5"], [5, "MAC MD5"], [10, "OpenID"]]);
  const hostAreaMap = new Map([[0, "上海"], [1, "北京"], [2, "广州"], [3, "本机"]]);
  const reqModeMap = new Map([[1, "一次"], [2, "二次"]]);
  const httpVerMap = new Map([[1, "优先1.1"], [2, "强制2.0"]]);
  const lcMap = new Map([[1, "正常交互"], [2, "精简交互"]]);
  const handleChange = (event) => {
    const name = event.target.name;
    const value = event.target.value;
    //console.log(name, value);
    setInputs(values => ({ ...values, [name]: value }));
  }
  function makeBody() {
    localStorage.setItem("tencent_rta_setting", JSON.stringify(inputs));
    RTAAPI("/rtacaller/makeCmd", inputs.hostArea, inputs)
      .then(data => {
        setSendHeader(data.header);
        setSendBody(data.body);
      })
      .catch((error) => {
        setSendBody(error.toString());
      });
  }

  function sendCmd() {
    localStorage.setItem("tencent_rta_setting", JSON.stringify(inputs));
    RTAAPI("/rtacaller/sendCmd", inputs.hostArea, {
      bidurl: inputs.bidurl,
      sendbody: codeSendBody,
      headers: codeSendHeader,
      rtacallerurl: inputs.rtacallerurl,
      httpver: inputs.httpver,
      lcmode: inputs.lcmode,
    })
      .then((data) => {
        setRecvInfo(data.state.text);
        setRecvHeader(data.header);
        setRecvBody(data.body);
        setRecvCodeClass(data.codeclass);
      })
      .catch((error) => {
        setRecvInfo(error.toString());
      });
  }
  function selectInteractiveMode(imode) {
    setInputs(values => ({ ...values, ["imode"]: imode }));
    switch (imode) {
      case 1:
        setInputs(values => ({ ...values, ["imodetext"]: "设备号" }));
        selectOSDefaultDIDType(inputs.os);
        break;
      case 2:
        setInputs(values => ({ ...values, ["imodetext"]: "微信openid" }));
        selectCachedDeviceType(10);
        selectDoubtfulType(0, 1);
        break;
    }
    return false;
  }
  function selectOS(os) {
    setInputs(values => ({ ...values, ["os"]: os }));
    if (inputs.imode == 1) {
      selectOSDefaultDIDType(os);
    }
    return false;
  }
  function selectOSDefaultDIDType(os) {
    switch (os) {
      case 2:
        selectCachedDeviceType(3);
        break;
      case 1:
        selectCachedDeviceType(0);
        break;
      case 0:
        selectCachedDeviceType(5);
        break;
    }
    selectDoubtfulType(0, 1);
  }
  function selectReqMode(reqmode) {
    setInputs(values => ({ ...values, ["reqmode"]: reqmode }));
    return false;
  }
  function selectCachedDeviceType(didtype) {
    setInputs(values => ({ ...values, ["didtype"]: didtype }));
    return false;
  }
  function selectDoubtfulType(doubtfultype, calcmode) {
    if (calcmode == 1) {
      setInputs(values => ({ ...values, ["doubtfultype"]: doubtfultype }));
    } else {
      setInputs(values => ({ ...values, ["doubtfultype"]: doubtfultype ^ inputs.doubtfultype }));
    }
    return false;
  }
  function selectHostArea(hostArea) {
    setInputs(values => ({ ...values, ["hostArea"]: hostArea }));
  }
  function selectHttpVer(httpver) {
    setInputs(values => ({ ...values, ["httpver"]: httpver }));
    return false;
  }
  function selectLCMode(lcmode) {
    setInputs(values => ({ ...values, ["lcmode"]: lcmode }));
    return false;
  }
  return (
    <div className="container">
      <form>
        <div className="row">
          <InputItem colwidth="col--12" prepend="BidURL" placeholder="请输入BidURL，必填" name="bidurl" defaultvalue={inputs.bidurl || ""} onchange={handleChange} />
        </div>
        <br />
        <div className="row">
          <div className="col col-12">
            <div className="dropdown dropdown--hoverable">
              <div className="button button--success" >模式 ({inputs.imodetext || ""})</div>
              <ul className="dropdown__menu">
                <li><div className="dropdown__link" onClick={() => selectInteractiveMode(1)} > {inputs.imode == 1 ? "✓" : ""} 设备号</div></li>
                <li><div className="dropdown__link" onClick={() => selectInteractiveMode(2)} > {inputs.imode == 2 ? "✓" : ""} 微信openid</div></li>
              </ul>
            </div>
            <div className="dropdown dropdown--hoverable keepspace">
              <div className="button button--success" >系统 ({osInfoMap.get(inputs.os) || ""})</div>
              <ul className="dropdown__menu">
                <li><div className="dropdown__link" onClick={() => selectOS(2)} > {inputs.os == 2 ? "✓" : ""} {osInfoMap.get(2)}</div></li>
                <li><div className="dropdown__link" onClick={() => selectOS(1)} > {inputs.os == 1 ? "✓" : ""} {osInfoMap.get(1)}</div></li>
                <li><div className="dropdown__link" onClick={() => selectOS(0)} > {inputs.os == 0 ? "✓" : ""} {osInfoMap.get(0)}</div></li>
              </ul>
            </div>
            <div className="dropdown dropdown--hoverable keepspace">
              <div className="button button--success">主设备 ({didTypeMap.get(inputs.didtype) || ""})</div>
              <ul className="dropdown__menu">
                {(inputs.imode == 1) && inputs.os == 1 &&
                  <li><div className="dropdown__link" onClick={() => selectCachedDeviceType(0)}> {inputs.didtype == 0 ? "✓" : ""} {didTypeMap.get(0)}</div></li>
                }
                {(inputs.imode == 1) && inputs.os == 1 &&
                  <li><div className="dropdown__link" onClick={() => selectCachedDeviceType(7)}> {inputs.didtype == 7 ? "✓" : ""} {didTypeMap.get(7)}</div></li>
                }
                {(inputs.imode == 1) && inputs.os == 2 &&
                  <li><div className="dropdown__link" onClick={() => selectCachedDeviceType(3)}> {inputs.didtype == 3 ? "✓" : ""} {didTypeMap.get(3)}</div></li>
                }
                {(inputs.imode == 1) && inputs.os == 2 &&
                  <li><div className="dropdown__link" onClick={() => selectCachedDeviceType(4)}> {inputs.didtype == 4 ? "✓" : ""} {didTypeMap.get(4)}</div></li>
                }
                {(inputs.imode == 1) && inputs.os == 2 &&
                  <li><div className="dropdown__link" onClick={() => selectCachedDeviceType(1)}>{inputs.didtype == 1 ? "✓" : ""} {didTypeMap.get(1)}</div></li>
                }
                {(inputs.imode == 1) &&
                  <li><div className="dropdown__link" onClick={() => selectCachedDeviceType(5)}> {inputs.didtype == 5 ? "✓" : ""} {didTypeMap.get(5)}</div></li>
                }
                {inputs.imode == 2 &&
                  <li><div className="dropdown__link" onClick={() => selectCachedDeviceType(10)}> {inputs.didtype == 10 ? "✓" : ""} {didTypeMap.get(10)}</div></li>
                }
              </ul>
            </div>
            {(inputs.imode == 1) &&
              <div className="dropdown dropdown--hoverable keepspace">
                <div className="button button--success">可疑设备</div>
                <ul className="dropdown__menu">
                  {inputs.os == 1 &&
                    <li><div className="dropdown__link" onClick={() => selectDoubtfulType(1 << 0, 0)}> {(inputs.doubtfultype & (1 << 0)) == (1 << 0) ? "✓" : ""} {didTypeMap.get(0)}</div></li>
                  }
                  {inputs.os == 1 &&
                    <li><div className="dropdown__link" onClick={() => selectDoubtfulType(1 << 7, 0)}> {(inputs.doubtfultype & (1 << 7)) == (1 << 7) ? "✓" : ""} {didTypeMap.get(7)}</div></li>
                  }
                  {inputs.os == 2 &&
                    <li><div className="dropdown__link" onClick={() => selectDoubtfulType(1 << 3, 0)}> {(inputs.doubtfultype & (1 << 3)) == (1 << 3) ? "✓" : ""} {didTypeMap.get(3)}</div></li>
                  }
                  {inputs.os == 2 &&
                    <li><div className="dropdown__link" onClick={() => selectDoubtfulType(1 << 4, 0)}> {(inputs.doubtfultype & (1 << 4)) == (1 << 4) ? "✓" : ""} {didTypeMap.get(4)}</div></li>
                  }
                  {inputs.os == 2 &&
                    <li><div className="dropdown__link" onClick={() => selectDoubtfulType(1 << 1, 0)}> {(inputs.doubtfultype & (1 << 1)) == (1 << 1) ? "✓" : ""} {didTypeMap.get(1)}</div></li>
                  }
                  <li><div className="dropdown__link" onClick={() => selectDoubtfulType(1 << 5, 0)}> {(inputs.doubtfultype & (1 << 5)) == (1 << 5) ? "✓" : ""} {didTypeMap.get(5)}</div></li>
                </ul>
              </div>
            }
            <div className="dropdown dropdown--hoverable keepspace">
              <div className="button button--success" >请求阶段 ({reqModeMap.get(inputs.reqmode) || ""})</div>
              <ul className="dropdown__menu">
                <li><div className="dropdown__link" onClick={() => selectReqMode(1)} > {inputs.reqmode == 1 ? "✓" : ""} {reqModeMap.get(1)}</div></li>
                <li><div className="dropdown__link" onClick={() => selectReqMode(2)} > {inputs.reqmode == 2 ? "✓" : ""} {reqModeMap.get(2)}</div></li>
              </ul>
            </div>
          </div>
        </div>
        <br />
        {(inputs.imode == 1) && inputs.os == 1 &&
          <div className="row">
            <InputItem colwidth="col--4" prepend="IDFA MD5" placeholder="选填1" name="idfamd5" defaultvalue={inputs.idfamd5 || ""} onchange={handleChange} />
            <InputItem colwidth="col--4" prepend="CAID MD5" placeholder="选填。为便于验证，多版本MD5填相同值" name="caidmd5" defaultvalue={inputs.caidmd5 || ""} onchange={handleChange} />
          </div>
        }
        {(inputs.imode == 1) && inputs.os == 2 &&
          <div className="row">
            <InputItem colwidth="col--4" prepend="OAID MD5" placeholder="选填" name="oaidmd5" defaultvalue={inputs.oaidmd5 || ""} onchange={handleChange} />
            <InputItem colwidth="col--4" prepend="IMEI MD5" placeholder="选填" name="imeimd5" defaultvalue={inputs.imeimd5 || ""} onchange={handleChange} />
            <InputItem colwidth="col--4" prepend="A..ID MD5" placeholder="选填" name="androididmd5" defaultvalue={inputs.androididmd5 || ""} onchange={handleChange} />
          </div>
        }
        {inputs.imode == 2 &&
          <div className="row">
            <InputItem colwidth="col--4" prepend="AppID" placeholder="选填" name="wxappid" defaultvalue={inputs.wxappid || ""} onchange={handleChange} />
            <InputItem colwidth="col--4" prepend="OpenID" placeholder="选填" name="wxopenid" defaultvalue={inputs.wxopenid || ""} onchange={handleChange} />
          </div>
        }
        {(inputs.imode == 1) && inputs.os == 0 &&
          <div className="row">
            <InputItem colwidth="col--4" prepend="MAC MD5" placeholder="选填" name="macmd5" defaultvalue={inputs.macmd5 || ""} onchange={handleChange} />
          </div>
        }
        <br />
        <div className="row">
          <InputItem colwidth="col--4" prepend="IP" placeholder="选填" name="ip" defaultvalue={inputs.ip || ""} onchange={handleChange} />
          <InputItem colwidth="col--4" prepend="实验ID" placeholder="选填，多个实验ID用逗号分隔" name="exp" defaultvalue={inputs.exp || ""} onchange={handleChange} />
          <InputItem colwidth="col--4" prepend="自定义头" placeholder='选填，JSON格式{"k1": "v1","k2":"v2"}' name="header" defaultvalue={inputs.header || ""} onchange={handleChange} />
        </div>
        {inputs.reqmode == 2 &&
          <br />
        }
        {inputs.reqmode == 2 &&
          <div className="row">
            <InputItem colwidth="col--4" prepend="广告ID" placeholder="必填" name="adgroupid" defaultvalue={inputs.adgroupid || ""} onchange={handleChange} />
            <InputItem colwidth="col--4" prepend="账户ID" placeholder="必填" name="uid" defaultvalue={inputs.uid || ""} onchange={handleChange} />
            <InputItem colwidth="col--4" prepend="策略ID" placeholder="必填" name="targetid" defaultvalue={inputs.targetid || ""} onchange={handleChange} />
          </div>
        }
        {inputs.reqmode == 2 &&
          <div className="row">
            <InputItem colwidth="col--4" prepend="创意ID" placeholder="选填，逗号分隔(与规格ID顺序对应)" name="creativeid" defaultvalue={inputs.cid || ""} onchange={handleChange} />
            <InputItem colwidth="col--4" prepend="规格ID" placeholder="选填，逗号分隔(与创意ID顺序对应)" name="templateid" defaultvalue={inputs.templateid || ""} onchange={handleChange} />
          </div>
        }
        {inputs.reqmode == 2 &&
          <div className="row">
            <InputItem colwidth="col--4" prepend="商品库ID" placeholder="选填，逗号分隔(与商品ID顺序对应)" name="productlib" defaultvalue={inputs.productlib || ""} onchange={handleChange} />
            <InputItem colwidth="col--4" prepend="商品ID" placeholder="选填，逗号分隔(与商品库ID顺序对应)" name="productid" defaultvalue={inputs.productid || ""} onchange={handleChange} />
          </div>
        }
        {inputs.reqmode == 2 &&
          <div className="row">
            <InputItem colwidth="col--4" prepend="站点集ID" placeholder="已弃用" name="sitesetid" defaultvalue={inputs.sitesetid || ""} onchange={handleChange} />
          </div>
        }
        <br />
        <div className="row">
          <div className="col col-12">
            <button type="button" className="button button--primary" onClick={makeBody}>生成</button>
          </div>
        </div>
        <br />
        <div className="row">
          <div className="col col-12">
            <CodeView title="发送内容" language="protobuf" code={codeSendBody} />
            {codeSendHeader != "" &&
              <CodeView title="自定义Header" language="json" code={codeSendHeader} />
            }
          </div>
        </div>
        <div className="row">
          <div className="col col-12">
            <button type="button" className="button button--primary" onClick={sendCmd}>发送</button>
            <div className="dropdown dropdown--hoverable keepspace">
              <div className="button button--success">发起地区 ({hostAreaMap.get(inputs.hostArea)})</div>
              <ul className="dropdown__menu">
                <li><div className="dropdown__link" onClick={() => selectHostArea(0)}>{inputs.hostArea == 0 ? "✓" : ""} {hostAreaMap.get(0)}</div></li>
                <li><div className="dropdown__link" onClick={() => selectHostArea(1)}>{inputs.hostArea == 1 ? "✓" : ""} {hostAreaMap.get(1)}</div></li>
                <li><div className="dropdown__link" onClick={() => selectHostArea(2)}>{inputs.hostArea == 2 ? "✓" : ""} {hostAreaMap.get(2)}</div></li>
                {localDomain &&
                  <li><div className="dropdown__link" onClick={() => selectHostArea(3)}>{inputs.hostArea == 3 ? "✓" : ""} {hostAreaMap.get(3)}</div></li>
                }
              </ul>
            </div>
            <div className="dropdown dropdown--hoverable keepspace">
              <div className="button button--success">HTTP协议 ({httpVerMap.get(inputs.httpver)})</div>
              <ul className="dropdown__menu">
                <li><div className="dropdown__link" onClick={() => selectHttpVer(1)}>{inputs.httpver == 1 ? "✓" : ""} {httpVerMap.get(1)}</div></li>
                <li><div className="dropdown__link" onClick={() => selectHttpVer(2)}>{inputs.httpver == 2 ? "✓" : ""} {httpVerMap.get(2)}</div></li>
              </ul>
            </div>
            <div className="dropdown dropdown--hoverable keepspace">
              <div className="button button--success">降本 ({lcMap.get(inputs.lcmode)})</div>
              <ul className="dropdown__menu">
                <li><div className="dropdown__link" onClick={() => selectLCMode(1)}>{inputs.lcmode == 1 ? "✓" : ""} {lcMap.get(1)}</div></li>
                <li><div className="dropdown__link" onClick={() => selectLCMode(2)}>{inputs.lcmode == 2 ? "✓" : ""} {lcMap.get(2)}</div></li>
              </ul>
            </div>
          </div>
        </div>
        <br />
        <div className="row">
          <div className="col col-12">
            <CodeView title="返回状态" language="http" code={codeRecvInfo} />
            <CodeView title="返回HTTP Header" language="http" code={codeRecvHeader} />
            <CodeView title="返回Body内容" language={codeRecvCodeClass} code={codeRecvBody} />
          </div>
        </div>
      </form>
      <br />
    </div>
  );
}

export function SRTATool() {
  const [inputs, setInputs] = useState({});
  const [codeRecvError, setRecvError] = useState("");
  const [codeRecvPrint, setRecvPrint] = useState("");
  const [codeRecvTargets, setRecvTargets] = useState("");
  const [codeRecvDataSpace, setRecvDataSpace] = useState("");
  const envMap = new Map([[0, "Demo"], [1, "正式沙箱"]]);
  useEffect(() => {
    const setting = localStorage.getItem("tencent_srta_setting");
    const jsonSetting = setting ? JSON.parse(setting) : { env: 0 };
    console.log(jsonSetting)
    setInputs(jsonSetting);
  }, []);
  const handleChange = (event) => {
    const name = event.target.name;
    const value = event.target.value;
    
    console.log(name, value);
    setInputs(values => ({ ...values, [name]: value }));
  }
  function selectEnv(env) {
    setInputs(values => ({ ...values, ["env"]: env }));
  }
  function sendDebug() {
    localStorage.setItem("tencent_srta_setting", JSON.stringify(inputs));
    
    SRTAAPI("/srtacaller/sendDebug",  { 
      env: inputs.env, 
      lua: inputs.luacode, 
      account: inputs.account, 
      token: inputs.token,
      did: inputs.did,
    })
      .then((data) => {
        setRecvError(data.state.text+"\n"+data.Error);
        setRecvPrint(data.Print);
        setRecvTargets(data.Targets);
        setRecvDataSpace(data.DataSpace);
      })
      .catch((error) => {
        //console.error('Error:', error);
      });
  }
  return (
    <div className="container">
      <form>
          <div className="row">
            <InputItem colwidth="col--6" prepend="Account" placeholder="账号" name="account" defaultvalue={inputs.account || ""} onchange={handleChange} />
            <InputItem colwidth="col--6" prepend="Token" placeholder="Token" name="token" defaultvalue={inputs.token || ""} onchange={handleChange} />
          </div>
        <br />
        <div className="row">
          <div className="col col-12">
            <LuaCodeEditor name="luacode" language="lua" code={inputs.luacode || ""} onchange={handleChange} />
          </div>
        </div>
        <br />
        <div className="row">
          <InputItem colwidth="col--4" prepend="设备号MD5" placeholder="必填" name="did" defaultvalue={inputs.did || ""} onchange={handleChange} />
        </div>
        <br />
        <div className="row">
          <div className="col col-12">
            <button type="button" className="button button--primary" onClick={sendDebug}>发送</button>
            <div className="dropdown dropdown--hoverable keepspace">
              <div className="button button--success">环境 ({envMap.get(inputs.env)})</div>
              <ul className="dropdown__menu">
                <li><div className="dropdown__link" onClick={() => selectEnv(0)}>{inputs.env == 0 ? "✓" : ""} {envMap.get(0)}</div></li>
                <li><div className="dropdown__link" onClick={() => selectEnv(1)}>{inputs.env == 1 ? "✓" : ""} {envMap.get(1)}</div></li>
              </ul>
            </div>
          </div>
        </div>
        <br />
        <div className="row">
          <div className="col col-12">
            <CodeView title="返回错误"  code={codeRecvError} />
            <CodeView title="返回打印输出" code={codeRecvPrint} />
            <CodeView title="返回策略" language="json" code={codeRecvTargets} />
            <CodeView title="返回数据区" language="json" code={codeRecvDataSpace} />
          </div>
        </div>
      </form>
      <br />
    </div>
  );
}

export function PingTool() {
  const [dest, setDest] = useState("")
  const [ipVersion, setIPVersion] = useState(0);
  const [disableButton, setDisableButton] = useState(false);
  const [retBJ, setBJ] = useState("");
  const [retSH, setSH] = useState("");
  const [retGZ, setGZ] = useState("");
  const ipVersionMap = new Map([[0, "自动"], [4, "IPv4"], [6, "IPv6"]]);
  async function doPing(pingMode) {
    setDisableButton(true);
    setBJ("处理中...");
    setSH("处理中...");
    setGZ("处理中...");
    const pingReq = { target: dest, ping_mode: pingMode, ip_version: ipVersion,};
    //上海
    RTAAPI("/rtacaller/ping", 0, pingReq)
      .then((data) => {
        if (data.state.code == 0)
          setSH(data.info);
        else
          setSH(data.state.text);
      })
      .catch((error) => {
        //console.log(error);
        setSH(error);
      });
    //北京
    RTAAPI("/rtacaller/ping", 1, pingReq)
      .then((data) => {
        if (data.state.code == 0)
          setBJ(data.info);
        else
          setBJ(data.state.text);
      })
      .catch((error) => {
        setBJ(error);
      });
    //广州
    RTAAPI("/rtacaller/ping", 2, pingReq)
      .then((data) => {
        if (data.state.code == 0)
          setGZ(data.info);
        else
          setGZ(data.state.text);
      })
      .catch((error) => {
        setGZ(error);
      });
    if (pingMode == 2) {
      setTimeout(() => { setDisableButton(false); }, 10000);
    } else {
      setTimeout(() => { setDisableButton(false); }, 5000);
    }
  }
  function handleKeyUp(e) {
    if (e.keyCode == 13) {
      doPing();
    }
  }
  const handleChange = (event) => {
    setDest(event.target.value);
  }
  return (
    <div className="container">
      <div className="row">
        <div className='col col--12 input-group'>
          <input type="text" className="form-control" placeholder='请输入目标域名或IP' disabled={disableButton} onKeyUp={handleKeyUp} onChange={handleChange} />
          <button type='button' className='button button--primary' disabled={disableButton} onClick={() => doPing(1)}>PING</button>&nbsp;
          <button type='button' className='button button--primary' disabled={disableButton} onClick={() => doPing(2)}>MTR</button>&nbsp;
          <button type='button' className='button button--primary' disabled={disableButton} onClick={() => doPing(3)}>DIG</button>
          <div className="dropdown dropdown--hoverable keepspace">
              <div className="button button--success">IPv ({ipVersionMap.get(ipVersion)})</div>
              <ul className="dropdown__menu">
                <li><div className="dropdown__link" onClick={() => setIPVersion(0)}>{ipVersion == 0 ? "✓" : ""} {ipVersionMap.get(0)}</div></li>
                <li><div className="dropdown__link" onClick={() => setIPVersion(4)}>{ipVersion == 4 ? "✓" : ""} {ipVersionMap.get(4)}</div></li>
                <li><div className="dropdown__link" onClick={() => setIPVersion(6)}>{ipVersion == 6 ? "✓" : ""} {ipVersionMap.get(6)}</div></li>
              </ul>
            </div>
        </div>
      </div>
      <br />
      <div className="row">
        <div className="col col-12">
          <CodeView languag="sh" title="北京返回结果" code={retBJ} />
        </div>
      </div>
      <div className="row">
        <div className="col col-12">
          <CodeView languag="sh" title="上海返回结果" code={retSH} />
        </div>
      </div>
      <div className="row">
        <div className="col col-12">
          <CodeView languag="sh" title="广州返回结果" code={retGZ} />
        </div>
      </div>
    </div>
  );
}


export function DecodeTool() {
  const [encoded, setEncoded] = useState("")
  const [decoded, setDecoded] = useState("")
  const handleEncodeChange = (event) => {
    setEncoded(event.target.value);
  }
  function sendDecode() {
    const decodeReq = { encoded: encoded };
    RTAAPI("/rtacaller/decode", 0, decodeReq)
      .then(data => {
        setDecoded(data.state.text + data.info);
      })
      .catch((error) => {
        setDecoded(error.toString());
      });
  }
  return (
    <div className="container">
      <form>
        <div className="row">
          <InputItem colwidth="col--6" prepend="待解码" placeholder="请输入信息" name="encoded" onchange={handleEncodeChange} />
        </div>
        <br />
        <div className="row">
          <div className="col col-12">
            <button type="button" className="button button--primary" onClick={sendDecode}>解码</button>
          </div>
        </div>
        <br />
        <div className="row">
          <TextArea colwidth="col--12" rows="12" cols="50" prepend="解码后" name="decoded" readOnly={true} info={decoded} />
        </div>
      </form>
      <br />
    </div>
  );
}