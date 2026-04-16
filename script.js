let startTime, timerInterval, nickname = "", hintUsed = false, drawColor = "#4a90e2";
let attemptsLeft = 3;
const PENALTY_TIME = 30000;
const CURRENT_DATE = new Date().toLocaleDateString();

const WEEKLY_QUIZ = [
    { day: 0, text: "[일요일: 수량적 추론]\n1부터 10까지의 모든 자연수로 나누어 떨어지는\n가장 작은 양의 정수는 무엇일까요?", ans: "2520", hint: "최소공배수 원리를 적용해보세요.", exp: "1~10의 최소공배수는 2520입니다.", src: "Project Euler #5", type: "math" },
    { day: 1, text: "[월요일: 논리 행렬]\n한 명만 진실을 말합니다.\nA: 'B는 거짓이다.', B: 'C는 거짓이다.', C: 'A,B 모두 거짓이다.'\n진실을 말하는 자는?", ans: "B", hint: "B가 진실일 때 모순이 없는지 보세요.", exp: "B가 진실이면 A, C는 거짓이 되어 완벽합니다.", src: "Mensa 논리", type: "logic" },
    { day: 2, text: "[화요일: 패턴 인식]\n2, 5, 11, 23, 47...\n다음에 올 숫자는?", ans: "95", hint: "2n+1 규칙을 생각하세요.", exp: "47*2+1 = 95입니다.", src: "수치 패턴", type: "math" },
    { day: 3, text: "[수요일: 상황 추리]\n남자는 맑은 날엔 엘리베이터를 7층까지만 탑니다.\n이유는 무엇일까요? (두 글자)", ans: "단신", hint: "남자의 키와 비 오는 날의 도구(우산)를 생각하세요.", exp: "키가 작아 버튼에 안 닿지만 우산으로는 누를 수 있습니다.", src: "Lateral Thinking", type: "situation", keywords: { "키": "결정적 단서입니다.", "우산": "긴 도구입니다." } },
    { day: 4, text: "[목요일: 수리 논리]\n악수가 총 66번 일어났다면\n모임에 참석한 인원은 몇 명입니까?", ans: "12", hint: "n(n-1)/2 공식을 활용하세요.", exp: "12*11/2 = 66이므로 12명입니다.", src: "조합론", type: "math" },
    { day: 5, text: "[금요일: 공간 지각]\n위가 1, 정면이 2인 주사위를\n우측으로 한 번, 앞으로 한 번 굴렸을 때 윗면은?", ans: "5", hint: "면의 이동을 시뮬레이션하세요.", exp: "우측으로 굴리면 4, 앞으로 굴리면 5가 위로 옵니다.", src: "공간 지각력", type: "spatial" },
    { day: 6, text: "[토요일: 제약 충족]\n8개 동전 중 가짜 1개를 단 2번의 저울질로 찾으려면\n필요한 최소 저울질 횟수는?", ans: "2", hint: "3개 그룹으로 나누어 비교하세요.", exp: "3, 3, 2로 나누면 2번 만에 가능합니다.", src: "Constraint Satisfaction", type: "logic" }
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
    if (!nickname) return alert("닉네임을 입력해주세요!");
    attemptsLeft = 3; 
    updateLivesDisplay();
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('quiz-screen').style.display = 'block';
    const quiz = WEEKLY_QUIZ.find(q => q.day === new Date().getDay());
    document.getElementById('problem-text').innerText = quiz.text;
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
    document.getElementById('keyword-response').innerText = quiz.keywords && quiz.keywords[input] ? `"${input}": ${quiz.keywords[input]}` : "관련 없음.";
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
        if (attemptsLeft === 0) { clearInterval(timerInterval); processEnd(quiz, false); }
        else { alert(`오답입니다! \n남은 목숨: ${attemptsLeft}개 \n(+30초 추가)`); }
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
    const resultMsg = isWin ? `${nickname}님, 성공! 🎉` : `${nickname}님, 실패... 💀`;
    const emoji = isWin ? (hintUsed ? "💡" : "🔥") : "🌑";
    
    const msgElement = document.getElementById('result-msg');
    msgElement.innerText = `${resultMsg} 기록: ${time} ${emoji}`;
    msgElement.style.color = resultColor;

    document.getElementById('share-btn').onclick = () => {
        const shareEmoji = isWin ? (hintUsed ? "💡" : "🔥") : "🌑";
        const shareText = `[시냅스 스파크] #${streak}번째 부팅\n결과: ${isWin ? '성공' : '실패'} ${shareEmoji}\n함께해요! : https://synapsespark.netlify.app/`;
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
