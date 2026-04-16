let startTime, timerInterval, nickname = "", hintUsed = false, drawColor = "#4a90e2";
let attemptsLeft = 3;
const PENALTY_TIME = 30000;
const CURRENT_DATE = new Date().toLocaleDateString();

// 요일별 다각화된 인지 자극 문제 세트 [cite: 133]
const WEEKLY_QUIZ = [
    { 
        day: 0, 
        text: "[일요일: 수량적 추론]\n1부터 10까지의 모든 자연수로 나누어 떨어지는\n가장 작은 양의 정수는 무엇일까요?", 
        ans: "2520", 
        guide: "숫자만 입력하세요",
        hint: "모든 수의 소인수 분해 결과 중 최대 지수들을 곱하여 구하는 원리를 활용하세요.", 
        exp: "이 문제는 수학적 통찰력을 요구하는 최소공배수(LCM) 구하기입니다. 1부터 10까지 각 숫자의 소인수 중 지수가 가장 큰 것(2³, 3², 5, 7)을 모두 곱하면 2520이 됩니다.", 
        src: "Project Euler #5 수론 모델 [cite: 81]", type: "math" 
    },
    { 
        day: 1, 
        text: "[월요일: 논리 행렬]\n단 한 명만 진실을 말합니다.\nA: 'B는 거짓말쟁이다.'\nB: 'C는 거짓말쟁이다.'\nC: 'A와 B는 모두 거짓말쟁이다.'\n진실을 말하는 자는 누구입니까?", 
        ans: "B", 
        guide: "대문자 알파벳 한 글자로 입력하세요 (A/B/C)",
        hint: "B가 진실이라고 가정했을 때 발생하는 논리적 정합성을 검토해보세요.", 
        exp: "B가 진실이라면 A와 C의 주장은 모두 거짓이 되어 조건에 완벽히 부합합니다. 이는 고차원적인 규칙 추출(Rule Induction)을 요구하는 논리 퍼즐입니다[cite: 15].", 
        src: "Mensa 유동 지능 측정 모델 [cite: 8]", type: "logic" 
    },
    { 
        day: 2, 
        text: "[화요일: 수리 패턴]\n2, 5, 11, 23, 47...\n다음에 올 숫자는 무엇일까요?", 
        ans: "95", 
        guide: "숫자만 입력하세요",
        hint: "각 항이 이전 항의 크기에 따라 기하급수적으로 늘어나는 규칙을 찾으세요.", 
        exp: "이전 숫자에 2를 곱하고 1을 더하는 규칙($2n+1$)을 따릅니다. 이러한 수치 패턴 인식은 지능 측정의 표준 요소입니다[cite: 16].", 
        src: "인지 측정 표준 시각적 패턴 분석 [cite: 22]", type: "math" 
    },
    { 
        day: 3, 
        text: "[수요일: 상황 추리]\n남자는 비가 오지 않는 날에는 엘리베이터를\n7층까지만 타고 내려서 나머지는 걸어 올라갑니다.\n이유는 무엇일까요? (두 글자 단어)", 
        ans: "단신", 
        guide: "두 글자 단어로 입력하세요",
        hint: "남자의 신체적 제약과 비 오는 날에만 휴대하는 도구의 길이를 연계하세요.", 
        exp: "전형적인 '수평적 사고(Lateral Thinking)' 문제입니다. 키가 작아 평소엔 버튼에 손이 닿지 않지만, 비 오는 날엔 우산 끝으로 누를 수 있다는 비전형적 해결책이 핵심입니다[cite: 55, 60].", 
        src: "Edward de Bono 수평적 사고 이론 [cite: 60]", type: "situation", keywords: { "키": "결정적인 신체 단서입니다.", "우산": "긴 도구로서 버튼 조작을 돕습니다.", "버튼": "손이 닿기엔 물리적으로 높습니다." } 
    },
    { 
        day: 4, 
        text: "[목요일: 수학적 통찰]\n100 미만의 자연수 중에서 3의 배수이거나\n5의 배수인 모든 수의 총합은 얼마일까요?", 
        ans: "2318", 
        guide: "숫자만 입력하세요",
        hint: "중복 계산되는 15의 배수를 어떻게 처리할지가 핵심입니다.", 
        exp: "수학적 알고리즘 설계 능력을 묻는 문제입니다. 3의 배수의 합과 5의 배수의 합을 더한 뒤, 두 번 더해진 15의 배수의 합을 빼면 2318에 도달합니다[cite: 84].", 
        src: "Project Euler #1 기반 알고리즘 문제 [cite: 84]", type: "math" 
    },
    { 
        day: 5, 
        text: "[금요일: 공간 지각]\n주사위의 마주 보는 면의 합은 항상 7입니다.\n위가 1, 정면이 2인 상태에서 오른쪽으로 한 번,\n앞으로 한 번 굴렸을 때 윗면은?", 
        ans: "5", 
        guide: "숫자만 입력하세요",
        hint: "굴릴 때마다 바닥면으로 이동하는 면과 위로 올라오는 면을 정신적으로 시뮬레이션하세요.", 
        exp: "공간 지각력 중 '정신적 회전' 능력을 테스트합니다. 오른쪽(위:4) -> 앞(위:5)으로 변하는 공간적 변환 과정을 유추해야 합니다[cite: 16].", 
        src: "공간 내 도형의 회전 및 변형 측정 모델 [cite: 24]", type: "spatial" 
    },
    { 
        day: 6, 
        text: "[토요일: 제약 충족]\n머리카락 수가 똑같은 사람이 반드시 존재함을 증명하려면,\n마을 인구는 최소 몇 명 이상이어야 할까요?\n(인간의 최대 머리카락 수는 15만 가닥으로 가정)", 
        ans: "150002", 
        guide: "숫자만 입력하세요",
        hint: "머리카락 수가 0가닥부터 15만 가닥까지 가능한 총 경우의 수를 생각해보세요.", 
        exp: "조합론의 기초인 '비둘기집 원리'를 응용한 제약 충족 문제입니다. 가능한 모든 경우의 수(150,001)보다 한 명 더 많아야 중복이 반드시 발생합니다[cite: 30].", 
        src: "수학적 통찰 및 제약 충족 이론 [cite: 30]", type: "math" 
    }
];

