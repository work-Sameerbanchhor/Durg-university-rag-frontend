import './theme.js';
import './style.css';

// ==========================================================================
// STATE MANAGEMENT & CONSTANTS
// ==========================================================================
let currentMode = "sql";
let chatHistory = [];
let activeRightTab = "sql";

// Select DOM Elements
const apiInput = document.getElementById("api-endpoint");
const apiSecretKeyInput = document.getElementById("api-secret-key");
const apiBadge = document.getElementById("api-status-badge");
const chatInput = document.getElementById("chat-input");
const chatMessages = document.getElementById("chat-messages");
const sendChatBtn = document.getElementById("send-chat-btn");
const statusIndicator = document.getElementById("system-status-indicator");
const progressBar = document.getElementById("progress-bar");

// Health check interval handler
let healthCheckTimer = null;

// Initialize app when DOM is fully loaded
document.addEventListener("DOMContentLoaded", () => {
    // Load saved values on DOM load
    const savedEndpoint = localStorage.getItem("api-endpoint");
    if (savedEndpoint) {
        apiInput.value = savedEndpoint;
    }
    const savedSecretKey = localStorage.getItem("api-secret-key") || "";
    if (apiSecretKeyInput) {
        apiSecretKeyInput.value = savedSecretKey;
    }

    // On desktop viewports, have the right panel open by default
    if (window.innerWidth > 1024) {
        const panel = document.querySelector(".right-panel");
        if (panel) {
            panel.classList.add("open");
        }
    }

    // On desktop/tablet viewports, have the left sidebar open by default
    if (window.innerWidth > 768) {
        const sidebar = document.querySelector(".sidebar-left");
        if (sidebar) {
            sidebar.classList.add("open");
        }
    }

    // Perform initial health check
    checkAPIHealth();
    
    // Automatically trigger health check when input changes
    apiInput.addEventListener("change", () => {
        localStorage.setItem("api-endpoint", apiInput.value.trim());
        showToast("Reconnecting to API endpoint...");
        checkAPIHealth();
    });

    if (apiSecretKeyInput) {
        apiSecretKeyInput.addEventListener("change", () => {
            localStorage.setItem("api-secret-key", apiSecretKeyInput.value.trim());
            showToast("Updated API Secret Key...");
            checkAPIHealth();
        });
    }

    // Start periodic health check polling (every 12 seconds)
    healthCheckTimer = setInterval(checkAPIHealth, 12000);

    // Initial sizing for textarea auto-expand
    chatInput.addEventListener("input", autoGrowTextarea);
});

// Auto-grow chat textarea during typing
function autoGrowTextarea() {
    this.style.height = "auto";
    this.style.height = (this.scrollHeight) + "px";
}

// ==========================================================================
// UI HELPER FUNCTIONS
// ==========================================================================

// Toggle Theme Mode (Light / Dark)
function toggleTheme() {
    const body = document.body;
    const currentTheme = body.getAttribute("data-theme");
    const nextTheme = currentTheme === "dark" ? "light" : "dark";
    body.setAttribute("data-theme", nextTheme);
    
    // Reapply current color preset variables corresponding to the new theme mode
    if (typeof applyThemePreset === "function" && typeof getCurrentPresetKey === "function") {
        applyThemePreset(getCurrentPresetKey());
    }

    showToast(`Switched to ${nextTheme} mode`);
}

// Toggle Left Sidebar (Drawer menu on mobile)
function toggleLeftSidebar() {
    const sidebar = document.querySelector(".sidebar-left");
    const backdrop = document.querySelector(".sidebar-backdrop");
    sidebar.classList.toggle("open");
    backdrop.classList.toggle("open");
}

// Toggle Right Panel (SQL Workbench & Vector explorer)
function toggleRightPanel() {
    const panel = document.querySelector(".right-panel");
    panel.classList.toggle("open");
}

