const $ = (id) => document.getElementById(id);
const STEPS = ['stepUpload', 'stepPreview', 'stepLoading', 'stepResult'];
const MAX_FILE_SIZE = 10 * 1024 * 1024;

let selectedFile = null;
let previewDataUrl = null;
let abortController = null;

// --- Navigation ---

function showStep(stepId) {
    STEPS.forEach(s => $(s).classList.remove('active'));
    $(stepId).classList.add('active');
    $('error').classList.remove('active');
}

function showError(msg) {
    $('error').textContent = msg;
    $('error').classList.add('active');
}

// --- Upload ---

const uploadArea = $('uploadArea');
const fileInput = $('fileInput');

uploadArea.addEventListener('click', () => fileInput.click());
uploadArea.addEventListener('dragover', (e) => { e.preventDefault(); uploadArea.classList.add('dragover'); });
uploadArea.addEventListener('dragleave', () => uploadArea.classList.remove('dragover'));
uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.classList.remove('dragover');
    if (e.dataTransfer.files.length) handleFile(e.dataTransfer.files[0]);
});
fileInput.addEventListener('change', () => { if (fileInput.files.length) handleFile(fileInput.files[0]); });

function handleFile(file) {
    if (!file.type.startsWith('image/')) return showError('Vui lòng chọn file ảnh (JPG, PNG, ...)');
    if (file.size > MAX_FILE_SIZE) return showError('File quá lớn. Tối đa 10MB.');

    selectedFile = file;
    const reader = new FileReader();
    reader.onload = (e) => {
        previewDataUrl = e.target.result;
        $('previewImg').src = previewDataUrl;
        showStep('stepPreview');
    };
    reader.readAsDataURL(file);
}

// --- Analyze ---

$('analyzeBtn').addEventListener('click', analyze);

async function analyze() {
    if (!selectedFile) return;

    // Cancel any in-flight request
    abortController?.abort();
    abortController = new AbortController();

    $('loadingImg').src = previewDataUrl;
    showStep('stepLoading');

    try {
        const formData = new FormData();
        formData.append('photo', selectedFile);

        const res = await fetch('/api/analyze', {
            method: 'POST',
            body: formData,
            signal: abortController.signal,
        });

        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.error || err.detail || `HTTP ${res.status}`);
        }

        const data = await res.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!text) throw new Error('AI không trả về kết quả');

        renderResult(text);
        showStep('stepResult');
    } catch (e) {
        if (e.name === 'AbortError') return; // User cancelled — ignore
        const msg = e.message.includes('Failed to fetch')
            ? 'Không thể kết nối server. Vui lòng thử lại.'
            : e.message;
        showError(msg);
        showStep('stepPreview');
    } finally {
        abortController = null;
    }
}


// --- Render Result ---

function renderResult(markdown) {
    $('resultImg').src = previewDataUrl;

    const sections = parseMarkdown(markdown);
    const summarySection = sections.find(s => /tổng quan/i.test(s.title));
    const tipSection = sections.find(s => /góp ý|cải thiện/i.test(s.title));
    const detailSections = sections.filter(s => s !== summarySection && s !== tipSection);

    $('resultSummary').innerHTML = buildSummaryHtml(summarySection);

    let detailsHtml = tipSection ? renderSection(tipSection, true) : '';
    detailSections.forEach(s => { detailsHtml += renderSection(s, false); });
    $('resultDetails').innerHTML = detailsHtml;

    document.querySelectorAll('.detail-header').forEach(header => {
        header.addEventListener('click', () => header.parentElement.classList.toggle('open'));
    });
}

function buildSummaryHtml(section) {
    const body = section?.body || '';
    const scoreMatch = body.match(/(\d+(?:\.\d+)?)\s*\/\s*10/);
    const score = scoreMatch ? scoreMatch[1] : '—';

    let html = `<h2>⭐ Đánh giá tổng quan</h2>`;
    html += `<div class="score">${score}<span style="font-size:1rem;color:#888">/10</span></div>`;

    const scoreItems = [...body.matchAll(/(\w[\w\s&]*?)\s*[:\(]\s*(\d+(?:\.\d+)?)\s*\/\s*10/gi)];
    if (scoreItems.length) {
        html += `<div class="score-breakdown">`;
        scoreItems.forEach(m => { html += `<span class="score-item">${m[1].trim()}: ${m[2]}/10</span>`; });
        html += `</div>`;
    }

    const summaryText = body.replace(/.*\d+\s*\/\s*10.*/g, '').replace(/\*\*/g, '').trim();
    if (summaryText) {
        const lines = summaryText.split('\n').filter(l => l.trim()).join('<br>');
        html += `<p style="margin-top:12px;color:#bbb;font-size:0.9rem;line-height:1.6">${lines}</p>`;
    }

    return html;
}

function renderSection(section, openByDefault) {
    const bodyHtml = simpleMarkdown(section.body);
    return `<div class="detail-section${openByDefault ? ' open' : ''}">
        <div class="detail-header">
            <h3>${section.title}</h3>
            <span class="detail-arrow">▼</span>
        </div>
        <div class="detail-body">${bodyHtml}</div>
    </div>`;
}

// --- Markdown Parsing ---

function parseMarkdown(md) {
    const sections = [];
    let current = null;

    for (const line of md.split('\n')) {
        const match = line.match(/^#{1,3}\s+(.+)/);
        if (match) {
            if (current) sections.push(current);
            current = { title: match[1].trim(), body: '' };
        } else if (current) {
            current.body += line + '\n';
        }
    }
    if (current) sections.push(current);
    return sections;
}

function simpleMarkdown(text) {
    return text
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.+?)\*/g, '<em>$1</em>')
        .replace(/^- (.+)$/gm, '<li>$1</li>')
        .replace(/^(\d+)\.\s+(.+)$/gm, '<li>$2</li>')
        .replace(/(<li>[\s\S]*?<\/li>)/g, '<ul>$1</ul>')
        .replace(/<\/ul>\s*<ul>/g, '')
        .replace(/\n\n/g, '<br><br>')
        .replace(/\n/g, '<br>')
        .trim();
}

// --- New Photo ---

$('newPhotoBtn').addEventListener('click', () => {
    abortController?.abort(); // Cancel any pending request
    selectedFile = null;
    previewDataUrl = null;
    fileInput.value = '';
    showStep('stepUpload');
});