const canvas = document.getElementById('memo-canvas');
const ctx = canvas.getContext('2d');
let isDrawing = false;

window.onload = () => { updateStreakDisplay(); checkDateAndReset(); displayRanking(); resizeCanvas(); };
window.addEventListener('resize', resizeCanvas);

function resizeCanvas() {
    const wrapper = document.getElementById('memo-wrapper');
    if (wrapper) { canvas.width = wrapper.offsetWidth; canvas.height = wrapper.offsetHeight; resetCtx(); }
}
function resetCtx() { ctx.strokeStyle = drawColor; ctx.lineWidth = 2; ctx.lineCap = "round"; }

function updateStreakDisplay() {
    let streak = parseInt(localStorage.getItem('streakCount')) || 0;
    const lastDate = localStorage.getItem('lastSolveDate');
    if (lastDate && lastDate !== CURRENT_DATE) {
        const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
        if (lastDate !== yesterday.toLocaleDateString()) { streak = 0; localStorage.setItem('streakCount', 0); }
    }
    document.getElementById('streak-count').innerText = streak;
}

function updateLivesDisplay() {
    const hearts = document.querySelectorAll('.heart');
    hearts.forEach((heart, index) => { heart.innerText = index < attemptsLeft ? "❤️" : "🖤"; });
}

document.querySelectorAll('.color-dot').forEach(dot => {
    dot.onclick = (e) => {
        document.querySelector('.color-dot.active').classList.remove('active');
        e.target.classList.add('active');
        drawColor = e.target.dataset.color;
        resetCtx();
    };
});
canvas.onmousedown = (e) => { isDrawing = true; ctx.beginPath(); ctx.moveTo(e.offsetX, e.offsetY); };
canvas.onmousemove = (e) => { if (isDrawing) { ctx.lineTo(e.offsetX, e.offsetY); ctx.stroke(); } };
canvas.onmouseup = () => isDrawing = false;
document.getElementById('clear-memo-btn').onclick = () => ctx.clearRect(0, 0, canvas.width, canvas.height);

document.getElementById('start-btn').onclick = () => {
    nickname = document.getElementById('nickname').value.trim();
    if (!nickname) return alert("부팅을 위해 닉네임을 입력해주세요!");
    attemptsLeft = 3; 
    updateLivesDisplay();
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('quiz-screen').style.display = 'block';
    const quiz = WEEKLY_QUIZ.find(q => q.day === new Date().getDay());
    document.getElementById('problem-text').innerText = quiz.text;
    document.getElementById('answer').placeholder = quiz.guide;
    if (quiz.type === "situation") document.getElementById('keyword-hint-area').style.display = 'block';
    startTime = Date.now();
    timerInterval = setInterval(() => {
        const diff = new Date(Date.now() - startTime);
        document.getElementById('timer').innerText = diff.toISOString().substr(11, 8);
    }, 1000);
    resizeCanvas();
};