// Switch between right sidebar tabs (SQL vs Vector Search)
function switchRightTab(tabName) {
    activeRightTab = tabName;
    
    // Manage tab buttons styling
    document.getElementById("tab-sql-btn").classList.toggle("active", tabName === "sql");
    document.getElementById("tab-vector-btn").classList.toggle("active", tabName === "vector");
    
    // Manage panels visibility
    document.getElementById("pane-sql").classList.toggle("active", tabName === "sql");
    document.getElementById("pane-vector").classList.toggle("active", tabName === "vector");
}

// Select query execution mode (SQL, Analyst, Scientist, MoE Experts)
function selectMode(mode) {
    currentMode = mode;
    
    // Toggle active state in sidebar pills
    const pills = document.querySelectorAll(".sidebar-mode-list .mode-pill");
    pills.forEach(pill => {
        const isActive = pill.getAttribute("onclick").includes(`'${mode}'`);
        pill.classList.toggle("active", isActive);
    });
    
    showToast(`Switched to ${mode.toUpperCase()} Mode`);
}

// Update bottom system status indicators
function setStatus(type, text) {
    statusIndicator.className = ""; // Reset classes
    statusIndicator.classList.add(`status-${type}`);
    statusIndicator.textContent = text;
}

// Trigger top indicator progress bar loading
function setProgressIndeterminate(loading) {
    if (loading) {
        progressBar.classList.add("indeterminate");
        progressBar.style.width = "100%";
    } else {
        progressBar.classList.remove("indeterminate");
        progressBar.style.width = "0%";
    }
}

// Spawn toast notifications
function showToast(message) {
    const container = document.getElementById("toast-container");
    const toast = document.createElement("div");
    toast.className = "toast";
    toast.innerHTML = `<i class="fa-solid fa-circle-info" style="color:var(--accent-blue)"></i> <span>${message}</span>`;
    container.appendChild(toast);
    
    // Fade out and remove toast after 3 seconds
    setTimeout(() => {
        toast.style.transition = "opacity 0.5s ease";
        toast.style.opacity = "0";
        setTimeout(() => toast.remove(), 500);
    }, 3000);
}

