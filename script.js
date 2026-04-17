// Firebase 설정 (기존 키 유지)
const firebaseConfig = {
    apiKey: "AIzaSyCbLpF-2URkZFTQsdpyQ8_9bVbT3PDWdYk",
    authDomain: "synapse-spark-34210.firebaseapp.com",
    databaseURL: "https://synapse-spark-34210-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "synapse-spark-34210",
    storageBucket: "synapse-spark-34210.firebasestorage.app",
    messagingSenderId: "481210459623",
    appId: "1:481210459623:web:a3f848f6fe350398d94942",
    measurementId: "G-D73KL470HQ"
};

firebase.initializeApp(firebaseConfig);
const database = firebase.database();

let startTime, timerInterval, nickname = "", currentQuiz = null;
let attemptsLeft = 3;
const PENALTY_TIME = 30000;
const TODAY_KEY = new Date().toISOString().split('T')[0];

// 퀴즈 데이터 로드 (DB 최상단 날짜 노드 참조)
async function fetchTodayQuiz() {
    return new Promise((resolve) => {
        database.ref(TODAY_KEY).once('value', (snapshot) => {
            const quiz = snapshot.val();
            if (quiz) resolve(quiz);
            else resolve({ text: "[부팅 오류] 오늘 날짜의 문제가 없습니다.", ans: "관리자", guide: "DB를 확인하세요." });
        });
    });
}

window.onload = () => { updateStreakDisplay(); displayGlobalRanking(); resizeCanvas(); };
window.addEventListener('resize', resizeCanvas);

// 메모장 캔버스 로직
const canvas = document.getElementById('memo-canvas');
const ctx = canvas.getContext('2d');
let isDrawing = false, drawColor = "#4a90e2";

function resizeCanvas() {
    const wrapper = document.getElementById('memo-wrapper');
    if (wrapper) { canvas.width = wrapper.offsetWidth; canvas.height = wrapper.offsetHeight; resetCtx(); }
}
function resetCtx() { ctx.strokeStyle = drawColor; ctx.lineWidth = 2; ctx.lineCap = "round"; }

// 시작 버튼 클릭
document.getElementById('start-btn').onclick = async () => {
    nickname = document.getElementById('nickname').value.trim();
    if (!nickname) return alert("닉네임을 입력해주세요!");
    
    currentQuiz = await fetchTodayQuiz();
    
    // GA4 이벤트
    gtag('event', 'quiz_start', { 'nickname': nickname, 'quiz_date': TODAY_KEY });

    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('quiz-screen').style.display = 'block';
    document.getElementById('problem-text').innerText = currentQuiz.text;
    
    if (currentQuiz.guide) {
        document.getElementById('answer-guide').innerText = "💡 가이드: " + currentQuiz.guide;
    }

    startTime = Date.now();
    timerInterval = setInterval(() => {
        const diff = new Date(Date.now() - startTime);
        document.getElementById('timer').innerText = diff.toISOString().substr(11, 8);
    }, 1000);
    resizeCanvas();
};

// 제출 버튼 클릭 (지능형 정답 엔진)
document.getElementById('submit-btn').onclick = () => {
    const userInput = document.getElementById('answer').value.trim();
    if (!userInput) return;

    const isCorrect = checkAnswer(userInput, currentQuiz.ans);

    if (isCorrect) {
        clearInterval(timerInterval);
        processEnd(true);
    } else {
        attemptsLeft--;
        updateLivesDisplay();
        startTime -= PENALTY_TIME; // 30초 추가
        showPenaltyMsg();
        
        document.querySelector('.container').classList.add('shake');
        setTimeout(() => document.querySelector('.container').classList.remove('shake'), 300);
        
        gtag('event', 'quiz_wrong_answer', { 'attempts_left': attemptsLeft });
        if (attemptsLeft === 0) { clearInterval(timerInterval); processEnd(false); }
    }
};

