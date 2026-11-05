(() => {
  "use strict";

  const CATEGORY_COLORS = {
    verb_recast: "#d95d39",
    nominal_retained: "#2f6b57",
    light_verb: "#6b6597",
  };
  const CATEGORY_LABELS = {
    en: { verb_recast: "Verb recast", nominal_retained: "Nominal retained", light_verb: "Light verb frame" },
    zh: { verb_recast: "動詞化", nominal_retained: "保留名詞", light_verb: "輕動詞框架" },
  };
  const PAGE_SIZE = 20;
  const state = {
    entries: [],
    filtered: [],
    search: "",
    category: "all",
    checked: "all",
    term: "",
    sort: "id",
    direction: "asc",
    page: 1,
    topTerms: 18,
    minLink: 1,
    kwicTerm: "",
    lang: "en",
  };

  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => [...document.querySelectorAll(selector)];
  const esc = (value) => String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));
  const categoryLabel = (key) => CATEGORY_LABELS[state.lang][key] || key;

  const translations = {
    en: {},
    zh: {
      navExplorer: "探索", navReport: "學習報告", navCodebook: "分類準則", navDeclaration: "AI 使用聲明",
      eyebrow: "500 對字幕語料", heroTitle: "當名詞變成動詞。", heroLede: "探索英文字幕中的名詞化如何在簡體中文裡轉化，以及這些轉化揭示了哪些翻譯策略。",
      exploreButton: "探索語料", readReport: "閱讀報告", sentencePairs: "句對", strategyCategories: "策略類別",
      corpusEyebrow: "語料探索器", explorerTitle: "搜尋翻譯紀錄", explorerNote: "所有圖表都回應相同的搜尋與篩選。點選詞語即可連結各圖表。",
      searchLabel: "搜尋語料", searchPlaceholder: "搜尋英文、中文或關鍵詞", categoryLabel: "類別", allCategories: "所有類別",
      catVerb: "動詞化", catNominal: "保留名詞", catLight: "輕動詞框架", checkedLabel: "人工核對", allEntries: "所有條目",
      checkedYes: "已核對", checkedNo: "未核對", reset: "重設", selectedTerm: "已選詞語", networkKicker: "關係圖",
      networkTitle: "英文詞語與中文譯法", topTerms: "詞語數", minLink: "最低連結權重", networkCaption: "哪些英文名詞化有最多樣的中文譯法？",
      networkHint: "點選節點以篩選語料。可拖曳節點、滾輪縮放。", treemapKicker: "層級圖", treemapTitle: "按關鍵詞劃分策略",
      treemapCaption: "最常見的英文詞語由哪些翻譯策略主導？", treemapHint: "點選方塊以選擇該英文詞語。", heatmapKicker: "分佈圖",
      heatmapTitle: "常見詞語的策略分佈", heatmapCaption: "三種策略如何分佈在最常見的詞語中？", heatmapHint: "點選格子以選擇詞語與策略。",
      kwicKicker: "詞彙圖", kwicTitle: "關鍵詞語境", contextTerm: "詞語", kwicCaption: "所選英文詞語如何出現在字幕句子的語境中？",
      tableKicker: "表格圖", tableTitle: "語料條目", exportCsv: "匯出 CSV", tableCaption: "哪些句對支持這個模式，它們又如何分類？",
      thId: "編號", thEnglish: "英文", thChinese: "中文", thTerm: "關鍵詞", thCategory: "類別", thChecked: "核對",
      previous: "上一頁", next: "下一頁", reportEyebrow: "學習報告", reportTitle: "從重複的名詞到翻譯模式", contents: "目錄",
      origin: "起源", background: "背景", gap: "研究缺口", questions: "研究問題", method: "方法", analysis: "分析", conclusion: "結論", reflection: "反思",
      originText: "我從 NV Atlas 樣本中的一個簡單觀察開始：英文字幕常把動作變成名詞，而中文則讓動作保留為動詞。這個語料庫讓這種細微的語法轉移在大規模資料中變得可見。",
      backgroundText: "名詞化在英文中很常見，尤其是在正式或壓縮的對話中。中文可以保留名詞框架，也可以把事件改寫成直接動詞，或使用輕動詞結構。這些選擇會影響節奏、重點，以及動作呈現的直接程度。",
      gapText: "現有字幕語料庫規模龐大，但很少讓這種特定對比容易檢視。一個聚焦的探索器可以把句對、關鍵詞與翻譯策略連結在同一個介面中，同時保留原始來源。",
      questionsText: "英文名詞化有多常被譯成直接的中文動詞？哪些詞語有最多樣的譯法？這個模式是否適用於最常見的詞語，又對字幕翻譯規範有什麼啟示？",
      methodText: "語料庫包含 500 對來自 OPUS OpenSubtitles 2024 的英中句對。原始 CSV 記錄每對句子的 1-based 編號；我已對照官方 Moses 格式版本核實。我保留原始關鍵詞，並加入來源、類別、人工核對、單位與分類理由。類別依固定且公開的規則套用。以種子 2026 隨機抽取 50 條標記為人工核對。",
      methodText2: "這不是完整 OpenSubtitles 的隨機樣本，而是聚焦於含英文名詞化句子的語料，因此類別比例只描述本語料庫，不代表所有字幕。",
      analysisText: "關係圖顯示少數高頻詞語佔了大部分資料，attention、permission、vacation、protection 與 performance 尤其突出。層級圖與熱圖顯示策略分佈：直接動詞化最多，其次是保留名詞框架，輕動詞結構較少。",
      analysisText2: "這不是簡單的一對一對應。同一個英文詞語可以有不同中文動詞譯法，所選詞語檢視能呈現這些替代譯法。這支持以規範為導向的解讀：字幕譯者傾向使用緊湊、動作導向的中文，但在需要較正式或事件化重點時保留名詞框架。",
      conclusionText: "這個探索器把重複的語法習慣轉化為可搜尋的翻譯模式。它顯示名詞化不只是詞彙問題，而是如何為觀眾包裝事件的選擇。",
      reflectionText: "最困難的是把可辯護的分類規則與看似合理的標籤分開。我學會核對來源編號、公開抽樣方法，並把圖表視為需要與表格核對的證據，而不是裝飾。AI 協助建立網站結構與初稿，但類別界線與來源核對仍需人的判斷。",
      codebookEyebrow: "分類準則", codebookTitle: "處理英文名詞化的三種方式", codebookNote: "規則依序套用，第一個符合的類別優先。",
      codeVerbDef: "英文名詞化以直接中文動詞表達，沒有輕動詞框架或明確名詞標記。", codeVerbRule: "規則：中文句子沒有輕動詞標記，也沒有名詞標記。",
      codeNominalDef: "中文保留事件化或名詞框架，常帶有「的、性、化、度、感」等標記。", codeNominalRule: "規則：沒有輕動詞標記，但至少有一個名詞標記。",
      codeLightDef: "動作由「進行、加以、予以、作出、受到」等輕動詞或動詞框架承擔。", codeLightRule: "規則：至少有一個輕動詞標記；優先於名詞標記。",
      codebookLogTitle: "分類準則紀錄", codebookLogText: "第一版使用寬泛的名詞標記清單，會把只作所有格或關係子句標記的「的」過度計入。我保留標記規則以維持透明，但把輕動詞類別放在前面，避免明確的動詞框架被誤標為保留名詞。類別數量應視為可重現的初版標註，而非定論。",
      declarationEyebrow: "AI 使用聲明", declarationTitle: "我如何使用 AI，以及我核對了什麼", toolsTitle: "工具", toolsText: "OpenAI Codex（GPT-5 系列編碼代理）用於資料準備、介面實作與草稿。D3.js 用於視覺化。",
      aiDidTitle: "AI 做了什麼", aiDidText: "協助整理 CSV、草擬分類規則、建立靜態網站，以及撰寫報告初稿。", humanDidTitle: "我核對了什麼", humanDidText: "我對照官方語料核實來源編號、檢視分類規則，並檢查標記為 human_checked 的 50 條樣本。",
      aiWrongTitle: "一個 AI 錯誤", aiWrongText: "第一版分類把每個「的」都當成保留名詞的證據，誤讀了一般所有格片語。我透過將規則與樣本句對照發現問題，並修正規則順序。",
      footerText: "NV Atlas · 為「人工智慧時代的翻譯科技」課程建立的學生語料探索器。",
    },
  };

  function setLanguage(lang) {
    state.lang = lang;
    document.documentElement.lang = lang === "zh" ? "zh-Hant" : "en";
    $$(".lang-btn").forEach((button) => button.classList.toggle("active", button.dataset.lang === lang));
    $$("[data-i18n]").forEach((element) => {
      const key = element.dataset.i18n;
      if (lang === "zh" && translations.zh[key]) element.textContent = translations.zh[key];
      else if (element.dataset.original) element.textContent = element.dataset.original;
    });
    $$("[data-i18n-placeholder]").forEach((element) => {
      const key = element.dataset.i18nPlaceholder;
      if (!element.dataset.originalPlaceholder) element.dataset.originalPlaceholder = element.placeholder;
      element.placeholder = lang === "zh" && translations.zh[key] ? translations.zh[key] : element.dataset.originalPlaceholder;
    });
    renderAll();
  }

  function readUrl() {
    const params = new URLSearchParams(location.search);
    state.search = params.get("q") || "";
    state.category = params.get("category") || "all";
    state.checked = params.get("checked") || "all";
    state.term = params.get("term") || "";
    state.sort = params.get("sort") || "id";
    state.direction = params.get("dir") || "asc";
    state.page = Math.max(1, Number(params.get("page")) || 1);
    state.topTerms = Math.min(30, Math.max(5, Number(params.get("top")) || 18));
    state.minLink = Math.min(8, Math.max(1, Number(params.get("min")) || 1));
    state.kwicTerm = params.get("kwic") || "";
    state.lang = params.get("lang") === "zh" ? "zh" : "en";
    $("#searchInput").value = state.search;
    $("#categoryFilter").value = state.category;
    $("#checkedFilter").value = state.checked;
    $("#topTerms").value = state.topTerms;
    $("#topTermsValue").value = state.topTerms;
    $("#minLink").value = state.minLink;
    $("#minLinkValue").value = state.minLink;
  }

  function writeUrl() {
    const params = new URLSearchParams();
    if (state.search) params.set("q", state.search);
    if (state.category !== "all") params.set("category", state.category);
    if (state.checked !== "all") params.set("checked", state.checked);
    if (state.term) params.set("term", state.term);
    if (state.sort !== "id") params.set("sort", state.sort);
    if (state.direction !== "asc") params.set("dir", state.direction);
    if (state.page > 1) params.set("page", state.page);
    if (state.topTerms !== 18) params.set("top", state.topTerms);
    if (state.minLink !== 1) params.set("min", state.minLink);
    if (state.kwicTerm) params.set("kwic", state.kwicTerm);
    if (state.lang === "zh") params.set("lang", "zh");
    const query = params.toString();
    history.replaceState(null, "", `${location.pathname}${query ? `?${query}` : ""}${location.hash}`);
  }

  function applyFilters() {
    const query = state.search.trim().toLowerCase();
    state.filtered = state.entries.filter((entry) => {
      if (state.category !== "all" && entry.category !== state.category) return false;
      if (state.checked !== "all" && entry.human_checked !== state.checked) return false;
      if (state.term && entry.key_term !== state.term) return false;
      if (!query) return true;
      return [entry.source_text, entry.target_text, entry.key_term, entry.target_term, entry.category]
        .some((value) => String(value).toLowerCase().includes(query));
    });
    const maxPage = Math.max(1, Math.ceil(state.filtered.length / PAGE_SIZE));
    state.page = Math.min(state.page, maxPage);
  }

  function renderAll() {
    applyFilters();
    renderStatus();
    renderNetwork();
    renderTreemap();
    renderHeatmap();
    renderKwic();
    renderTable();
    writeUrl();
  }

  function renderStatus() {
    const count = state.filtered.length;
    $("#resultCount").textContent = state.lang === "zh" ? `${count} 條目` : `${count} ${count === 1 ? "entry" : "entries"}`;
    $("#activeTermWrap").hidden = !state.term;
    $("#activeTerm").textContent = state.term;
  }

  function topTermCounts(entries) {
    const counts = d3.rollup(entries, (rows) => rows.length, (entry) => entry.key_term);
    return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  }

  function renderNetwork() {
    const container = $("#networkChart");
    container.innerHTML = "";
    const width = container.clientWidth || 800;
    const height = container.clientHeight || 480;
    const svg = d3.select(container).append("svg").attr("viewBox", [0, 0, width, height]);
    const top = topTermCounts(state.filtered).slice(0, state.topTerms);
    if (!top.length) {
      svg.append("text").attr("x", width / 2).attr("y", height / 2).attr("text-anchor", "middle").attr("fill", "#66716b").text("No matching entries");
      return;
    }
    const topNames = new Set(top.map(([term]) => term));
    const links = [];
    const linkCounts = d3.rollup(
      state.filtered.filter((entry) => topNames.has(entry.key_term)),
      (rows) => rows.length,
      (entry) => entry.key_term,
      (entry) => entry.target_term,
    );
    for (const [source, targets] of linkCounts) {
      for (const [target, value] of targets) {
        if (value >= state.minLink) links.push({ source, target, value });
      }
    }
    const nodes = [];
    const seen = new Set();
    for (const [term, count] of top) {
      nodes.push({ id: term, type: "en", count });
      seen.add(term);
    }
    for (const link of links) {
      if (!seen.has(link.target)) {
        seen.add(link.target);
        nodes.push({ id: link.target, type: "zh", count: d3.sum(links.filter((item) => item.target === link.target), (item) => item.value) });
      }
    }
    const nodeById = new Map(nodes.map((node) => [node.id, node]));
    const graphLinks = links.map((link) => ({ ...link, source: nodeById.get(link.source), target: nodeById.get(link.target) }));
    const maxCount = d3.max(nodes, (node) => node.count) || 1;
    const radius = (node) => node.type === "en" ? 7 + 13 * Math.sqrt(node.count / maxCount) : 5 + 8 * Math.sqrt(node.count / maxCount);
    const simulation = d3.forceSimulation(nodes)
      .force("link", d3.forceLink(graphLinks).id((node) => node.id).distance((link) => 70 + 30 / Math.sqrt(link.value)).strength(.35))
      .force("charge", d3.forceManyBody().strength(-120))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide().radius((node) => radius(node) + 8));
    const zoomLayer = svg.append("g");
    svg.call(d3.zoom().scaleExtent([.5, 3]).on("zoom", (event) => zoomLayer.attr("transform", event.transform)));
    const link = zoomLayer.append("g").attr("stroke", "#b9b4a8").attr("stroke-opacity", .55)
      .selectAll("line").data(graphLinks).join("line").attr("stroke-width", (d) => 1 + Math.sqrt(d.value));
    const node = zoomLayer.append("g").selectAll("g").data(nodes).join("g")
      .style("cursor", "pointer")
      .on("click", (event, d) => {
        event.stopPropagation();
        if (d.type === "en") selectTerm(d.id);
        else {
          const entry = state.filtered.find((item) => item.target_term === d.id);
          if (entry) selectTerm(entry.key_term);
        }
      })
      .call(d3.drag()
        .on("start", (event, d) => { if (!event.active) simulation.alphaTarget(.3).restart(); d.fx = d.x; d.fy = d.y; })
        .on("drag", (event, d) => { d.fx = event.x; d.fy = event.y; })
        .on("end", (event, d) => { if (!event.active) simulation.alphaTarget(0); d.fx = null; d.fy = null; }));
    node.append("circle")
      .attr("r", radius)
      .attr("fill", (d) => d.type === "en" ? "#d95d39" : "#2f6b57")
      .attr("stroke", "#fffdf8").attr("stroke-width", 2)
      .attr("opacity", (d) => state.term && d.id !== state.term ? .35 : .9);
    node.append("text")
      .attr("class", "node-label")
      .attr("x", (d) => radius(d) + 4)
      .attr("y", 3)
      .attr("font-size", (d) => d.type === "en" ? 11 : 10)
      .attr("fill", (d) => d.type === "en" ? "#17211d" : "#4f5a54")
      .text((d) => d.id);
    simulation.on("tick", () => {
      link.attr("x1", (d) => d.source.x).attr("y1", (d) => d.source.y).attr("x2", (d) => d.target.x).attr("y2", (d) => d.target.y);
      node.attr("transform", (d) => `translate(${d.x},${d.y})`);
    });
  }

  function renderTreemap() {
    const container = $("#treemapChart");
    container.innerHTML = "";
    const width = container.clientWidth || 500;
    const height = container.clientHeight || 300;
    const svg = d3.select(container).append("svg").attr("viewBox", [0, 0, width, height]);
    const top = topTermCounts(state.filtered).slice(0, 12);
    if (!top.length) return;
    const hierarchy = d3.hierarchy({ children: top.map(([term, count]) => ({ term, count })) }).sum((d) => d.count || 0);
    d3.treemap().size([width, height]).paddingInner(3).paddingOuter(2).round(true)(hierarchy);
    const leaves = hierarchy.leaves();
    const group = svg.selectAll("g").data(leaves).join("g").attr("transform", (d) => `translate(${d.x0},${d.y0})`).style("cursor", "pointer")
      .on("click", (event, d) => selectTerm(d.data.term));
    group.append("rect")
      .attr("width", (d) => Math.max(0, d.x1 - d.x0)).attr("height", (d) => Math.max(0, d.y1 - d.y0))
      .attr("rx", 4).attr("fill", (d) => {
        const rows = state.filtered.filter((entry) => entry.key_term === d.data.term);
        const dominant = d3.greatest(d3.rollup(rows, (items) => items.length, (entry) => entry.category), ([, count]) => count)?.[0];
        return CATEGORY_COLORS[dominant] || "#b9b4a8";
      }).attr("opacity", (d) => state.term && d.data.term !== state.term ? .35 : .9);
    group.append("text").attr("x", 7).attr("y", 17).attr("fill", "#fff").attr("font-size", 11).attr("font-weight", 700).text((d) => d.data.term);
    group.append("text").attr("x", 7).attr("y", 32).attr("fill", "#fff").attr("font-size", 10).attr("opacity", .8).text((d) => d.data.count);
  }

  function renderHeatmap() {
    const container = $("#heatmapChart");
    container.innerHTML = "";
    const width = container.clientWidth || 500;
    const height = container.clientHeight || 300;
    const margin = { top: 8, right: 8, bottom: 58, left: 92 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;
    const svg = d3.select(container).append("svg").attr("viewBox", [0, 0, width, height]);
    const terms = topTermCounts(state.filtered).slice(0, 10).map(([term]) => term);
    const categories = ["verb_recast", "nominal_retained", "light_verb"];
    if (!terms.length) return;
    const cells = [];
    for (const term of terms) for (const category of categories) {
      const count = state.filtered.filter((entry) => entry.key_term === term && entry.category === category).length;
      cells.push({ term, category, count });
    }
    const x = d3.scaleBand().domain(categories).range([0, innerWidth]).padding(.08);
    const y = d3.scaleBand().domain(terms).range([0, innerHeight]).padding(.08);
    const max = d3.max(cells, (cell) => cell.count) || 1;
    const color = d3.scaleSequential().domain([0, max]).interpolator(d3.interpolateRgbBasis(["#f5f2ea", "#e7b7a5", "#b94b2d"]));
    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);
    g.append("g").selectAll("text").data(categories).join("text").attr("class", "axis-label").attr("x", (d) => x(d) + x.bandwidth() / 2).attr("y", -2).attr("text-anchor", "middle").text((d) => categoryLabel(d));
    g.append("g").selectAll("text").data(terms).join("text").attr("class", "axis-label").attr("x", -8).attr("y", (d) => y(d) + y.bandwidth() / 2 + 3).attr("text-anchor", "end").text((d) => d);
    g.selectAll("rect").data(cells).join("rect")
      .attr("x", (d) => x(d.category)).attr("y", (d) => y(d.term)).attr("width", x.bandwidth()).attr("height", y.bandwidth())
      .attr("rx", 3).attr("fill", (d) => d.count ? color(d.count) : "#f0ede5")
      .attr("stroke", (d) => state.term === d.term ? "#17211d" : "transparent").attr("stroke-width", 2)
      .style("cursor", "pointer")
      .on("click", (event, d) => { if (d.count) selectTerm(d.term); });
    g.selectAll("text.value").data(cells).join("text").attr("class", "value").attr("x", (d) => x(d.category) + x.bandwidth() / 2).attr("y", (d) => y(d.term) + y.bandwidth() / 2 + 4).attr("text-anchor", "middle").attr("font-size", 10).attr("fill", (d) => d.count > max * .55 ? "#fff" : "#4f5a54").text((d) => d.count || "");
  }

  function renderKwic() {
    const select = $("#kwicTerm");
    const terms = topTermCounts(state.filtered).map(([term]) => term);
    if (!terms.includes(state.kwicTerm)) state.kwicTerm = terms[0] || "";
    select.innerHTML = terms.map((term) => `<option value="${esc(term)}">${esc(term)}</option>`).join("");
    select.value = state.kwicTerm;
    const rows = state.filtered.filter((entry) => entry.key_term === state.kwicTerm).slice(0, 12);
    $("#kwicList").innerHTML = rows.length ? rows.map((entry) => {
      const regex = new RegExp(`(${escapeRegExp(entry.key_term)})`, "ig");
      return `<div class="kwic-row"><div>${esc(entry.source_text).replace(regex, "<mark>$1</mark>")}</div><div class="zh">${esc(entry.target_text)}</div></div>`;
    }).join("") : `<div class="kwic-row"><div>No matching context.</div><div></div></div>`;
  }

  function escapeRegExp(value) { return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }

  function renderTable() {
    const sorted = [...state.filtered].sort((a, b) => {
      const av = a[state.sort], bv = b[state.sort];
      const result = typeof av === "number" ? av - bv : String(av).localeCompare(String(bv));
      return state.direction === "asc" ? result : -result;
    });
    const maxPage = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
    state.page = Math.min(state.page, maxPage);
    const start = (state.page - 1) * PAGE_SIZE;
    const rows = sorted.slice(start, start + PAGE_SIZE);
    $("#tableBody").innerHTML = rows.map((entry) => `<tr>
      <td>${entry.id}</td>
      <td>${esc(entry.source_text)}</td>
      <td>${esc(entry.target_text)}</td>
      <td><button type="button" class="term-chip" data-term="${esc(entry.key_term)}">${esc(entry.key_term)}</button></td>
      <td><span class="badge ${entry.category}">${esc(categoryLabel(entry.category))}</span></td>
      <td class="${entry.human_checked === "yes" ? "checked" : "unchecked"}">${entry.human_checked === "yes" ? "✓" : "—"}</td>
    </tr>`).join("");
    $$("#tableBody [data-term]").forEach((button) => button.addEventListener("click", () => selectTerm(button.dataset.term)));
    $("#pageInfo").textContent = state.lang === "zh" ? `第 ${state.page} / ${maxPage} 頁` : `Page ${state.page} of ${maxPage}`;
    $("#prevPage").disabled = state.page <= 1;
    $("#nextPage").disabled = state.page >= maxPage;
  }

  function selectTerm(term) {
    state.term = state.term === term ? "" : term;
    state.page = 1;
    renderAll();
  }

  function exportCsv() {
    const fields = ["id", "source_text", "target_text", "source", "category", "human_checked", "unit", "key_term", "target_term", "rationale"];
    const lines = [fields.join(","), ...state.filtered.map((entry) => fields.map((field) => `"${String(entry[field]).replace(/"/g, '""')}"`).join(","))];
    const blob = new Blob(["\ufeff" + lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "nvatlas-filtered-corpus.csv";
    link.click();
    URL.revokeObjectURL(link.href);
  }

  function bindEvents() {
    $("#searchInput").addEventListener("input", (event) => { state.search = event.target.value; state.page = 1; renderAll(); });
    $("#categoryFilter").addEventListener("change", (event) => { state.category = event.target.value; state.page = 1; renderAll(); });
    $("#checkedFilter").addEventListener("change", (event) => { state.checked = event.target.value; state.page = 1; renderAll(); });
    $("#resetButton").addEventListener("click", () => {
      Object.assign(state, { search: "", category: "all", checked: "all", term: "", sort: "id", direction: "asc", page: 1, topTerms: 18, minLink: 1, kwicTerm: "" });
      $("#searchInput").value = ""; $("#categoryFilter").value = "all"; $("#checkedFilter").value = "all";
      $("#topTerms").value = 18; $("#topTermsValue").value = 18; $("#minLink").value = 1; $("#minLinkValue").value = 1;
      renderAll();
    });
    $("#activeTerm").addEventListener("click", () => selectTerm(state.term));
    $("#topTerms").addEventListener("input", (event) => { state.topTerms = Number(event.target.value); $("#topTermsValue").value = state.topTerms; renderAll(); });
    $("#minLink").addEventListener("input", (event) => { state.minLink = Number(event.target.value); $("#minLinkValue").value = state.minLink; renderAll(); });
    $("#kwicTerm").addEventListener("change", (event) => { state.kwicTerm = event.target.value; renderAll(); });
    $("#exportButton").addEventListener("click", exportCsv);
    $("#prevPage").addEventListener("click", () => { state.page = Math.max(1, state.page - 1); renderAll(); });
    $("#nextPage").addEventListener("click", () => { state.page += 1; renderAll(); });
    $$("th button").forEach((button) => button.addEventListener("click", () => {
      if (state.sort === button.dataset.sort) state.direction = state.direction === "asc" ? "desc" : "asc";
      else { state.sort = button.dataset.sort; state.direction = "asc"; }
      state.page = 1; renderAll();
    }));
    $$(".lang-btn").forEach((button) => button.addEventListener("click", () => setLanguage(button.dataset.lang)));
    window.addEventListener("resize", () => { clearTimeout(window.__resizeTimer); window.__resizeTimer = setTimeout(renderAll, 150); });
  }

  async function init() {
    $$("[data-i18n]").forEach((element) => { element.dataset.original = element.textContent; });
    readUrl();
    try {
      const response = await fetch("data/corpus.json");
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const payload = await response.json();
      state.entries = payload.entries;
      bindEvents();
      setLanguage(state.lang);
    } catch (error) {
      $("#resultCount").textContent = "Could not load corpus data.";
      console.error(error);
    }
  }

  init();
})();