// Escapes special characters to render HTML cleanly as code text
function escapeHtml(text) {
    if (!text) return "";
    return String(text)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// Hide welcome hero on initial chat query submission
function hideWelcome() {
    const welcome = document.getElementById("welcome-hero");
    if (welcome) welcome.style.display = "none";
}

// Add message bubble to the messages panel
function appendMessage(sender, contentHtml, isTyping = false) {
    const bubble = document.createElement("div");
    bubble.className = `message-bubble ${sender}`;
    const id = "bubble-" + Math.random().toString(36).substr(2, 9);
    bubble.id = id;

    const avatarIcon = sender === "user" 
        ? '<i class="fa-solid fa-user"></i>' 
        : '<img src="assets/robot-icon.png" alt="Bot Avatar" class="bot-avatar-img">';

    bubble.innerHTML = `
        <div class="avatar">${avatarIcon}</div>
        <div class="bubble-content">${contentHtml}</div>
    `;

    chatMessages.appendChild(bubble);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    
    return id;
}

// Timeline toggle collapsibles
function toggleTimeline(headerElement) {
    const body = headerElement.nextElementSibling;
    const icon = headerElement.querySelector(".toggle-icon");
    const isOpen = body.style.display !== "none";
    
    if (isOpen) {
        body.style.display = "none";
        icon.className = "fa-solid fa-chevron-down toggle-icon";
    } else {
        body.style.display = "flex";
        icon.className = "fa-solid fa-chevron-up toggle-icon";
    }
}

// ==========================================================================
// API CLIENT IMPLEMENTATION
// ==========================================================================

// Get sanitized endpoint from config box
function getBaseUrl() {
    let url = apiInput.value.trim();
    if (url.endsWith("/")) {
        url = url.slice(0, -1);
    }
    return url;
}

// Generate headers including authorization secret key
function getHeaders(extraHeaders = {}) {
    const headers = { ...extraHeaders };
    const secretKey = apiSecretKeyInput ? apiSecretKeyInput.value.trim() : "";
    if (secretKey) {
        headers["X-Secret-Key"] = secretKey;
    }
    return headers;
}

// Check if API endpoint is online and pull DB metrics
async function checkAPIHealth() {
    const baseUrl = getBaseUrl();
    const statusLabel = apiBadge.querySelector(".status-label");
    
    try {
        const res = await fetch(`${baseUrl}/api/status`, {
            method: "GET",
            headers: getHeaders({ "Accept": "application/json" })
        });
        
        if (res.ok) {
            const data = await res.json();
            apiBadge.className = "api-badge online";
            statusLabel.textContent = "Online";
            
            // Populates database stats panel
            if (data.db_stats) {
                document.getElementById("db-stat-students").textContent = data.db_stats.duckdb_students.toLocaleString();
                document.getElementById("db-stat-attempts").textContent = data.db_stats.duckdb_attempts.toLocaleString();
                document.getElementById("db-stat-marks").textContent = data.db_stats.duckdb_marks.toLocaleString();
                document.getElementById("db-stat-colleges").textContent = data.db_stats.duckdb_colleges.toLocaleString();
            }
            if (data.server_time) {
                document.getElementById("server-time-meta").textContent = data.server_time.split("T")[1].substring(0, 5);
            }
        } else {
            throw new Error();
        }
    } catch (err) {
        apiBadge.className = "api-badge offline";
        statusLabel.textContent = "Offline";
    }
}

// Send chat message payload to API and process responses
async function sendChatMessage() {
    const message = chatInput.value.trim();
    if (!message) return;

    // Reset layout elements
    chatInput.value = "";
    chatInput.style.height = "auto";
    hideWelcome();

    // Render User message
    appendMessage("user", escapeHtml(message));

    // Append loading typing bubble for Bot
    const loadingId = appendMessage("bot", `
        <div class="typing-indicator">
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
        </div>
    `);

    setStatus("running", "COPILOT PROCESSING QUERY...");
    setProgressIndeterminate(true);

    const baseUrl = getBaseUrl();
    try {
        const res = await fetch(`${baseUrl}/api/chat`, {
            method: "POST",
            headers: getHeaders({
                "Content-Type": "application/json"
            }),
            body: JSON.stringify({
                message: message,
                history: chatHistory,
                mode: currentMode
            })
        });

        if (!res.ok) {
            throw new Error(`HTTP Error: ${res.status} ${res.statusText}`);
        }

        const data = await res.json();

        // Remove typing indicator bubble
        document.getElementById(loadingId).remove();

        // Convert Bot markdown response to HTML using Marked.js
        const formattedHtml = marked.parse(data.response);

        // Build Agent Steps Timeline
        let stepsHtml = "";
        if (data.steps && data.steps.length > 0) {
            stepsHtml += `
                <div class="agent-steps-timeline">
                    <div class="timeline-header" onclick="toggleTimeline(this)">
                        <span><i class="fa-solid fa-code-fork"></i> Agent Execution Timeline (${data.steps.length} Steps)</span>
                        <i class="fa-solid fa-chevron-down toggle-icon"></i>
                    </div>
                    <div class="timeline-body" style="display: none;">
            `;
            
            data.steps.forEach(step => {
                let badgeIcon = "fa-check";
                if (step.status === "error") badgeIcon = "fa-xmark";
                else if (step.status === "running") badgeIcon = "fa-spinner fa-spin";
                
                stepsHtml += `
                    <div class="timeline-step">
                        <div class="timeline-badge ${step.status}">
                            <i class="fa-solid ${badgeIcon}"></i>
                        </div>
                        <div class="timeline-content">
                            <div class="timeline-agent">${step.agent}</div>
                            <div class="timeline-action">${step.action}</div>
                            ${step.details ? `<div class="timeline-details">${escapeHtml(step.details)}</div>` : ''}
                        </div>
                    </div>
                `;
            });
            
            stepsHtml += `</div></div>`;
        }

        // Build Metadata elements (Query mode + runnable SQL buttons)
        let metaHtml = `<div class="metadata-tags">`;
        metaHtml += `<span class="meta-tag"><i class="fa-solid fa-route"></i> Mode: ${(data.query_type || currentMode).toUpperCase()}</span>`;
        if (data.sql_query) {
            // Escape quotes inside function arguments string to copy nicely
            const escapedSql = data.sql_query.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/"/g, '&quot;').replace(/\n/g, '\\n');
            metaHtml += `<span class="meta-tag sql" onclick="loadSQLToWorkbench('${escapedSql}')"><i class="fa-solid fa-code"></i> Load SQL to Workbench</span>`;
        }
        if (data.vector_query) {
            metaHtml += `<span class="meta-tag"><i class="fa-solid fa-spider"></i> Vector retrieval matched</span>`;
        }
        metaHtml += `</div>`;

        // Render Bot response
        appendMessage("bot", formattedHtml + stepsHtml + metaHtml);

        // Update chat history memory
        chatHistory.push({ role: "user", content: message });
        chatHistory.push({ role: "assistant", content: data.response });

        // Limit memory size to last 8 turns (16 messages) to avoid token overflow
        if (chatHistory.length > 16) {
            chatHistory = chatHistory.slice(-16);
        }

        setStatus("ready", "READY · RESPONSE RECEIVED");
        setProgressIndeterminate(false);
        showToast("Response received!");

    } catch (err) {
        console.error(err);
        document.getElementById(loadingId).remove();
        appendMessage("bot", `<div style="color:var(--accent-rose)"><i class="fa-solid fa-triangle-exclamation"></i> Error: ${escapeHtml(err.message)}</div>`);
        
        setStatus("error", "COPILOT ERROR: " + err.message.toUpperCase());
        setProgressIndeterminate(false);
        showToast("Error processing query!");
    }
}

// Trigger chat submit on pressing Enter (without Shift)
function handleChatSubmit(event) {
    if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        sendChatMessage();
    }
}

