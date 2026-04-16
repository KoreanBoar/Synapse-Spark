// [최종 마스터] Firebase 및 동적 주소 공유 로직
const firebaseConfig = {
    apiKey: "AIzaSyCbLpF-2URkZFTQsdpyQ8_9bVbT3PDWdYk",
    authDomain: "synapse-spark-34210.firebaseapp.com",
    databaseURL: "https://synapse-spark-34210-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "synapse-spark-34210",
    storageBucket: "synapse-spark-34210.firebasestorage.app",
    messagingSenderId: "481210459623",
    appId: "1:481210459623:web:a3f848f6fe350398d94942",
    measurementId: "G-LWDC3JDPKG"
};

firebase.initializeApp(firebaseConfig);
const database = firebase.database();

let startTime, timerInterval, nickname = "", hintUsed = false, drawColor = "#4a90e2";
let attemptsLeft = 3;
const PENALTY_TIME = 30000;
const CURRENT_DATE = new Date().toLocaleDateString();

const WEEKLY_QUIZ = [
    { day: 0, text: "[일요일: 수량적 추론]\n1000 미만의 자연수 중에서 3 또는 5의 배수인\n모든 수의 합은 얼마일까요?", ans: "233168", hint: "포함-배제의 원리를 이용해보세요.", exp: "3의 배수의 합 + 5의 배수의 합 - 15의 배수의 합 = 233,168입니다.", src: "Project Euler", type: "math" },
    { day: 1, text: "[월요일: 논리 행렬]\n세 상자 중 하나에만 금이 있고, 한 명만 진실입니다.\n금: '은은 여기 없다.', 은: '금은 여기 없다.', 빈 상자: '여기는 비어있다.'\n금은 어느 상자에 있나요?", ans: "은", hint: "가정법을 사용하여 모순을 찾아보세요.", exp: "은 상자의 말이 진실일 때만 논리적으로 완벽하게 성립합니다.", src: "Classic Logic", type: "logic" },
    { day: 2, text: "[화요일: 패턴 인식]\n1, 4, 9, 61, 52, 63...\n다음에 올 숫자는 무엇일까요?", ans: "94", hint: "숫자를 뒤집어서(거꾸로) 생각해보세요.", exp: "제곱수(16, 25, 36)를 뒤집은 것입니다. 다음은 49를 뒤집은 94입니다.", src: "Pattern", type: "math" },
    { day: 3, text: "[수요일: 상황 추리]\n바에서 물을 요청하자 바텐더가 총을 겨눴고,\n남자는 '고맙습니다'라며 나갔습니다. 이유는? (세 글자)", ans: "딸꾹질", hint: "남자가 물을 원했던 초기 목적을 생각해보세요.", exp: "총으로 놀래켜 딸꾹질을 멈춰주자 감사 인사를 하고 나간 것입니다.", src: "Situation Quiz", type: "situation", keywords: { "총": "놀라게 함", "물": "딸꾹질용" } },
    { day: 4, text: "[목요일: 수리 논리]\n머리카락 수가 똑같은 사람이 반드시 존재함을 증명하려면,\n최소 인구는 몇 명이어야 할까요? (최대 15만 가닥 가정)", ans: "150001", hint: "비둘기집 원리: 경우의 수보다 인구가 1명 더 많아야 합니다.", exp: "가능한 경우(0~15만)보다 1명 많은 150,001명이 모여야 겹칩니다.", src: "Math", type: "math" },
    { day: 5, text: "[금요일: 공간 지각]\n30m 우물을 달팽이가 낮에 3m 오르고, 밤에 2m 미끄러집니다.\n꼭대기에 닿는 데 걸리는 일수는?", ans: "28", hint: "마지막 날은 미끄러지지 않는다는 점에 유의하세요.", exp: "27일까지 25m 도달 후, 28일 낮에 3m를 더해 30m 탈출에 성공합니다.", src: "Classic Puzzle", type: "spatial" },
    { day: 6, text: "[토요일: 제약 충족]\n정육면체의 면을 칠할 때 인접한 면의 색이 달라야 합니다.\n필요한 최소 색깔의 수는?", ans: "3", hint: "마주 보는 면끼리는 같은 색을 칠할 수 있습니다.", exp: "마주 보는 세 쌍의 면에 각각 칠하면 최소 3색으로 가능합니다.", src: "Geometry", type: "logic" }
];

const canvas = document.getElementById('memo-canvas');
const ctx = canvas.getContext('2d');
let isDrawing = false;

window.onload = () => { updateStreakDisplay(); displayGlobalRanking(); resizeCanvas(); };
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

