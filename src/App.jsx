import { useState, useEffect } from "react";

const CATEGORIES = [
  { id: "small-business", label: "中小企业", icon: "🏪" },
  { id: "tech", label: "科技型企业", icon: "💻" },
  { id: "manufacturing", label: "制造业", icon: "🏭" },
  { id: "agriculture", label: "农业/农产品", icon: "🌾" },
  { id: "service", label: "服务业", icon: "🛎️" },
  { id: "education", label: "教育/培训", icon: "📚" },
  { id: "healthcare", label: "医疗/健康", icon: "🏥" },
  { id: "culture", label: "文化/文创", icon: "🎨" },
  { id: "environment", label: "环保/新能源", icon: "🌱" },
  { id: "startup", label: "初创/创业公司", icon: "🚀" },
];

const FUNDING_TYPES = [
  { id: "grant", label: "政府补贴/补助" },
  { id: "tax", label: "税收优惠" },
  { id: "loan", label: "低息贷款" },
  { id: "contract", label: "政府采购合同" },
];

const LEVELS = [
  { id: "national", label: "国家级" },
  { id: "provincial", label: "省级" },
  { id: "city", label: "市级" },
  { id: "private", label: "基金会/社会资本" },
];

const CHINA_PROVINCES = ["北京", "上海", "广东", "浙江", "江苏", "四川", "福建", "山东", "湖北", "湖南", "河南", "河北", "陕西", "重庆", "天津", "辽宁", "吉林", "黑龙江", "安徽", "江西", "广西", "云南", "贵州", "山西", "甘肃", "海南", "内蒙古", "新疆", "西藏", "宁夏", "青海", "深圳", "杭州", "广州", "成都", "南京", "武汉", "西安", "苏州", "重庆"];