// Suggestion cards integration
function useSuggestion(cardElement) {
    const text = cardElement.querySelector(".card-text").textContent;
    chatInput.value = text;
    chatInput.style.height = "auto";
    sendChatMessage();
}

// Start a fresh new chat session
function startNewChat() {
    chatHistory = [];
    chatMessages.innerHTML = `
        <div class="welcome-hero" id="welcome-hero">
            <div class="welcome-hero-icon">
                <i class="fa-solid fa-user-astronaut"></i>
            </div>
            <h3>Durg University Results Copilot</h3>
            <p>Ask anything about student marks, result distributions, failures, pass percentages, college-level statistics, or individual roll number reports.</p>
            
            <div class="suggestions-grid">
                <div class="suggestion-card" onclick="useSuggestion(this)">
                    <div class="card-icon"><i class="fa-solid fa-chart-line"></i></div>
                    <div class="card-text">Show BCA average marks by subject</div>
                </div>
                <div class="suggestion-card" onclick="useSuggestion(this)">
                    <div class="card-icon"><i class="fa-solid fa-percent"></i></div>
                    <div class="card-text">Compare B.Sc and BA pass rates</div>
                </div>
                <div class="suggestion-card" onclick="useSuggestion(this)">
                    <div class="card-icon"><i class="fa-solid fa-award"></i></div>
                    <div class="card-text">Who scored highest in BCom Session 2023?</div>
                </div>
            </div>
        </div>
    `;
    setStatus("ready", "READY · NEW CONVERSATION STARTED");
    showToast("Chat reset complete");
}

// ==========================================================================
// SQL WORKBENCH CLIENT
// ==========================================================================

