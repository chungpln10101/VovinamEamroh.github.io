// DỮ LIỆU THÍ SINH (MOCK DATA)
let mockCandidates = [
    { id: 101, sbd: "SBD01", name: "Nguyễn Văn An", dob: "2005-05-10", club: "Nguyễn Huệ", belt: "Lam đai", theory: 0, tech: 0, sparring: 0, fitness: 0, evaluated: false },
    { id: 102, sbd: "SBD02", name: "Trần Thị Bích", dob: "2006-08-20", club: "Lê Hữu Trác", belt: "Lam đai", theory: 0, tech: 0, sparring: 0, fitness: 0, evaluated: false },
    { id: 103, sbd: "SBD03", name: "Lê Hoàng Nam", dob: "2004-12-01", club: "Nội Trú", belt: "Lam đai I", theory: 0, tech: 0, sparring: 0, fitness: 0, evaluated: false },
    { id: 104, sbd: "SBD04", name: "Phạm Minh Tâm", dob: "2005-02-15", club: "Y Ngông", belt: "Lam đai II", theory: 0, tech: 0, sparring: 0, fitness: 0, evaluated: false },
    { id: 105, sbd: "SBD05", name: "Hoàng Tuấn Kiệt", dob: "2003-11-11", club: "Hùng Vương", belt: "Chuẩn hoàng đai", theory: 0, tech: 0, sparring: 0, fitness: 0, evaluated: false }
];

// DỮ LIỆU ADMIN & GIÁM KHẢO
const ADMIN_ACCOUNT = { id: 'HLV', pass: 'admin', name: 'HLV Trưởng' };

// Tải danh sách giám khảo từ LocalStorage hoặc dùng mặc định
let judgesList = JSON.parse(localStorage.getItem('vovinamJudges')) || [
    { id: 'GK01', pass: '123456', name: 'Thầy Hùng' },
    { id: 'GK02', pass: '123456', name: 'Cô Lan' }
];

let currentUser = null;

// --- HỆ THỐNG ĐĂNG NHẬP ---
const loginForm = document.getElementById('login-form');
if(loginForm) {
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const id = document.getElementById('login-id').value.trim();
        const pass = document.getElementById('login-pass').value.trim();

        // 1. Kiểm tra Admin (HLV Trưởng)
        if(id === ADMIN_ACCOUNT.id && pass === ADMIN_ACCOUNT.pass) {
            currentUser = { ...ADMIN_ACCOUNT, role: 'admin' };
            loginSuccess();
            return;
        }

        // 2. Kiểm tra Giám khảo
        const judge = judgesList.find(j => j.id === id && j.pass === pass);
        if(judge) {
            currentUser = { ...judge, role: 'judge' };
            loginSuccess();
            return;
        }

        alert("Sai mã đăng nhập hoặc mật khẩu!");
    });
}

function loginSuccess() {
    document.getElementById('login-section').style.display = 'none';
    document.getElementById('user-display').style.display = 'flex';
    
    // Hiển thị tên người dùng
    const roleTitle = currentUser.role === 'admin' ? "HLV Trưởng" : "Giám khảo";
    document.getElementById('user-name-display').innerText = `${roleTitle}: ${currentUser.name}`;

    // Nếu là Admin, hiện Panel Quản lý
    if (currentUser.role === 'admin') {
        document.getElementById('admin-panel').style.display = 'block';
        window.renderJudgeManager();
    } else {
        document.getElementById('admin-panel').style.display = 'none';
    }

    // Hiển thị danh sách chấm thi (cho cả 2)
    document.getElementById('grading-section').style.display = 'block';
    window.renderCandidates();
}

window.logout = function() {
    location.reload(); 
}

