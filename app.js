const storageKey = "money-life-dashboard-data";
const money = new Intl.NumberFormat("th-TH", {
  style: "currency",
  currency: "THB",
  maximumFractionDigits: 0,
});

const today = new Date();
const currentMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;

const sampleData = {
  transactions: [
    { id: crypto.randomUUID(), type: "income", date: `${currentMonth}-01`, category: "เงินเดือน", note: "รายได้ประจำ", amount: 45000 },
    { id: crypto.randomUUID(), type: "expense", date: `${currentMonth}-02`, category: "บ้าน", note: "ค่าเช่า", amount: 9000 },
    { id: crypto.randomUUID(), type: "expense", date: `${currentMonth}-03`, category: "อาหาร", note: "ของสดเข้าบ้าน", amount: 1350 },
    { id: crypto.randomUUID(), type: "expense", date: `${currentMonth}-05`, category: "เดินทาง", note: "BTS และแท็กซี่", amount: 620 },
    { id: crypto.randomUUID(), type: "expense", date: `${currentMonth}-08`, category: "ลงทุน", note: "DCA กองทุน", amount: 5000 },
    { id: crypto.randomUUID(), type: "income", date: `${currentMonth}-12`, category: "ฟรีแลนซ์", note: "งานเสริม", amount: 8500 },
  ],
  assets: [
    {
      id: crypto.randomUUID(),
      name: "Apple",
      symbol: "aapl.us",
      assetClass: "หุ้นต่างประเทศ",
      priceSource: "stooq",
      units: 10,
      cost: 6200,
      price: 6900,
      updatedAt: "",
    },
    {
      id: crypto.randomUUID(),
      name: "Bitcoin",
      symbol: "bitcoin",
      assetClass: "คริปโต",
      priceSource: "coingecko",
      units: 0.035,
      cost: 2100000,
      price: 2350000,
      updatedAt: "",
    },
    {
      id: crypto.randomUUID(),
      name: "Emergency Cash",
      symbol: "",
      assetClass: "เงินสด",
      priceSource: "manual",
      units: 1,
      cost: 60000,
      price: 60000,
      updatedAt: "",
    },
  ],
};

const roleDefinitions = [
  {
    id: "wealth-guardian",
    name: "Wealth Guardian Agent",
    summary: "ผู้ช่วยเฝ้าดูภาพรวมความมั่งคั่ง กระแสเงินสด และความเสี่ยงหลักของพอร์ต",
    permissions: ["Summarize AUM", "Monitor cash surplus", "Detect concentration", "Flag portfolio health"],
    focus: ["Total wealth", "Monthly surplus", "Portfolio drawdown"],
  },
  {
    id: "dca-strategist",
    name: "DCA Strategist Agent",
    summary: "ช่วยวางแผนซื้อสะสมหลายไม้ ดูต้นทุนเฉลี่ย และเตือนก่อนเพิ่ม position",
    permissions: ["Analyze average cost", "Review buy lots", "Estimate units from budget", "Suggest DCA discipline"],
    focus: ["Average cost", "Buy lot sizing", "Cash deployment"],
  },
  {
    id: "risk-monitor",
    name: "Risk Monitor Agent",
    summary: "ตรวจ concentration risk, unrealized loss และสินทรัพย์ที่มีน้ำหนักสูงเกินไป",
    permissions: ["Scan allocation", "Flag overweight assets", "Monitor unrealized P/L", "Create risk note"],
    focus: ["Concentration risk", "Volatility exposure", "Rebalance trigger"],
  },
  {
    id: "cashflow-planner",
    name: "Cashflow Planner Agent",
    summary: "วิเคราะห์รายรับ รายจ่าย เงินเหลือ และความสามารถในการลงทุนเพิ่มรายเดือน",
    permissions: ["Analyze income", "Analyze expenses", "Calculate surplus", "Flag spending pressure"],
    focus: ["Expense pressure", "Savings capacity", "Liquidity buffer"],
  },
  {
    id: "private-banker",
    name: "Private Banker Agent",
    summary: "สรุปภาพรวมแบบภาษาลูกค้า private banking พร้อม agenda สำหรับ monthly review",
    permissions: ["Prepare client summary", "Create review agenda", "Highlight action items"],
    focus: ["Client briefing", "Action items", "Monthly review"],
  },
];

let data = loadData();
data.assets = mergeDuplicateAssets(data.assets);
saveData();
let activeMonth = currentMonth;