// Run SQL query directly on DuckDB database
async function executeSQLQuery() {
    const query = document.getElementById("sql-query-input").value.trim();
    const wrapper = document.getElementById("sql-results-wrapper");
    const timer = document.getElementById("sql-time");
    if (!query) return;

    // Set loading indicator
    wrapper.innerHTML = `
        <div class="empty-state">
            <i class="fa-solid fa-circle-notch fa-spin"></i>
            <div>Executing SQL statement...</div>
        </div>
    `;

    setStatus("running", "EXECUTING SQL ON DUCKDB...");
    setProgressIndeterminate(true);
    timer.textContent = "Executing...";

    const start = performance.now();
    const baseUrl = getBaseUrl();

    try {
        const res = await fetch(`${baseUrl}/api/sql`, {
            method: "POST",
            headers: getHeaders({ "Content-Type": "application/json" }),
            body: JSON.stringify({ query: query })
        });

        const data = await res.json();
        const end = performance.now();
        timer.textContent = `${((end - start) / 1000).toFixed(3)}s`;

        // Render error if server returns compilation/access errors
        if (data.error) {
            wrapper.innerHTML = `
                <div class="empty-state" style="color:var(--accent-rose)">
                    <i class="fa-solid fa-circle-xmark"></i>
                    <div><strong>SQL Query failed</strong></div>
                    <div style="font-family:var(--font-mono); font-size:0.75rem; border:1px solid rgba(239,68,68,0.2); padding:0.5rem; background:rgba(0,0,0,0.25); text-align:left; max-width:95%; border-radius:var(--radius-sm); margin-top:0.5rem; word-break:break-all;">${escapeHtml(data.error)}</div>
                </div>
            `;
            setStatus("error", "SQL QUERY EXECUTION FAILED");
            setProgressIndeterminate(false);
            showToast("SQL query error!");
            return;
        }

        const rows = data.results;
        if (!rows || rows.length === 0) {
            wrapper.innerHTML = `
                <div class="empty-state">
                    <i class="fa-solid fa-triangle-exclamation"></i>
                    <div>Statement executed successfully, returned 0 rows.</div>
                </div>
            `;
            setStatus("ready", "READY · STATEMENT RUN SUCCESSFULLY");
            setProgressIndeterminate(false);
            showToast("SQL returned 0 rows");
            return;
        }

        // Build data table dynamic output
        const headers = Object.keys(rows[0]);
        let tableHtml = `<table class="data-table"><thead><tr>`;
        headers.forEach(header => {
            tableHtml += `<th>${escapeHtml(header)}</th>`;
        });
        tableHtml += `</tr></thead><tbody>`;

        rows.forEach(row => {
            tableHtml += `<tr>`;
            headers.forEach(header => {
                const cellVal = row[header] !== null ? escapeHtml(row[header]) : `<span style="color:var(--text-muted);font-style:italic">NULL</span>`;
                tableHtml += `<td>${cellVal}</td>`;
            });
            tableHtml += `</tr>`;
        });
        tableHtml += `</tr>`;

        wrapper.innerHTML = tableHtml;
        setStatus("ready", "READY · DATA RETRIEVED");
        setProgressIndeterminate(false);
        showToast("SQL loaded successfully!");

    } catch (err) {
        console.error(err);
        timer.textContent = "Error";
        wrapper.innerHTML = `
            <div class="empty-state" style="color:var(--accent-rose)">
                <i class="fa-solid fa-circle-xmark"></i>
                <div>Failed to query database endpoint: ${escapeHtml(err.message)}</div>
            </div>
        `;
        setStatus("error", "SQL ENDPOINT ACCESS ERROR");
        setProgressIndeterminate(false);
    }
}

