(() => {
  const desks = [
    {
      name: "Grok Bot",
      role: "隊長 · 統籌",
      status: "busy",
      task: "定 v1 範圍同優先；拉齊各職能",
      updated: "2026-10-30 21:39 HKT",
    },
    {
      name: "AI開發人員",
      role: "狀態板網頁",
      status: "busy",
      task: "落地可開 URL 嘅萬聖節狀態板初版",
      updated: "2026-10-30 21:39 HKT",
    },
    {
      name: "設計助手",
      role: "視覺 · 主題皮",
      status: "busy",
      task: "色板／工位卡構圖；萬聖節橙紫皮",
      updated: "2026-10-30 21:39 HKT",
    },
    {
      name: "寫作助手",
      role: "文案 · 狀態語",
      status: "busy",
      task: "開場白同各工位狀態語初稿",
      updated: "2026-10-30 21:39 HKT",
    },
    {
      name: "剪片助手",
      role: "素材 · 剪接",
      status: "idle",
      task: "氣氛素材預覽位 · 待掛片頭／轉場",
      updated: "2026-10-30 21:39 HKT",
    },
  ];

  const grid = document.getElementById("deskGrid");
  const clock = document.getElementById("clock");

  function stamp() {
    const now = new Date();
    clock.textContent = now.toLocaleString("zh-HK", {
      timeZone: "Asia/Hong_Kong",
      hour12: false,
    }) + "（香港時間）";
  }

  function render() {
    grid.innerHTML = desks
      .map(
        (d) => `
<article class="desk">
  <div class="desk-head">
    <div>
      <h2>${esc(d.name)}</h2>
      <p class="role">${esc(d.role)}</p>
    </div>
    <span class="badge ${d.status === "busy" ? "busy" : "idle"}">${
      d.status === "busy" ? "忙緊" : "得閒"
    }</span>
  </div>
  <p class="task">${esc(d.task)}</p>
  <p class="updated">更新：${esc(d.updated)}</p>
</article>`
      )
      .join("");
  }

  function esc(s) {
    return String(s ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  stamp();
  render();
  setInterval(stamp, 30000);
})();