document.getElementById('keyword-btn').onclick = () => {
    const input = document.getElementById('keyword-input').value.trim();
    const quiz = WEEKLY_QUIZ.find(q => q.day === new Date().getDay());
    document.getElementById('keyword-response').innerText = quiz.keywords && quiz.keywords[input] ? `"${input}": ${quiz.keywords[input]}` : "관련성이 낮습니다.";
    hintUsed = true;
};

document.getElementById('hint-btn').onclick = () => {
    const quiz = WEEKLY_QUIZ.find(q => q.day === new Date().getDay());
    document.getElementById('hint-display').innerText = "💡 사고 가이드: " + quiz.hint;
    document.getElementById('hint-display').style.display = 'block';
    hintUsed = true;
};

document.getElementById('submit-btn').onclick = () => {
    const quiz = WEEKLY_QUIZ.find(q => q.day === new Date().getDay());
    if (document.getElementById('answer').value.trim() === quiz.ans) {
        clearInterval(timerInterval);
        processEnd(quiz, true);
    } else {
        attemptsLeft--;
        updateLivesDisplay();
        startTime -= PENALTY_TIME;
        document.querySelector('.container').classList.add('shake');
        setTimeout(() => document.querySelector('.container').classList.remove('shake'), 300);
        if (attemptsLeft === 0) {
            clearInterval(timerInterval);
            processEnd(quiz, false);
        } else {
            alert(`오답입니다! \n남은 목숨: ${attemptsLeft}개 \n(+30초가 추가되었습니다)`);
        }
    }
};

function processEnd(quiz, isWin) {
    const time = document.getElementById('timer').innerText;
    let streak = parseInt(localStorage.getItem('streakCount')) || 0;
    if (isWin) {
        if (localStorage.getItem('lastSolveDate') !== CURRENT_DATE) {
            streak++; localStorage.setItem('streakCount', streak);
            localStorage.setItem('lastSolveDate', CURRENT_DATE);
        }
        saveRanking(nickname, time);
    } else { streak = 0; localStorage.setItem('streakCount', 0); }
    document.getElementById('input-area').style.display = 'none';
    document.getElementById('hint-area').style.display = 'none';
    document.getElementById('keyword-hint-area').style.display = 'none';
    document.getElementById('result-area').style.display = 'block';
    canvas.style.display = 'none';
    document.getElementById('memo-tools').style.display = 'none';
    document.getElementById('lives-container').style.display = 'none';
    document.getElementById('result-content-box').innerHTML = `
        <div class="solution-box">
            <p><strong>[정답]</strong> ${quiz.ans}</p>
            <p><strong>[해설]</strong> ${quiz.exp}</p>
            <p><strong>[출처]</strong> ${quiz.src}</p>
        </div>`;
    const resultColor = isWin ? "#2ecc71" : "#ff4757";
    const resultMsg = isWin ? `${nickname}님, 부팅 성공! 🎉` : `${nickname}님, 부팅 실패... 💀`;
    const emoji = isWin ? (hintUsed ? "💡 (사고의 도움)" : "🔥 (완전한 통찰)") : "🌑 (내일 다시 도전)";
    const msgElement = document.getElementById('result-msg');
    msgElement.innerText = `${resultMsg} 기록: ${time} ${emoji}`;
    msgElement.style.color = resultColor;
    document.getElementById('share-btn').onclick = () => {
        const shareEmoji = isWin ? (hintUsed ? "💡" : "🔥") : "🌑";
        const shareText = `[시냅스 스파크] #${streak}번째 부팅\n기록: ${time}\n상태: ${shareEmoji}\n함께해요! : https://synapsespark.net/`;
        navigator.clipboard.writeText(shareText).then(() => alert("오늘의 성과가 복사되었습니다!"));
    };
}

function saveRanking(n, t) {
    let d = JSON.parse(localStorage.getItem('dailyRanking')) || [];
    d.push({ name: n, time: t }); d.sort((a,b) => a.time.localeCompare(b.time));
    localStorage.setItem('dailyRanking', JSON.stringify(d.slice(0, 10)));
    displayRanking();
}

function displayRanking() {
    const r = JSON.parse(localStorage.getItem('dailyRanking')) || [];
    document.getElementById('ranking-list').innerHTML = r.length ? r.map((i, idx) => `<li><span><strong>${idx+1}. ${i.name}</strong></span> <span>${i.time}</span></li>`).join('') : "<li>아직 도전자가 없습니다.</li>";
}

function checkDateAndReset() { if (localStorage.getItem('lastAccessDate') !== CURRENT_DATE) { localStorage.removeItem('dailyRanking'); localStorage.setItem('lastAccessDate', CURRENT_DATE); } }
