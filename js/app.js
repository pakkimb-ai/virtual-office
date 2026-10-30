(() => {
  const people = {
    grok: {
      name: "Grok Bot",
      role: "隊長 · 統籌",
      status: "busy",
      task: "定範圍同優先；拉齊各職能",
      updated: "2026-10-30 21:45 HKT",
    },
    ai: {
      name: "AI開發人員",
      role: "網頁 · 地圖落地",
      status: "busy",
      task: "等距卡通萬聖節地圖可試初版",
      updated: "2026-10-30 21:45 HKT",
    },
    design: {
      name: "設計助手",
      role: "視覺 · 主題皮",
      status: "busy",
      task: "卡通色板／工位視覺方向",
      updated: "2026-10-30 21:45 HKT",
    },
    write: {
      name: "寫作助手",
      role: "文案 · 狀態語",
      status: "busy",
      task: "地圖旁短開場白＋工位彈出文案",
      updated: "2026-10-30 21:45 HKT",
    },
    cut: {
      name: "剪片助手",
      role: "素材 · 剪接",
      status: "idle",
      task: "Showreel 試版已出，等反饋；牆上預覽屏待掛素材",
      updated: "2026-10-30 21:45 HKT",
    },
  };

  const dlg = document.getElementById("deskDialog");
  const nameEl = document.getElementById("dlgName");
  const badgeEl = document.getElementById("dlgBadge");
  const roleEl = document.getElementById("dlgRole");
  const taskEl = document.getElementById("dlgTask");
  const updatedEl = document.getElementById("dlgUpdated");

  document.querySelectorAll(".desk").forEach((btn) => {
    btn.addEventListener("click", () => {
      const p = people[btn.dataset.id];
      if (!p) return;
      nameEl.textContent = p.name;
      roleEl.textContent = p.role;
      taskEl.textContent = p.task;
      updatedEl.textContent = "更新：" + p.updated;
      badgeEl.textContent = p.status === "busy" ? "忙緊" : "得閒";
      badgeEl.className = "badge " + (p.status === "busy" ? "busy" : "idle");
      if (typeof dlg.showModal === "function") dlg.showModal();
      else dlg.setAttribute("open", "");
    });
  });
})();