const elements = {
  monthFilter: document.querySelector("#monthFilter"),
  activeRole: document.querySelector("#activeRole"),
  incomeTotal: document.querySelector("#incomeTotal"),
  expenseTotal: document.querySelector("#expenseTotal"),
  cashFlow: document.querySelector("#cashFlow"),
  portfolioTotal: document.querySelector("#portfolioTotal"),
  netWorthTotal: document.querySelector("#netWorthTotal"),
  savingsRate: document.querySelector("#savingsRate"),
  expensePressure: document.querySelector("#expensePressure"),
  expensePressureBar: document.querySelector("#expensePressureBar"),
  monthlyInsight: document.querySelector("#monthlyInsight"),
  portfolioGain: document.querySelector("#portfolioGain"),
  selectedMonthLabel: document.querySelector("#selectedMonthLabel"),
  categoryBreakdown: document.querySelector("#categoryBreakdown"),
  assetBreakdown: document.querySelector("#assetBreakdown"),
  cashChart: document.querySelector("#cashChart"),
  transactionRows: document.querySelector("#transactionRows"),
  assetRows: document.querySelector("#assetRows"),
  transactionForm: document.querySelector("#transactionForm"),
  assetForm: document.querySelector("#assetForm"),
  tradeForm: document.querySelector("#tradeForm"),
  tradeAssetSelect: document.querySelector("#tradeAssetSelect"),
  fetchAssetPrice: document.querySelector("#fetchAssetPrice"),
  fetchTradePrice: document.querySelector("#fetchTradePrice"),
  refreshPrices: document.querySelector("#refreshPrices"),
  priceUpdateStatus: document.querySelector("#priceUpdateStatus"),
  transactionSearch: document.querySelector("#transactionSearch"),
  exportData: document.querySelector("#exportData"),
  importData: document.querySelector("#importData"),
  resetDemo: document.querySelector("#resetDemo"),
  parseLine: document.querySelector("#parseLine"),
  lineMessage: document.querySelector("#lineMessage"),
  roleCards: document.querySelector("#roleCards"),
  roleDetail: document.querySelector("#roleDetail"),
};

elements.monthFilter.value = activeMonth;
elements.activeRole.innerHTML = roleDefinitions.map((role) => `<option value="${role.id}">${role.name}</option>`).join("");
elements.transactionForm.date.valueAsDate = today;

document.querySelectorAll(".nav-tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".nav-tab, .view").forEach((item) => item.classList.remove("active"));
    tab.classList.add("active");
    document.querySelector(`#${tab.dataset.view}`).classList.add("active");
  });
});

elements.monthFilter.addEventListener("change", (event) => {
  activeMonth = event.target.value || currentMonth;
  render();
});

elements.activeRole.addEventListener("change", renderRoles);

elements.roleCards.addEventListener("click", (event) => {
  const card = event.target.closest("[data-role-id]");
  if (!card) return;
  elements.activeRole.value = card.dataset.roleId;
  renderRoles();
});

elements.transactionSearch.addEventListener("input", renderTransactions);

elements.transactionForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  data.transactions.unshift({
    id: crypto.randomUUID(),
    type: form.get("type"),
    date: form.get("date"),
    category: cleanText(form.get("category")),
    note: cleanText(form.get("note")),
    amount: Number(form.get("amount")),
  });
  saveData();
  event.currentTarget.reset();
  elements.transactionForm.date.valueAsDate = today;
  elements.transactionForm.querySelector("[value='income']").checked = true;
  render();
});

elements.assetForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const units = Number(form.get("units"));
  const cost = Number(form.get("cost"));
  const symbol = cleanText(form.get("symbol")).toLowerCase();
  const existingAsset = findAssetBySymbol(symbol);

  if (existingAsset) {
    existingAsset.trades = normalizeTrades(existingAsset);
    existingAsset.trades.push({
      id: crypto.randomUUID(),
      type: "buy",
      date: new Date().toISOString().slice(0, 10),
      units,
      price: cost,
      fee: 0,
    });
    existingAsset.price = Number(form.get("price"));
    existingAsset.updatedAt = new Date().toISOString();
    existingAsset.name = existingAsset.name || cleanText(form.get("name"));
    existingAsset.assetClass = existingAsset.assetClass || form.get("assetClass");
    existingAsset.priceSource = existingAsset.priceSource || form.get("priceSource");
  } else {
    data.assets.unshift({
    id: crypto.randomUUID(),
    name: cleanText(form.get("name")),
    symbol,
    assetClass: form.get("assetClass"),
    priceSource: form.get("priceSource"),
    units,
    cost,
    price: Number(form.get("price")),
    updatedAt: "",
    trades: units
      ? [
          {
            id: crypto.randomUUID(),
            type: "buy",
            date: new Date().toISOString().slice(0, 10),
            units,
            price: cost,
            fee: 0,
          },
        ]
      : [],
    });
  }
  saveData();
  event.currentTarget.reset();
  render();
});

elements.fetchAssetPrice.addEventListener("click", fetchPriceForAssetForm);
getField(elements.assetForm, "investmentAmount").addEventListener("input", () => syncUnitsFromAmount(elements.assetForm));
getField(elements.assetForm, "price").addEventListener("input", () => syncUnitsFromAmount(elements.assetForm));
getField(elements.assetForm, "cost").addEventListener("input", () => syncUnitsFromAmount(elements.assetForm));

getField(elements.tradeForm, "date").valueAsDate = today;

