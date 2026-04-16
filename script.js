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
const TODAY_KEY = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

// [수정] 멧돼지님 DB 구조에 맞게 경로 최적화
async function fetchTodayQuiz() {
    return new Promise((resolve) => {
        // DB 최상단에서 바로 날짜 키값을 찾습니다.
        database.ref(TODAY_KEY).once('value', (snapshot) => {
            const quiz = snapshot.val();
            if (quiz) {
                resolve(quiz);
            } else {
                resolve({ 
                    text: "[데이터 매칭 오류]\n서버에서 오늘 날짜(" + TODAY_KEY + ")의 문제를 찾을 수 없습니다.\nDB의 날짜 형식을 확인해주세요.", 
                    ans: "에러", 
                    exp: "DB의 날짜 키값과 TODAY_KEY가 일치해야 합니다.",
                    hint: "서버 데이터를 점검하세요."
                });
            }
        });
    });
}

window.onload = () => { updateStreakDisplay(); displayGlobalRanking(); resizeCanvas(); };
window.addEventListener('resize', resizeCanvas);

const canvas = document.getElementById('memo-canvas');
const ctx = canvas.getContext('2d');
let isDrawing = false, drawColor = "#4a90e2";

function resizeCanvas() {
    const wrapper = document.getElementById('memo-wrapper');
    if (wrapper) { canvas.width = wrapper.offsetWidth; canvas.height = wrapper.offsetHeight; resetCtx(); }
}
function resetCtx() { ctx.strokeStyle = drawColor; ctx.lineWidth = 2; ctx.lineCap = "round"; }

document.getElementById('start-btn').onclick = async () => {
    nickname = document.getElementById('nickname').value.trim();
    if (!nickname) return alert("닉네임을 입력해주세요!");
    
    currentQuiz = await fetchTodayQuiz();
    
    gtag('event', 'quiz_start', { 'nickname': nickname, 'quiz_date': TODAY_KEY });

    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('quiz-screen').style.display = 'block';
    document.getElementById('problem-text').innerText = currentQuiz.text;
    startTime = Date.now();
    timerInterval = setInterval(() => {
        const diff = new Date(Date.now() - startTime);
        document.getElementById('timer').innerText = diff.toISOString().substr(11, 8);
    }, 1000);
    resizeCanvas();
};

document.getElementById('submit-btn').onclick = () => {
    if (document.getElementById('answer').value.trim() === currentQuiz.ans) {
        clearInterval(timerInterval);
        processEnd(true);
    } else {
        attemptsLeft--; updateLivesDisplay();
        startTime -= PENALTY_TIME;
        document.querySelector('.container').classList.add('shake');
        setTimeout(() => document.querySelector('.container').classList.remove('shake'), 300);
        
        gtag('event', 'quiz_wrong_answer', { 'attempts_left': attemptsLeft });

        if (attemptsLeft === 0) { clearInterval(timerInterval); processEnd(false); }
        else { alert(`오답! 남은 목숨: ${attemptsLeft}개`); }
    }
};

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

    document.getElementById('input-area').style.display = 'none';
    document.getElementById('hint-area').style.display = 'none';
    document.getElementById('result-area').style.display = 'block';
    canvas.style.display = 'none';
    document.getElementById('result-content-box').innerHTML = `<div class="solution-box"><p><strong>[정답]</strong> ${currentQuiz.ans}</p><p><strong>[해설]</strong> ${currentQuiz.exp}</p></div>`;
    document.getElementById('result-msg').innerText = isWin ? `${nickname}님, 성공! 🎉` : `${nickname}님, 실패... 💀`;
    document.getElementById('result-msg').style.color = isWin ? "#2ecc71" : "#ff4757";
    
    document.getElementById('share-btn').onclick = () => {
        gtag('event', 'share_clicked', { 'status': isWin ? 'success' : 'fail' });
        let attemptVisual = isWin ? (attemptsLeft === 3 ? "🟦🟦🟦" : (attemptsLeft === 2 ? "🟦🟦🟥" : "🟦🟥🟥")) : "🟥🟥🟥";
        const shareText = `[시냅스 스파크] ⚡${streak}\n\n${attemptVisual} (${time})\n\n함께해요! : ${window.location.href}`;
        navigator.clipboard.writeText(shareText).then(() => alert("성과가 복사되었습니다!"));
    };
}

function saveToFirebase(n, t) {
    const dateKey = TODAY_KEY.replace(/-/g, ""); // 랭킹은 검색 최적화를 위해 하이픈 제거 (20260416)
    const durationMs = Date.now() - startTime;
    if (durationMs < 500) return;
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
