// [최종] 멧돼지님의 Firebase 설정값 주입 완료
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

// [신규] 고난도 문제 7선
const WEEKLY_QUIZ = [
    { day: 0, text: "[일요일: 수량적 추론]\n1000 미만의 자연수 중에서 3 또는 5의 배수인\n모든 수의 합은 얼마일까요?", ans: "233168", hint: "배수의 합 공식(n(n+1)/2)을 응용해보세요.", exp: "3의 배수의 합 + 5의 배수의 합 - 15의 배수의 합입니다.", src: "Project Euler #1", type: "math" },
    { day: 1, text: "[월요일: 논리 행렬]\n세 개의 상자가 있습니다. 한 곳엔 금, 한 곳엔 은,\n한 곳은 비어있습니다. 단 한 명의 말만 진실입니다.\n금: '은은 여기 없다.', 은: '금은 여기 없다.', 빈 상자: '여기는 비어있다.'\n금은 어느 상자에 있을까요?", ans: "은", hint: "한 명이 진실일 때 나머지 두 명은 거짓이어야 합니다.", exp: "은 상자의 말이 진실일 때만 모순 없이 금이 은 상자에 위치하게 됩니다.", src: "Classical Logic", type: "logic" },
    { day: 2, text: "[화요일: 패턴 인식]\n1, 4, 9, 61, 52, 63...\n다음에 올 숫자는 무엇일까요?", ans: "94", hint: "숫자의 모양을 뒤집어서 읽어보세요.", exp: "제곱수(1, 4, 9, 16, 25, 36)를 뒤집은 수열입니다. 다음은 49를 뒤집은 94입니다.", src: "Numerical Pattern", type: "math" },
    { day: 3, text: "[수요일: 상황 추리]\n한 남자가 바에서 물을 요청하자 바텐더가 총을 겨눴고,\n남자는 '고맙습니다'라며 나갔습니다. 이유는? (세 글자)", ans: "딸꾹질", hint: "바텐더가 남자를 놀라게 한 이유를 생각해보세요.", exp: "총을 보고 놀란 덕분에 딸꾹질이 멈춰서 고마워한 것입니다.", src: "Situation Quiz", type: "situation", keywords: { "총": "남자를 놀라게 하려 했습니다.", "물": "딸꾹질을 멈추려던 초기 계획입니다." } },
    { day: 4, text: "[목요일: 수리 논리]\n머리카락 수가 똑같은 사람이 반드시 존재함을 증명하려면,\n마을 인구는 최소 몇 명 이상이어야 할까요?\n(인간의 최대 머리카락 수는 15만 가닥으로 가정)", ans: "150001", hint: "비둘기집 원리: 상자보다 물건이 많아야 겹칩니다.", exp: "0~15만 가닥까지의 경우의 수보다 1명이 더 많아야 겹칩니다.", src: "Discrete Math", type: "math" },
    { day: 5, text: "[금요일: 공간 지각]\n30m 우물을 올라가는 달팽이가 낮에 3m 오르고,\n밤에 2m 미끄러집니다. 꼭대기 도달까지 며칠 걸릴까요?", ans: "28", hint: "마지막 날 꼭대기에 닿으면 밤에 미끄러지지 않습니다.", exp: "27일까지 27m에 도달하고, 28일 낮에 3m를 더해 탈출합니다.", src: "Classic Puzzle", type: "spatial" },
    { day: 6, text: "[토요일: 제약 충족]\n정육면체의 모든 면을 인접한 면과 겹치지 않게\n색칠할 때 필요한 최소 색깔 수는?", ans: "3", hint: "마주 보는 면끼리 같은 색을 사용할 수 있습니다.", exp: "마주 보는 세 쌍의 면에 각각 다른 색을 칠하면 됩니다.", src: "Geometry Logic", type: "logic" }
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
        else { alert(`오답! 남은 목숨: ${attemptsLeft}개 \n(+30초 추가)`); }
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
    document.getElementById('keyword-hint-area').style.display = 'none';
    document.getElementById('result-area').style.display = 'block';
    canvas.style.display = 'none';
    document.getElementById('memo-tools').style.display = 'none';
    document.getElementById('lives-container').style.display = 'none';

    document.getElementById('result-content-box').innerHTML = `
        <div class="solution-box">
            <p><strong>[정답]</strong> ${quiz.ans}</p>
            <p><strong>[해설]</strong> ${quiz.exp}</p>
        </div>`;
    
    const resultMsg = isWin ? `${nickname}님, 성공! 🎉` : `${nickname}님, 실패... 💀`;
    document.getElementById('result-msg').innerText = `${resultMsg} 기록: ${time}`;
    document.getElementById('result-msg').style.color = isWin ? "#2ecc71" : "#ff4757";

    // 결과 공유 로직 (요청하신 포맷 적용)
    document.getElementById('share-btn').onclick = () => {
        let attemptVisual = "";
        if (isWin) {
            if (attemptsLeft === 3) attemptVisual = "🟦🟦🟦";
            else if (attemptsLeft === 2) attemptVisual = "🟦🟦🟥";
            else if (attemptsLeft === 1) attemptVisual = "🟦🟥🟥";
        } else { attemptVisual = "🟥🟥🟥"; }

        const shareText = `[시냅스 스파크] ⚡${streak}\n\n${attemptVisual} (${time})\n\n함께해요! : https://synapsespark.netlify.app/`;
        navigator.clipboard.writeText(shareText).then(() => alert("성과가 복사되었습니다!"));
    };
}

document.getElementById('keyword-btn').onclick = () => {
    const input = document.getElementById('keyword-input').value.trim();
    const quiz = WEEKLY_QUIZ.find(q => q.day === new Date().getDay());
    document.getElementById('keyword-response').innerText = quiz.keywords && quiz.keywords[input] ? `"${input}": ${quiz.keywords[input]}` : "관련 없음.";
};
document.getElementById('hint-btn').onclick = () => {
    const quiz = WEEKLY_QUIZ.find(q => q.day === new Date().getDay());
    document.getElementById('hint-display').innerText = "💡 사고 가이드: " + quiz.hint;
    document.getElementById('hint-display').style.display = 'block';
    hintUsed = true;
};