elements.tradeForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const asset = data.assets.find((item) => item.id === form.get("assetId"));
  if (!asset) return;

  const trade = {
    id: crypto.randomUUID(),
    type: form.get("tradeType"),
    date: form.get("date"),
    units: Number(form.get("units")),
    price: Number(form.get("price")),
    fee: Number(form.get("fee") || 0),
  };

  const position = calculatePosition(asset);
  if (trade.type === "sell" && trade.units > position.units) {
    alert("จำนวนขายมากกว่าจำนวนคงเหลือในพอร์ต");
    return;
  }

  asset.trades = normalizeTrades(asset);
  asset.trades.push(trade);
  if (trade.type === "buy") asset.price = trade.price;
  saveData();
  event.currentTarget.reset();
  getField(elements.tradeForm, "date").valueAsDate = today;
  elements.tradeForm.querySelector("[value='buy']").checked = true;
  render();
});

elements.fetchTradePrice.addEventListener("click", fetchPriceForTradeForm);
getField(elements.tradeForm, "tradeAmount").addEventListener("input", () => syncTradeUnitsFromAmount());
getField(elements.tradeForm, "price").addEventListener("input", () => syncTradeUnitsFromAmount());
elements.tradeAssetSelect.addEventListener("change", syncTradeFormFromSelectedAsset);

elements.transactionRows.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-delete-transaction]");
  if (!button) return;
  data.transactions = data.transactions.filter((item) => item.id !== button.dataset.deleteTransaction);
  saveData();
  render();
});

elements.assetRows.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-delete-asset]");
  if (!button) return;
  data.assets = data.assets.filter((item) => item.id !== button.dataset.deleteAsset);
  saveData();
  render();
});

elements.refreshPrices.addEventListener("click", refreshPortfolioPrices);