export default function GrantFinder() {
  const [step, setStep] = useState("intake");
  const [category, setCategory] = useState("");
  const [fundingTypes, setFundingTypes] = useState(["grant"]);
  const [levels, setLevels] = useState(["national", "provincial"]);
  const [province, setProvince] = useState("北京");
  const [orgDesc, setOrgDesc] = useState("");
  const [budget, setBudget] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(() => {
    try { return JSON.parse(localStorage.getItem("policy-saved") || "[]"); } catch { return []; }
  });
  const [showSaved, setShowSaved] = useState(false);
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => { localStorage.setItem("policy-saved", JSON.stringify(saved)); }, [saved]);

  const toggle = (arr, setArr, val) => setArr(p => p.includes(val) ? p.filter(v => v !== val) : [...p, val]);
  const saveGrant = (g) => setSaved(p => p.find(x => x.name === g.name) ? p.filter(x => x.name !== g.name) : [...p, { ...g, savedAt: new Date().toISOString() }]);
  const isSaved = (g) => saved.some(x => x.name === g.name);

  async function search() {
    if (!category || !orgDesc.trim()) { setError("请选择企业类型并描述你的企业情况"); return; }
    setError(""); setLoading(true); setStep("results");
    const catLabel = CATEGORIES.find(c => c.id === category)?.label || category;
    const ftLabels = fundingTypes.map(f => FUNDING_TYPES.find(t => t.id === f)?.label).join(", ");
    const lvLabels = levels.map(l => LEVELS.find(v => v.id === l)?.label).join(", ");

    const prompt = "你是中国中小企业政策研究专家。请找出 6-10 个真实、当前有效的政府政策/补贴项目，匹配以下企业情况：\n" +
      "企业类型：" + catLabel + "\n" +
      "政策类型：" + ftLabels + "\n" +
      "政策级别：" + lvLabels + "\n" +
      "所在地区：" + province + "\n" +
      "企业描述：" + orgDesc + "\n" +
      (budget ? "预算规模：" + budget + "\n" : "") +
      "\n请用 JSON 数组格式返回结果。每个对象包含以下字段：" +
      "{name: 政策名称, agency: 发布机构, type: 政策类型, level: 政策级别, amount_min: 最低补贴金额(元), amount_max: 最高补贴金额(元), deadline: 申请截止日期, eligibility: 申请条件, description: 政策描述, url: 官方链接, match_score: 匹配度(0-100), tips: 申请建议}" +
      "\n只返回真实有效的政策，不要编造。";

    try {
      const resp = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 4000, messages: [{ role: "user", content: prompt }] }),
      });
      if (!resp.ok) throw new Error("API 错误: " + resp.status);
      const data = await resp.json();
      const text = data.content?.map(b => b.text || "").join("") || "";
      const clean = text.replace(/```json|```/g, "").trim();
      setResults(JSON.parse(clean));
    } catch (e) {
      setError("搜索失败: " + e.message);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  const bg = "#07070d", card = "#0e0e18", border = "#1a1a30", accent = "#a78bfa", muted = "#55556a";
  const chip = (active) => ({ padding: "7px 14px", borderRadius: 8, fontSize: 12, cursor: "pointer", border: "1px solid " + (active ? accent : border), background: active ? accent + "15" : "transparent", color: active ? accent : "#999" });
  const inp = { padding: "10px 14px", borderRadius: 10, border: "1px solid " + border, background: card, color: "#eeeef2", fontSize: 13, outline: "none", width: "100%" };

  return (
    <div style={{ minHeight: "100vh", background: bg, color: "#eeeef2", fontFamily: "system-ui, sans-serif" }}>
      <style>{String.raw`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <header style={{ padding: "16px 28px", borderBottom: "1px solid " + border, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 9, background: "linear-gradient(135deg," + accent + ",#6366f1)", display: "grid", placeItems: "center", fontSize: 15 }}>🔍</div>
          <div><h1 style={{ fontSize: 17, fontWeight: 700, margin: 0 }}>中小企业政策助手</h1><span style={{ fontSize: 11, color: muted }}>AI 智能匹配政府补贴与扶持政策</span></div>
        </div>
        <button onClick={() => setShowSaved(!showSaved)} style={{ padding: "6px 14px", borderRadius: 8, border: "1px solid " + border, background: "transparent", color: "#aaa", fontSize: 12, cursor: "pointer" }}>我的收藏 ({saved.length})</button>
      </header>
      <div style={{ maxWidth: 800, margin: "0 auto", padding: "28px 20px" }}>
        {step === "intake" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <div style={{ textAlign: "center" }}><h2 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 6px" }}>找到适合你的政策补贴</h2><p style={{ color: muted, fontSize: 14 }}>描述你的企业情况，AI 帮你匹配可申请的政府补贴、税收优惠和扶持政策。</p></div>
            <div><label style={{ fontSize: 12, fontWeight: 600, color: "#aaa", marginBottom: 8, display: "block" }}>企业类型</label><div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>{CATEGORIES.map(c => <button key={c.id} onClick={() => setCategory(c.id)} style={chip(category === c.id)}>{c.icon} {c.label}</button>)}</div></div>
            <div><label style={{ fontSize: 12, fontWeight: 600, color: "#aaa", marginBottom: 8, display: "block" }}>政策类型</label><div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>{FUNDING_TYPES.map(f => <button key={f.id} onClick={() => toggle(fundingTypes, setFundingTypes, f.id)} style={chip(fundingTypes.includes(f.id))}>{f.label}</button>)}</div></div>
            <div><label style={{ fontSize: 12, fontWeight: 600, color: "#aaa", marginBottom: 8, display: "block" }}>政策级别</label><div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>{LEVELS.map(l => <button key={l.id} onClick={() => toggle(levels, setLevels, l.id)} style={chip(levels.includes(l.id))}>{l.label}</button>)}</div></div>
            <div><label style={{ fontSize: 12, fontWeight: 600, color: "#aaa", marginBottom: 8, display: "block" }}>所在地区</label><select value={province} onChange={e => setProvince(e.target.value)} style={{ ...inp, width: 160 }}>{CHINA_PROVINCES.map(s => <option key={s} value={s}>{s}</option>)}</select></div>
            <div><label style={{ fontSize: 12, fontWeight: 600, color: "#aaa", marginBottom: 8, display: "block" }}>描述你的企业情况</label><textarea value={orgDesc} onChange={e => setOrgDesc(e.target.value)} rows={4} placeholder="例如：我是一家 10 人左右的科技公司，做软件开发，有专利，想申请高新技术企业补贴..." style={{ ...inp, resize: "vertical" }} /></div>
            <div><label style={{ fontSize: 12, fontWeight: 600, color: "#aaa", marginBottom: 8, display: "block" }}>预计补贴金额（可选）</label><input value={budget} onChange={e => setBudget(e.target.value)} placeholder="例如：10万-50万" style={inp} /></div>
            {error && <div style={{ color: "#f87171", fontSize: 13, padding: "8px 14px", background: "#1a0a0a", borderRadius: 10 }}>{error}</div>}
            <button onClick={search} style={{ padding: "14px 0", borderRadius: 12, border: "none", background: "linear-gradient(135deg," + accent + ",#6366f1)", color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer" }}>开始搜索政策</button>
          </div>
        )}
        {step === "results" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>{loading ? "搜索中..." : results.length + " 个匹配政策"}</h2>
              <button onClick={() => { setStep("intake"); setResults([]); }} style={{ padding: "6px 16px", borderRadius: 8, border: "1px solid " + border, background: "transparent", color: "#aaa", fontSize: 12, cursor: "pointer" }}>重新搜索</button>
            </div>
            {loading && <div style={{ textAlign: "center", padding: "60px 0" }}><div style={{ width: 18, height: 18, border: "2px solid #333", borderTop: "2px solid " + accent, borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto" }} /><p style={{ color: muted, fontSize: 13, marginTop: 14 }}>正在匹配相关政策...</p></div>}
            {results.map((g, i) => (
              <div key={i} onClick={() => setExpandedId(expandedId === i ? null : i)} style={{ background: card, borderRadius: 12, border: "1px solid " + border, marginBottom: 10, cursor: "pointer", padding: "16px 18px" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <div><div style={{ fontSize: 14, fontWeight: 600 }}>{g.name}</div><div style={{ fontSize: 12, color: muted }}>{g.agency}</div></div>
                  <button onClick={e => { e.stopPropagation(); saveGrant(g); }} style={{ background: "none", border: "none", fontSize: 16, cursor: "pointer", color: isSaved(g) ? "#fbbf24" : "#444" }}>{isSaved(g) ? "★" : "☆"}</button>
                </div>
                <div style={{ display: "flex", gap: 6, marginTop: 6, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 5, background: "#6366f118", color: "#818cf8" }}>{g.type}</span>
                  <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 5, background: "#22c55e10", color: "#4ade80" }}>¥{(g.amount_min||0).toLocaleString()} - ¥{(g.amount_max||0).toLocaleString()}</span>
                  <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 5, background: "#f5920018", color: "#fbbf24" }}>{g.deadline}</span>
                  <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 5, background: g.match_score >= 80 ? "#22c55e18" : "#eab30818", color: g.match_score >= 80 ? "#22c55e" : "#eab308" }}>{g.match_score}% 匹配</span>
                </div>
                {expandedId === i && <div style={{ marginTop: 12, borderTop: "1px solid " + border, paddingTop: 12 }}><p style={{ fontSize: 13, color: "#ccc", lineHeight: 1.5 }}>{g.description}</p><div style={{ fontSize: 12, color: "#aaa", marginTop: 6 }}><strong>申请条件：</strong> {g.eligibility}</div><div style={{ fontSize: 12, color: accent, marginTop: 8, padding: "8px 12px", background: accent + "08", borderRadius: 8 }}>💡 申请建议：{g.tips}</div>{g.url && <a href={g.url} target="_blank" rel="noopener" style={{ display: "inline-block", marginTop: 10, padding: "8px 20px", borderRadius: 8, background: accent, color: "#fff", fontSize: 12, fontWeight: 600, textDecoration: "none" }}>查看官方政策</a>}</div>}
              </div>
            ))}
          </div>
        )}
      </div>
      <footer style={{ padding: "14px 24px", borderTop: "1px solid " + border, textAlign: "center", marginTop: 40 }}><span style={{ fontSize: 10, color: "#333" }}>中小企业政策助手 | AI 智能匹配政府补贴</span></footer>
    </div>
  );
}