document.getElementById('start-btn').onclick = () => {
    nickname = document.getElementById('nickname').value.trim();
    if (!nickname) return alert("닉네임을 입력해주세요!");
    attemptsLeft = 3; updateLivesDisplay();
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

document.getElementById('submit-btn').onclick = () => {
    const quiz = WEEKLY_QUIZ.find(q => q.day === new Date().getDay());
    if (document.getElementById('answer').value.trim() === quiz.ans) {
        clearInterval(timerInterval);
        processEnd(quiz, true);
    } else {
        attemptsLeft--; updateLivesDisplay();
        startTime -= PENALTY_TIME;
        document.querySelector('.container').classList.add('shake');
        setTimeout(() => document.querySelector('.container').classList.remove('shake'), 300);
        if (attemptsLeft === 0) { clearInterval(timerInterval); processEnd(quiz, false); }
        else { alert(`오답! 남은 목숨: ${attemptsLeft}개`); }
    }
};

function saveToFirebase(n, t) {
    const dateKey = CURRENT_DATE.replace(/\./g, "-").replace(/ /g, "");
    database.ref('rankings/' + dateKey).push({ name: n, time: t, timestamp: Date.now() });
}

function displayGlobalRanking() {
    const dateKey = CURRENT_DATE.replace(/\./g, "-").replace(/ /g, "");
    database.ref('rankings/' + dateKey).orderByChild('time').limitToFirst(10).on('value', (snapshot) => {
        const rankingList = document.getElementById('ranking-list');
        rankingList.innerHTML = "";
        const data = snapshot.val();
        if (data) {
            const sorted = Object.values(data).sort((a, b) => a.time.localeCompare(b.time));
            sorted.forEach((item, idx) => {
                const li = document.createElement('li');
                li.innerHTML = `<span><strong>${idx+1}. ${item.name}</strong></span> <span>${item.time}</span>`;
                rankingList.appendChild(li);
            });
        } else { rankingList.innerHTML = "<li>첫 도전자가 되어보세요!</li>"; }
    });
}

function processEnd(quiz, isWin) {
    const time = document.getElementById('timer').innerText;
    let streak = parseInt(localStorage.getItem('streakCount')) || 0;
    if (isWin) {
        saveToFirebase(nickname, time);
        if (localStorage.getItem('lastSolveDate') !== CURRENT_DATE) {
            streak++; localStorage.setItem('streakCount', streak);
            localStorage.setItem('lastSolveDate', CURRENT_DATE);
        }
    } else { streak = 0; localStorage.setItem('streakCount', 0); }
    
    document.getElementById('input-area').style.display = 'none';
    document.getElementById('hint-area').style.display = 'none';
    document.getElementById('result-area').style.display = 'block';
    canvas.style.display = 'none';
    document.getElementById('memo-tools').style.display = 'none';

    document.getElementById('result-content-box').innerHTML = `
        <div class="solution-box">
            <p><strong>[정답]</strong> ${quiz.ans}</p>
            <p><strong>[해설]</strong> ${quiz.exp}</p>
        </div>`;
    
    const resultMsg = isWin ? `${nickname}님, 성공! 🎉` : `${nickname}님, 실패... 💀`;
    document.getElementById('result-msg').innerText = `${resultMsg} 기록: ${time}`;
    document.getElementById('result-msg').style.color = isWin ? "#2ecc71" : "#ff4757";

    document.getElementById('share-btn').onclick = () => {
        let attemptVisual = "";
        if (isWin) {
            if (attemptsLeft === 3) attemptVisual = "🟦🟦🟦";
            else if (attemptsLeft === 2) attemptVisual = "🟦🟦🟥";
            else if (attemptsLeft === 1) attemptVisual = "🟦🟥🟥";
        } else { attemptVisual = "🟥🟥🟥"; }

        // [자동 감지 주소] 이제 주소를 수동으로 적지 않아도 현재 주소를 가져옵니다.
        const currentUrl = window.location.href;
        const shareText = `[시냅스 스파크] ⚡${streak}\n\n${attemptVisual} (${time})\n\n함께해요! : ${currentUrl}`;
        navigator.clipboard.writeText(shareText).then(() => alert("성과가 복사되었습니다!"));
    };
}

// 메모장 기능
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
document.getElementById('keyword-btn').onclick = () => {
    const input = document.getElementById('keyword-input').value.trim();
    const quiz = WEEKLY_QUIZ.find(q => q.day === new Date().getDay());
    document.getElementById('keyword-response').innerText = quiz.keywords && quiz.keywords[input] ? `"${input}": ${quiz.keywords[input]}` : "관련 없음.";
};
document.getElementById('hint-btn').onclick = () => {
    const quiz = WEEKLY_QUIZ.find(q => q.day === new Date().getDay());
    document.getElementById('hint-display').innerText = "💡 사고 가이드: " + quiz.hint;
    document.getElementById('hint-display').style.display = 'block';
};