elements.exportData.addEventListener("click", () => {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `money-life-data-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  URL.revokeObjectURL(url);
});

elements.importData.addEventListener("change", async (event) => {
  const file = event.target.files[0];
  if (!file) return;
  const imported = JSON.parse(await file.text());
  data = {
    transactions: Array.isArray(imported.transactions) ? imported.transactions : [],
    assets: Array.isArray(imported.assets) ? imported.assets : [],
  };
  saveData();
  render();
  event.target.value = "";
});

elements.resetDemo.addEventListener("click", () => {
  data = structuredClone(sampleData);
  saveData();
  render();
});

elements.parseLine.addEventListener("click", () => {
  const parsed = parseLineMessage(elements.lineMessage.value);
  if (!parsed) {
    alert("ยังอ่านรูปแบบนี้ไม่ได้ ลองเช่น: จ่าย อาหาร 120 ข้าวกลางวัน");
    return;
  }
  data.transactions.unshift(parsed);
  saveData();
  elements.lineMessage.value = "";
  render();
  document.querySelector("[data-view='transactions']").click();
});

function loadData() {
  const raw = localStorage.getItem(storageKey);
  if (!raw) return structuredClone(sampleData);
  try {
    const parsed = JSON.parse(raw);
    return {
      transactions: Array.isArray(parsed.transactions) ? parsed.transactions : [],
      assets: Array.isArray(parsed.assets) ? parsed.assets : [],
    };
  } catch {
    return structuredClone(sampleData);
  }
}

function mergeDuplicateAssets(assets) {
  const merged = [];
  assets.forEach((asset) => {
    const symbolKey = normalizeAssetKey(asset);
    const existing = symbolKey ? merged.find((item) => normalizeAssetKey(item) === symbolKey) : null;
    if (!existing) {
      merged.push({
        ...asset,
        symbol: cleanText(asset.symbol).toLowerCase(),
        trades: normalizeTrades(asset),
      });
      return;
    }

    existing.trades = [...normalizeTrades(existing), ...normalizeTrades(asset)];
    if (Number(asset.price)) existing.price = Number(asset.price);
    if (asset.updatedAt && (!existing.updatedAt || asset.updatedAt > existing.updatedAt)) existing.updatedAt = asset.updatedAt;
    existing.name = existing.name || asset.name;
    existing.assetClass = existing.assetClass || asset.assetClass;
    existing.priceSource = existing.priceSource || asset.priceSource;
  });
  return merged;
}

function saveData() {
  localStorage.setItem(storageKey, JSON.stringify(data));
}

function render() {
  const monthTransactions = data.transactions.filter((item) => item.date.startsWith(activeMonth));
  const income = sum(monthTransactions.filter((item) => item.type === "income"), "amount");
  const expense = sum(monthTransactions.filter((item) => item.type === "expense"), "amount");
  const portfolioValue = data.assets.reduce((total, item) => total + calculatePosition(item).marketValue, 0);
  const portfolioCost = data.assets.reduce((total, item) => total + calculatePosition(item).costBasis, 0);

  elements.incomeTotal.textContent = money.format(income);
  elements.expenseTotal.textContent = money.format(expense);
  elements.cashFlow.textContent = money.format(income - expense);
  elements.portfolioTotal.textContent = money.format(portfolioValue);
  elements.netWorthTotal.textContent = money.format(portfolioValue + Math.max(income - expense, 0));
  elements.savingsRate.textContent = money.format(income - expense);
  const pressure = income ? Math.min(100, Math.round((expense / income) * 100)) : 0;
  elements.expensePressure.textContent = `${pressure}%`;
  elements.expensePressureBar.style.width = `${pressure}%`;
  elements.monthlyInsight.textContent = getMonthlyInsight(income, expense, portfolioValue - portfolioCost);
  elements.portfolioGain.textContent = money.format(portfolioValue - portfolioCost);
  elements.portfolioGain.className = portfolioValue - portfolioCost >= 0 ? "positive" : "negative";
  elements.selectedMonthLabel.textContent = formatMonth(activeMonth);

  renderBreakdown(elements.categoryBreakdown, groupExpenses(monthTransactions), expense);
  renderBreakdown(elements.assetBreakdown, groupAssets(data.assets), portfolioValue);
  renderTransactions();
  renderAssets();
  renderTradeAssetOptions();
  renderRoles();
  drawCashChart(monthTransactions);
}

function renderTransactions() {
  const query = elements.transactionSearch.value.trim().toLowerCase();
  const rows = data.transactions
    .filter((item) => !query || [item.date, item.type, item.category, item.note].join(" ").toLowerCase().includes(query))
    .slice(0, 80)
    .map((item) => `
      <tr>
        <td>${escapeHtml(item.date)}</td>
        <td><span class="pill ${item.type}">${item.type === "income" ? "รายรับ" : "รายจ่าย"}</span></td>
        <td>${escapeHtml(item.category)}</td>
        <td>${escapeHtml(item.note || "-")}</td>
        <td class="${item.type === "income" ? "positive" : "negative"}">${money.format(item.amount)}</td>
        <td><button class="delete-button" data-delete-transaction="${item.id}" type="button" aria-label="ลบรายการ">×</button></td>
      </tr>
    `)
    .join("");
  elements.transactionRows.innerHTML = rows || `<tr><td colspan="6">ยังไม่มีรายการ</td></tr>`;
}

function renderAssets() {
  const rows = data.assets
    .map((item) => {
      const position = calculatePosition(item);
      return `
        <tr>
          <td>
            <strong class="asset-name">${escapeHtml(item.name)}</strong>
            ${renderSymbol(item)}
          </td>
          <td>${escapeHtml(item.assetClass)}</td>
          <td>
            <strong>${formatUnits(position.units)}</strong>
            <span class="cell-subtext">Avg ${money.format(position.averageCost)}</span>
          </td>
          <td>
            <strong>${money.format(item.price)}</strong>
            <span class="cell-subtext">${formatUpdatedAt(item.updatedAt)}</span>
          </td>
          <td>${money.format(position.marketValue)}</td>
          <td class="${position.unrealizedGain >= 0 ? "positive" : "negative"}">${money.format(position.unrealizedGain)}</td>
          <td><button class="delete-button" data-delete-asset="${item.id}" type="button" aria-label="ลบสินทรัพย์">×</button></td>
        </tr>
      `;
    })
    .join("");
  elements.assetRows.innerHTML = rows || `<tr><td colspan="7">ยังไม่มีสินทรัพย์</td></tr>`;
}

function renderTradeAssetOptions() {
  const selected = elements.tradeAssetSelect.value;
  elements.tradeAssetSelect.innerHTML = data.assets.length
    ? data.assets
        .map((item) => `<option value="${item.id}">${escapeHtml(item.name)}${item.symbol ? ` (${escapeHtml(item.symbol.toUpperCase())})` : ""}</option>`)
        .join("")
    : `<option value="">ยังไม่มีสินทรัพย์</option>`;
  if (selected && data.assets.some((item) => item.id === selected)) {
    elements.tradeAssetSelect.value = selected;
  }
  syncTradeFormFromSelectedAsset();
}

function renderRoles() {
  const activeId = elements.activeRole.value || roleDefinitions[0].id;
  const activeRole = roleDefinitions.find((role) => role.id === activeId) || roleDefinitions[0];
  const briefing = buildAgentBriefing(activeRole.id);

  elements.roleCards.innerHTML = roleDefinitions
    .map(
      (role) => `
        <article class="role-card ${role.id === activeRole.id ? "active" : ""}" data-role-id="${role.id}">
          <span>${role.name}</span>
          <p>${role.summary}</p>
        </article>
      `
    )
    .join("");

  elements.roleDetail.innerHTML = `
    <span class="status-chip dark">${activeRole.name}</span>
    <p>${activeRole.summary}</p>
    <h3>Agent capabilities</h3>
    <div class="permission-list">
      ${activeRole.permissions.map((item) => `<span>${item}</span>`).join("")}
    </div>
    <h3>Focus areas</h3>
    <ul class="focus-list">
      ${activeRole.focus.map((item) => `<li>${item}</li>`).join("")}
    </ul>
    <h3>Current briefing</h3>
    <div class="agent-briefing">
      ${briefing.map((item) => `<article><strong>${item.title}</strong><span>${item.body}</span></article>`).join("")}
    </div>
  `;
}

function buildAgentBriefing(agentId) {
  const monthTransactions = data.transactions.filter((item) => item.date.startsWith(activeMonth));
  const income = sum(monthTransactions.filter((item) => item.type === "income"), "amount");
  const expense = sum(monthTransactions.filter((item) => item.type === "expense"), "amount");
  const positions = data.assets.map((asset) => ({ asset, position: calculatePosition(asset) }));
  const portfolioValue = positions.reduce((total, item) => total + item.position.marketValue, 0);
  const costBasis = positions.reduce((total, item) => total + item.position.costBasis, 0);
  const topHolding = positions.slice().sort((a, b) => b.position.marketValue - a.position.marketValue)[0];
  const topWeight = portfolioValue && topHolding ? Math.round((topHolding.position.marketValue / portfolioValue) * 100) : 0;
  const gain = portfolioValue - costBasis;
  const surplus = income - expense;
  const pressure = income ? Math.round((expense / income) * 100) : 0;

  const base = [
    { title: "AUM snapshot", body: `มูลค่าพอร์ตปัจจุบัน ${money.format(portfolioValue)} และกำไร/ขาดทุนที่ยังไม่ realized ${money.format(gain)}` },
    { title: "Largest holding", body: topHolding ? `${topHolding.asset.name} มีน้ำหนักประมาณ ${topWeight}% ของพอร์ต` : "ยังไม่มีสินทรัพย์ในพอร์ต" },
  ];

  if (agentId === "dca-strategist") {
    return [
      ...base,
      { title: "DCA view", body: topHolding ? `ต้นทุนเฉลี่ยของ ${topHolding.asset.name} คือ ${money.format(topHolding.position.averageCost)} ต่อหน่วย` : "เพิ่มสินทรัพย์และไม้ซื้อเพื่อให้ agent วิเคราะห์ DCA ได้" },
      { title: "Next action", body: surplus > 0 ? `มี surplus เดือนนี้ ${money.format(surplus)} สามารถใช้ตั้งงบ DCA ได้` : "เดือนนี้ยังไม่มี surplus เหมาะกับการชะลอ DCA และดูรายจ่ายก่อน" },
    ];
  }

  if (agentId === "risk-monitor") {
    return [
      ...base,
      { title: "Concentration", body: topWeight >= 50 ? "สินทรัพย์อันดับหนึ่งมีน้ำหนักสูง ควรตั้ง trigger สำหรับ rebalance" : "น้ำหนักสินทรัพย์อันดับหนึ่งยังไม่สูงเกินเกณฑ์ตัวอย่าง 50%" },
      { title: "Risk flag", body: gain < 0 ? "พอร์ตติดลบ ควรตรวจ asset ที่ลาก performance ลง" : "พอร์ตยังเป็นบวกจากต้นทุนรวม" },
    ];
  }

  if (agentId === "cashflow-planner") {
    return [
      { title: "Cashflow", body: `รายรับ ${money.format(income)} รายจ่าย ${money.format(expense)} เงินเหลือ ${money.format(surplus)}` },
      { title: "Expense pressure", body: income ? `รายจ่ายคิดเป็น ${pressure}% ของรายรับเดือนนี้` : "ยังไม่มีรายรับเดือนนี้ในระบบ" },
      { title: "Investment capacity", body: surplus > 0 ? `สามารถกันบางส่วนของ ${money.format(surplus)} ไปลงทุนหรือสำรองเงินสด` : "ควรลดรายจ่ายหรือเพิ่มรายรับก่อนเพิ่มการลงทุน" },
    ];
  }

  if (agentId === "private-banker") {
    return [
      ...base,
      { title: "Client review agenda", body: "ทบทวนสัดส่วนสินทรัพย์, ต้นทุน DCA, สภาพคล่อง และรายการที่ต้อง rebalance" },
      { title: "Client message", body: surplus > 0 ? "สถานะกระแสเงินสดเดือนนี้ยังรองรับแผนลงทุนต่อได้" : "ควรอธิบายแรงกดดันจากกระแสเงินสดก่อนคุยเรื่องลงทุนเพิ่ม" },
    ];
  }

  return [
    ...base,
    { title: "Cash surplus", body: `เงินเหลือเดือนนี้ ${money.format(surplus)} จากรายรับ ${money.format(income)} และรายจ่าย ${money.format(expense)}` },
    { title: "Agent action", body: topWeight >= 50 ? "แนะนำให้เปิด risk monitor เพื่อตรวจ concentration ของพอร์ต" : "ภาพรวมยังไม่มีสัญญาณ concentration สูงตามเกณฑ์ตัวอย่าง" },
  ];
}

function syncTradeFormFromSelectedAsset() {
  const asset = data.assets.find((item) => item.id === elements.tradeAssetSelect.value);
  if (!asset) return;
  getField(elements.tradeForm, "price").value = roundPrice(Number(asset.price || 0));
  syncTradeUnitsFromAmount();
}

function renderBreakdown(container, rows, total) {
  const sorted = Object.entries(rows).sort((a, b) => b[1] - a[1]);
  container.innerHTML = sorted.length
    ? sorted
        .map(([label, value], index) => {
          const percent = total ? Math.round((value / total) * 100) : 0;
          return `
            <div class="breakdown-item">
              <div class="breakdown-row">
                <span>${escapeHtml(label)}</span>
                <span>${money.format(value)} (${percent}%)</span>
              </div>
              <div class="bar"><span style="width:${percent}%; background:${barColor(index)}"></span></div>
            </div>
          `;
        })
        .join("")
    : `<p class="muted">ยังไม่มีข้อมูลในเดือนนี้</p>`;
}

function drawCashChart(transactions) {
  const canvas = elements.cashChart;
  const context = canvas.getContext("2d");
  const width = canvas.width;
  const height = canvas.height;
  const padding = 42;
  const days = new Date(Number(activeMonth.slice(0, 4)), Number(activeMonth.slice(5, 7)), 0).getDate();
  const daily = Array.from({ length: days }, (_, index) => ({ day: index + 1, income: 0, expense: 0 }));

  transactions.forEach((item) => {
    const day = Number(item.date.slice(8, 10));
    if (!daily[day - 1]) return;
    daily[day - 1][item.type] += item.amount;
  });

  const maxValue = Math.max(1000, ...daily.map((item) => Math.max(item.income, item.expense)));
  context.clearRect(0, 0, width, height);
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, width, height);
  context.strokeStyle = "#d9e0e5";
  context.lineWidth = 1;

  for (let index = 0; index < 4; index += 1) {
    const y = padding + ((height - padding * 2) / 3) * index;
    context.beginPath();
    context.moveTo(padding, y);
    context.lineTo(width - padding, y);
    context.stroke();
  }

  drawLine(context, daily, "income", maxValue, width, height, padding, "#177245");
  drawLine(context, daily, "expense", maxValue, width, height, padding, "#c74435");

  context.fillStyle = "#66727f";
  context.font = "14px Segoe UI";
  context.fillText("รายรับ", padding, 20);
  context.fillText("รายจ่าย", padding + 70, 20);
  context.fillStyle = "#177245";
  context.fillRect(padding + 48, 11, 12, 12);
  context.fillStyle = "#c74435";
  context.fillRect(padding + 125, 11, 12, 12);
}

function drawLine(context, daily, key, maxValue, width, height, padding, color) {
  context.beginPath();
  daily.forEach((item, index) => {
    const x = padding + (index / Math.max(1, daily.length - 1)) * (width - padding * 2);
    const y = height - padding - (item[key] / maxValue) * (height - padding * 2);
    if (index === 0) context.moveTo(x, y);
    else context.lineTo(x, y);
  });
  context.strokeStyle = color;
  context.lineWidth = 3;
  context.stroke();
}

async function refreshPortfolioPrices() {
  const liveAssets = data.assets.filter((item) => item.priceSource && item.priceSource !== "manual" && item.symbol);
  if (!liveAssets.length) {
    elements.priceUpdateStatus.textContent = "ยังไม่มีสินทรัพย์ที่ตั้งค่าแหล่งราคา";
    return;
  }

  elements.refreshPrices.disabled = true;
  elements.refreshPrices.textContent = "Refreshing...";
  elements.priceUpdateStatus.textContent = "กำลังดึงราคาล่าสุด";

  const results = await Promise.allSettled(liveAssets.map((asset) => fetchLatestPrice(asset)));
  let successCount = 0;

  results.forEach((result) => {
    if (result.status !== "fulfilled" || !result.value) return;
    const { id, price } = result.value;
    const asset = data.assets.find((item) => item.id === id);
    if (!asset) return;
    asset.price = price;
    asset.updatedAt = new Date().toISOString();
    successCount += 1;
  });

  saveData();
  render();
  elements.refreshPrices.disabled = false;
  elements.refreshPrices.textContent = "Refresh prices";
  elements.priceUpdateStatus.textContent = successCount
    ? `อัปเดตสำเร็จ ${successCount}/${liveAssets.length} รายการ`
    : "ดึงราคาไม่สำเร็จ ตรวจ symbol หรือ API source";
}

async function fetchPriceForAssetForm() {
  const symbol = cleanText(getField(elements.assetForm, "symbol").value).toLowerCase();
  const priceSource = getField(elements.assetForm, "priceSource").value;
  if (!symbol || priceSource === "manual") {
    alert("ใส่ Symbol และเลือกแหล่งราคาเป็น CoinGecko หรือ Stooq ก่อน");
    return;
  }

  elements.fetchAssetPrice.disabled = true;
  elements.fetchAssetPrice.textContent = "กำลังดึงราคา...";
  try {
    const result = await fetchLatestPrice({
      id: "form",
      symbol,
      priceSource,
    });
    getField(elements.assetForm, "price").value = roundPrice(result.price);
    getField(elements.assetForm, "cost").value = roundPrice(result.price);
    syncUnitsFromAmount(elements.assetForm);
  } catch (error) {
    alert(getPriceErrorMessage(error));
  } finally {
    elements.fetchAssetPrice.disabled = false;
    elements.fetchAssetPrice.textContent = "ดึงราคาล่าสุด";
  }
}

async function fetchPriceForTradeForm() {
  const asset = data.assets.find((item) => item.id === getField(elements.tradeForm, "assetId").value);
  if (!asset || !asset.symbol || asset.priceSource === "manual") {
    alert("สินทรัพย์นี้ยังไม่มี Symbol หรือใช้ราคาแบบ Manual");
    return;
  }

  elements.fetchTradePrice.disabled = true;
  elements.fetchTradePrice.textContent = "กำลังดึงราคา...";
  try {
    const result = await fetchLatestPrice(asset);
    asset.price = result.price;
    asset.updatedAt = new Date().toISOString();
    getField(elements.tradeForm, "price").value = roundPrice(result.price);
    syncTradeUnitsFromAmount();
    saveData();
    render();
  } catch (error) {
    alert(getPriceErrorMessage(error));
  } finally {
    elements.fetchTradePrice.disabled = false;
    elements.fetchTradePrice.textContent = "ดึงราคาล่าสุดของสินทรัพย์นี้";
  }
}

function syncUnitsFromAmount(form) {
  const amount = Number(getField(form, "investmentAmount")?.value || 0);
  const price = Number(getField(form, "price")?.value || getField(form, "cost")?.value || 0);
  if (!amount || !price) return;
  getField(form, "units").value = formatUnitInput(amount / price);
}

function syncTradeUnitsFromAmount() {
  const amount = Number(getField(elements.tradeForm, "tradeAmount").value || 0);
  const price = Number(getField(elements.tradeForm, "price").value || 0);
  if (!amount || !price) return;
  getField(elements.tradeForm, "units").value = formatUnitInput(amount / price);
}

async function fetchLatestPrice(asset) {
  if (asset.priceSource === "coingecko") return fetchCoinGeckoPrice(asset);
  if (asset.priceSource === "stooq") return fetchStooqPrice(asset);
  return null;
}

async function fetchCoinGeckoPrice(asset) {
  const symbol = normalizeCryptoId(asset.symbol);
  const url = `https://api.coingecko.com/api/v3/simple/price?ids=${encodeURIComponent(symbol)}&vs_currencies=thb`;
  const payload = await fetchJsonWithFallback(url);
  const price = Number(payload?.[symbol]?.thb);
  if (!Number.isFinite(price)) throw new Error("CoinGecko price missing");
  return { id: asset.id, price };
}

async function fetchStooqPrice(asset) {
  const symbol = asset.symbol.trim().toLowerCase();
  const url = `https://stooq.com/q/l/?s=${encodeURIComponent(symbol)}&f=sd2t2ohlcv&h&e=csv`;
  const csv = await fetchTextWithFallback(url);
  const lines = csv.trim().split(/\r?\n/);
  const values = lines[1]?.split(",");
  const close = Number(values?.[6]);
  if (!Number.isFinite(close)) throw new Error("Stooq price missing");
  return { id: asset.id, price: close };
}

async function fetchJsonWithFallback(url) {
  const text = await fetchTextWithFallback(url);
  return JSON.parse(text);
}

async function fetchTextWithFallback(url) {
  try {
    return await fetchText(url);
  } catch (error) {
    const proxiedUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
    try {
      return await fetchText(proxiedUrl);
    } catch {
      throw error;
    }
  }
}

async function fetchText(url) {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 10000);
  try {
    const response = await fetch(url, { cache: "no-store", signal: controller.signal });
    if (!response.ok) throw new Error(`Price request failed (${response.status})`);
    return response.text();
  } catch (error) {
    if (error.name === "AbortError") throw new Error("Price request timeout");
    throw error;
  } finally {
    window.clearTimeout(timeout);
  }
}