// Copy SQL from chat tags directly to Workbench and execute
function loadSQLToWorkbench(sqlStatement) {
    // Un-escape escaped line breaks and characters
    const cleanSql = sqlStatement.replace(/\\n/g, '\n').replace(/\\'/g, "'").replace(/\\\\/g, '\\');
    document.getElementById("sql-query-input").value = cleanSql;
    switchRightTab("sql");
    
    // Smooth scroll the right panel into view on small screens
    const panel = document.querySelector(".right-panel");
    panel.classList.add("open");
    
    executeSQLQuery();
}

// ==========================================================================
// SEMANTIC SEARCH CLIENT
// ==========================================================================

// Run vector search matching on ChromaDB index
async function executeVectorSearch() {
    const query = document.getElementById("vector-search-input").value.trim();
    const resultsList = document.getElementById("vector-results-list");
    if (!query) return;

    resultsList.innerHTML = `
        <div class="empty-state">
            <i class="fa-solid fa-circle-notch fa-spin"></i>
            <div>Querying ChromaDB vector index...</div>
        </div>
    `;

    setStatus("running", "QUERYING CHROMADB INDEX...");
    setProgressIndeterminate(true);

    const baseUrl = getBaseUrl();

    try {
        const res = await fetch(`${baseUrl}/api/semantic`, {
            method: "POST",
            headers: getHeaders({ "Content-Type": "application/json" }),
            body: JSON.stringify({ query: query, n_results: 5 })
        });

        const data = await res.json();
        const items = data.results;

        if (!items || items.length === 0) {
            resultsList.innerHTML = `
                <div class="empty-state">
                    <i class="fa-solid fa-triangle-exclamation"></i>
                    <div>No semantic search matches found.</div>
                </div>
            `;
            setStatus("ready", "READY · SEARCH COMPLETE");
            setProgressIndeterminate(false);
            showToast("No matches found");
            return;
        }

        let htmlCards = "";
        items.forEach((item, idx) => {
            // Read distance / relevance scores
            const distance = item.distance ? Number(item.distance).toFixed(4) : "N/A";
            
            // Build card layouts
            htmlCards += `
                <div class="vector-result-card">
                    <div class="vector-card-header">
                        <span class="vector-roll"><i class="fa-solid fa-hashtag"></i> Roll No: ${escapeHtml(item.metadata.roll_no)}</span>
                        <span class="vector-distance">Distance: ${distance}</span>
                    </div>
                    <div class="vector-text">${escapeHtml(item.document)}</div>
                </div>
            `;
        });

        resultsList.innerHTML = htmlCards;
        setStatus("ready", "READY · VECTORS RETRIEVED");
        setProgressIndeterminate(false);
        showToast("Semantic vectors retrieved!");

    } catch (err) {
        console.error(err);
        resultsList.innerHTML = `
            <div class="empty-state" style="color:var(--accent-rose)">
                <i class="fa-solid fa-circle-xmark"></i>
                <div>Failed to query vector database endpoint: ${escapeHtml(err.message)}</div>
            </div>
        `;
        setStatus("error", "VECTOR ENDPOINT ACCESS ERROR");
        setProgressIndeterminate(false);
    }
}

// Trigger Vector search on pressing Enter
function handleVectorSubmit(event) {
    if (event.key === "Enter") {
        event.preventDefault();
        executeVectorSearch();
    }
}

// Export/bind to window scope for compatibility with ES Modules in Vite
window.toggleTheme = toggleTheme;
window.toggleLeftSidebar = toggleLeftSidebar;
window.toggleRightPanel = toggleRightPanel;
window.switchRightTab = switchRightTab;
window.selectMode = selectMode;
window.sendChatMessage = sendChatMessage;
window.handleChatSubmit = handleChatSubmit;
window.useSuggestion = useSuggestion;
window.startNewChat = startNewChat;
window.executeSQLQuery = executeSQLQuery;
window.loadSQLToWorkbench = loadSQLToWorkbench;
window.executeVectorSearch = executeVectorSearch;
window.handleVectorSubmit = handleVectorSubmit;
window.toggleTimeline = toggleTimeline;
window.showToast = showToast;