// [핵심] 지능형 정답 체크 함수
function checkAnswer(input, target) {
    const options = target.split('|').map(opt => opt.trim());
    return options.some(option => {
        if (option.includes(',')) {
            const keywords = option.split(',').map(k => k.trim());
            return keywords.every(key => input.includes(key));
        }
        return input === option;
    });
}

function showPenaltyMsg() {
    const overlay = document.getElementById('penalty-overlay');
    overlay.style.display = 'block';
    setTimeout(() => { overlay.style.display = 'none'; }, 1000);
}

function processEnd(isWin) {
    const time = document.getElementById('timer').innerText;
    let streak = parseInt(localStorage.getItem('streakCount')) || 0;
    
    if (isWin) {
        saveToFirebase(nickname, time);
        gtag('event', 'quiz_success', { 'time_taken': time, 'streak': streak + 1 });
        if (localStorage.getItem('lastSolveDate') !== TODAY_KEY) {
            streak++; localStorage.setItem('streakCount', streak);
            localStorage.setItem('lastSolveDate', TODAY_KEY);
        }
    } else { 
        streak = 0; localStorage.setItem('streakCount', 0); 
        gtag('event', 'quiz_fail', { 'quiz_date': TODAY_KEY });
    }

    document.getElementById('input-container').style.display = 'none';
    document.getElementById('hint-area').style.display = 'none';
    document.getElementById('result-area').style.display = 'block';
    canvas.style.display = 'none';

    // 해설 줄바꿈 및 수식($) 처리
    const formattedExp = currentQuiz.exp.split('\n').map(line => {
        if (line.includes('$')) return `<div class="formula">${line.replace(/\$/g, '')}</div>`;
        return `<p>${line}</p>`;
    }).join('');

    const displayAnswer = currentQuiz.ans.split('|')[0].trim();
    document.getElementById('result-content-box').innerHTML = `
        <div class="solution-box">
            <strong>[정답] ${displayAnswer}</strong>
            ${formattedExp}
        </div>`;

    document.getElementById('result-msg').innerText = isWin ? `${nickname}님, 성공! 🎉` : `${nickname}님, 실패... 💀`;
    document.getElementById('result-msg').style.color = isWin ? "#2ecc71" : "#ff4757";
    
    document.getElementById('share-btn').onclick = () => {
        gtag('event', 'share_clicked', { 'status': isWin ? 'success' : 'fail' });
        let attemptVisual = isWin ? (attemptsLeft === 3 ? "🟦🟦🟦" : (attemptsLeft === 2 ? "🟦🟦🟥" : "🟦🟥🟥")) : "🟥🟥🟥";
        const shareText = `[시냅스 스파크] ⚡${streak}\n\n${attemptVisual} (${time})\n\n함께해요! : ${window.location.href}`;
        navigator.clipboard.writeText(shareText).then(() => alert("성과가 복사되었습니다!"));
    };
}

// 랭킹 저장 및 표시 (기존 유지)
function saveToFirebase(n, t) {
    const dateKey = TODAY_KEY.replace(/-/g, "");
    const durationMs = Date.now() - startTime;
    database.ref('rankings/' + dateKey).push({
        name: n, time: t, duration: durationMs,
        timestamp: firebase.database.ServerValue.TIMESTAMP
    });
}

function displayGlobalRanking() {
    const dateKey = TODAY_KEY.replace(/-/g, "");
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

function updateStreakDisplay() {
    let streak = parseInt(localStorage.getItem('streakCount')) || 0;
    document.getElementById('streak-count').innerText = streak;
}
function updateLivesDisplay() {
    const hearts = document.querySelectorAll('.heart');
    hearts.forEach((heart, index) => { heart.innerText = index < attemptsLeft ? "❤️" : "🖤"; });
}

// 캔버스 드로잉 이벤트
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

document.getElementById('hint-btn').onclick = () => {
    gtag('event', 'use_hint', { 'quiz_date': TODAY_KEY });
    document.getElementById('hint-display').innerText = "💡 사고 가이드: " + currentQuiz.hint;
    document.getElementById('hint-display').style.display = 'block';
};