function getPriceErrorMessage(error) {
  const fileHint = location.protocol === "file:" ? "\n\nตอนนี้เปิดจากไฟล์ file:// ถ้ายังไม่สำเร็จ ให้เปิดผ่าน hosting/localhost จะเสถียรกว่า" : "";
  return `ดึงราคาไม่สำเร็จ: ${error.message || "network/CORS blocked"}\n\nตรวจว่า Symbol และแหล่งราคาถูกต้อง เช่น bitcoin, eth, aapl.us${fileHint}`;
}

function parseLineMessage(text) {
  const parts = text.trim().split(/\s+/);
  if (parts.length < 3) return null;
  const first = parts[0].toLowerCase();
  const type = ["รับ", "รายรับ", "income"].includes(first) ? "income" : ["จ่าย", "รายจ่าย", "expense"].includes(first) ? "expense" : null;
  const amountIndex = parts.findIndex((part) => Number.isFinite(Number(part.replace(/,/g, ""))));
  if (!type || amountIndex < 1) return null;
  const amount = Number(parts[amountIndex].replace(/,/g, ""));
  const category = parts.slice(1, amountIndex).join(" ") || (type === "income" ? "รายรับ" : "ทั่วไป");
  const note = parts.slice(amountIndex + 1).join(" ");
  return {
    id: crypto.randomUUID(),
    type,
    date: new Date().toISOString().slice(0, 10),
    category,
    note,
    amount,
  };
}