// --- QUẢN LÝ GIÁM KHẢO (CHỈ ADMIN) ---
window.renderJudgeManager = function() {
    const tbody = document.getElementById('judge-list-tbody');
    tbody.innerHTML = "";
    
    judgesList.forEach((j, index) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><b>${j.id}</b></td>
            <td>${j.name}</td>
            <td>${j.pass}</td>
            <td>
                <button class="btn-delete" onclick="window.deleteJudge(${index})">
                    <i class="fas fa-trash-alt"></i> Xóa
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
};

window.addJudge = function(e) {
    e.preventDefault();
    const name = document.getElementById('new-judge-name').value.trim();
    const id = document.getElementById('new-judge-id').value.trim();
    const pass = document.getElementById('new-judge-pass').value.trim();

    // Check trùng ID
    if(judgesList.some(j => j.id === id) || id === ADMIN_ACCOUNT.id) {
        alert("Mã Giám khảo này đã tồn tại!");
        return;
    }

    judgesList.push({ id, pass, name });
    localStorage.setItem('vovinamJudges', JSON.stringify(judgesList)); // Lưu vào trình duyệt
    
    alert(`Đã thêm giám khảo: ${name}`);
    document.getElementById('add-judge-form').reset();
    window.renderJudgeManager();
};

window.deleteJudge = function(index) {
    if(confirm(`Bạn có chắc muốn xóa giám khảo ${judgesList[index].name}?`)) {
        judgesList.splice(index, 1);
        localStorage.setItem('vovinamJudges', JSON.stringify(judgesList)); // Cập nhật lưu trữ
        window.renderJudgeManager();
    }
};

// --- HỆ THỐNG CHẤM THI (NHƯ CŨ) ---

window.renderCandidates = function() {
    const tbody = document.getElementById('candidate-list');
    tbody.innerHTML = "";

    const filterClub = document.getElementById('filter-club').value;
    const filterBelt = document.getElementById('filter-belt').value;

    let total = 0, pass = 0, fail = 0;

    const filteredList = mockCandidates.filter(c => {
        const matchClub = filterClub === "ALL" || c.club === filterClub;
        const matchBelt = filterBelt === "ALL" || c.belt === filterBelt;
        return matchClub && matchBelt;
    });

    if(filteredList.length === 0) {
        tbody.innerHTML = `<tr><td colspan="10" style="text-align:center; padding:20px;">Không tìm thấy thí sinh nào.</td></tr>`;
        return;
    }

    filteredList.forEach(c => {
        total++;
        const avg = calculateAverage(c);
        const resultHTML = getResultHTML(c, avg);
        if(c.evaluated) { (avg >= 5) ? pass++ : fail++; }

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><b>${c.sbd}</b></td>
            <td>${c.name}</td>
            <td>${c.club}</td>
            <td><span style="background:#e3f2fd; color:#0055A4; padding:2px 5px; border-radius:3px; font-size:0.85rem; font-weight:bold;">${c.belt}</span></td>
            <td class="score-cell">${c.evaluated ? c.theory : '-'}</td>
            <td class="score-cell">${c.evaluated ? ((parseFloat(c.tech) + parseFloat(c.sparring))/2).toFixed(1) : '-'}</td>
            <td class="score-cell">${c.evaluated ? c.fitness : '-'}</td>
            <td style="font-weight:bold; color:var(--vovinam-blue);">${c.evaluated ? avg : '--'}</td>
            <td>${resultHTML}</td>
            <td>
                <button class="btn-grade" onclick="window.openModal(${c.id})">
                    <i class="fas fa-edit"></i> Chấm
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });

    document.getElementById('stat-total').innerText = total;
    document.getElementById('stat-pass').innerText = pass;
    document.getElementById('stat-fail').innerText = fail;
};

function calculateAverage(c) {
    if(!c.evaluated) return 0;
    const practiceScore = (parseFloat(c.tech) + parseFloat(c.sparring)) / 2;
    const finalAvg = (parseFloat(c.theory) + practiceScore + parseFloat(c.fitness)) / 3;
    return finalAvg.toFixed(1);
}

function getResultHTML(c, avg) {
    if(!c.evaluated) return `<span class="result-pending">Chưa chấm</span>`;
    if(avg >= 5.0 && c.theory > 0 && c.tech > 0 && c.sparring > 0 && c.fitness > 0) {
        return `<span class="result-pass"><i class="fas fa-check"></i> Đạt</span>`;
    } else {
        return `<span class="result-fail"><i class="fas fa-times"></i> Hỏng</span>`;
    }
}

window.openModal = function(id) {
    const candidate = mockCandidates.find(c => c.id === id);
    if(!candidate) return;

    document.getElementById('grade-id').value = id;
    document.getElementById('modal-student-info').innerText = `${candidate.name} (${candidate.sbd}) - ${candidate.belt}`;
    
    document.getElementById('score-theory').value = candidate.evaluated ? candidate.theory : "";
    document.getElementById('score-tech').value = candidate.evaluated ? candidate.tech : "";
    document.getElementById('score-sparring').value = candidate.evaluated ? candidate.sparring : "";
    document.getElementById('score-fitness').value = candidate.evaluated ? candidate.fitness : "";
    document.getElementById('grade-note').value = candidate.note || "";
    document.getElementById('preview-average').innerText = calculateAverage(candidate);

    document.getElementById('modal-grade').style.display = 'block';
};

window.closeModal = function() {
    document.getElementById('modal-grade').style.display = 'none';
};

window.saveGrade = function(e) {
    e.preventDefault();
    const id = parseInt(document.getElementById('grade-id').value);
    // Cập nhật dữ liệu
    const index = mockCandidates.findIndex(c => c.id === id);
    if(index !== -1) {
        mockCandidates[index].theory = document.getElementById('score-theory').value;
        mockCandidates[index].tech = document.getElementById('score-tech').value;
        mockCandidates[index].sparring = document.getElementById('score-sparring').value;
        mockCandidates[index].fitness = document.getElementById('score-fitness').value;
        mockCandidates[index].note = document.getElementById('grade-note').value;
        mockCandidates[index].evaluated = true;
    }
    alert("Đã lưu điểm thành công!");
    window.closeModal();
    window.renderCandidates();
};

// Tính điểm live
const inputs = document.querySelectorAll('.score-item input');
inputs.forEach(input => {
    input.addEventListener('input', () => {
        const t = parseFloat(document.getElementById('score-theory').value) || 0;
        const k = parseFloat(document.getElementById('score-tech').value) || 0;
        const d = parseFloat(document.getElementById('score-sparring').value) || 0;
        const f = parseFloat(document.getElementById('score-fitness').value) || 0;
        const practice = (k + d) / 2;
        const avg = (t + practice + f) / 3;
        document.getElementById('preview-average').innerText = avg.toFixed(1);
    });
});

window.onclick = function(event) {
    const modal = document.getElementById('modal-grade');
    if (event.target == modal) window.closeModal();
}