function groupExpenses(transactions) {
  return transactions
    .filter((item) => item.type === "expense")
    .reduce((groups, item) => {
      groups[item.category] = (groups[item.category] || 0) + item.amount;
      return groups;
    }, {});
}

function groupAssets(assets) {
  return assets.reduce((groups, item) => {
    groups[item.assetClass] = (groups[item.assetClass] || 0) + calculatePosition(item).marketValue;
    return groups;
  }, {});
}

function normalizeTrades(asset) {
  if (Array.isArray(asset.trades)) return asset.trades;
  if (!Number(asset.units)) return [];
  return [
    {
      id: crypto.randomUUID(),
      type: "buy",
      date: new Date().toISOString().slice(0, 10),
      units: Number(asset.units),
      price: Number(asset.cost),
      fee: 0,
    },
  ];
}

function findAssetBySymbol(symbol) {
  const key = normalizeAssetKey({ symbol });
  if (!key) return null;
  return data.assets.find((asset) => normalizeAssetKey(asset) === key);
}

function normalizeAssetKey(asset) {
  const symbol = cleanText(asset.symbol).toLowerCase();
  if (!symbol) return "";
  if (asset.priceSource === "coingecko" || ["btc", "bitcoin", "eth", "ethereum", "sol", "solana"].includes(symbol)) {
    return `coingecko:${normalizeCryptoId(symbol)}`;
  }
  return `${cleanText(asset.priceSource || "manual").toLowerCase()}:${symbol}`;
}

function calculatePosition(asset) {
  const trades = normalizeTrades(asset)
    .slice()
    .sort((a, b) => String(a.date).localeCompare(String(b.date)));
  let units = 0;
  let costBasis = 0;

  trades.forEach((trade) => {
    const tradeUnits = Number(trade.units || 0);
    const tradeValue = tradeUnits * Number(trade.price || 0);
    const fee = Number(trade.fee || 0);
    if (trade.type === "buy") {
      units += tradeUnits;
      costBasis += tradeValue + fee;
      return;
    }

    if (!units) return;
    const sellUnits = Math.min(tradeUnits, units);
    const averageCost = costBasis / units;
    units -= sellUnits;
    costBasis -= averageCost * sellUnits;
  });

  const marketValue = units * Number(asset.price || 0);
  const averageCost = units ? costBasis / units : 0;
  return {
    units,
    costBasis,
    averageCost,
    marketValue,
    unrealizedGain: marketValue - costBasis,
  };
}

function formatMonth(value) {
  const [year, month] = value.split("-").map(Number);
  return new Intl.DateTimeFormat("th-TH", { month: "long", year: "numeric" }).format(new Date(year, month - 1, 1));
}

function renderSymbol(item) {
  if (!item.symbol) return `<span class="source-badge manual">Manual</span>`;
  return `
    <span class="symbol-cell">${escapeHtml(item.symbol.toUpperCase())}</span>
    <span class="source-badge ${escapeHtml(item.priceSource || "manual")}">${escapeHtml(item.priceSource || "manual")}</span>
  `;
}

function formatUpdatedAt(value) {
  if (!value) return `<span class="muted">manual</span>`;
  return new Intl.DateTimeFormat("th-TH", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatUnits(value) {
  return new Intl.NumberFormat("th-TH", {
    maximumFractionDigits: 6,
  }).format(value);
}

function formatUnitInput(value) {
  return Number(value.toFixed(8)).toString();
}

function roundPrice(value) {
  if (value >= 100) return Number(value.toFixed(2));
  if (value >= 1) return Number(value.toFixed(4));
  return Number(value.toFixed(8));
}

function normalizeCryptoId(symbol) {
  const key = symbol.trim().toLowerCase();
  const aliases = {
    btc: "bitcoin",
    bitcoin: "bitcoin",
    eth: "ethereum",
    ethereum: "ethereum",
    sol: "solana",
    solana: "solana",
    xrp: "ripple",
    bnb: "binancecoin",
    doge: "dogecoin",
    ada: "cardano",
  };
  return aliases[key] || key;
}

function getMonthlyInsight(income, expense, portfolioGain) {
  if (!income && !expense) return "เริ่มบันทึกรายการเพื่อดูสุขภาพการเงินเดือนนี้";
  if (!income) return "เดือนนี้มีรายจ่ายแล้ว แต่ยังไม่มีรายรับที่บันทึกไว้";
  const savingsRate = (income - expense) / income;
  if (savingsRate >= 0.35 && portfolioGain >= 0) return "เดือนนี้กระแสเงินสดแข็งแรง และพอร์ตยังเป็นบวก";
  if (savingsRate >= 0.2) return "เดือนนี้ยังเหลือเงินดี เหมาะกับการวางแผนลงทุนต่อ";
  if (savingsRate >= 0) return "เดือนนี้ยังเป็นบวก แต่รายจ่ายเริ่มกินสัดส่วนสูง";
  return "รายจ่ายเกินรายรับแล้ว ควรดูหมวดที่ใช้เยอะที่สุดก่อน";
}

function sum(rows, key) {
  return rows.reduce((total, item) => total + Number(item[key] || 0), 0);
}

function cleanText(value) {
  return String(value || "").trim();
}

function getField(form, name) {
  return form.querySelector(`[name="${name}"]`);
}

function barColor(index) {
  return ["#0d7c86", "#2662a8", "#b7791f", "#177245", "#6f4aa8", "#c74435"][index % 6];
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

render();

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./service-worker.js").catch(() => {});
  });
}
