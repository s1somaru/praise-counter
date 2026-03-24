const btn = document.getElementById('praiseBtn');
const counterEl = document.getElementById('counter');
const comboEl = document.getElementById('comboText');
const body = document.body;
const soundToggle = document.getElementById('soundToggle');
const resetBtn = document.getElementById('resetBtn');

// ローカルストレージから累計カウントを取得（なければ0）
let count = parseInt(localStorage.getItem('praiseCount')) || 0;
let soundEnabled = true;

// コンボ関連の変数
let combo = 0;
let comboTimer = null;
let audioCtx;

// 初期表示
counterEl.innerText = `${count} 回 褒められた！`;

// 褒め言葉のバリエーション
const praiseWords = [
    "天才！", "人類の至宝！", "生きてるだけで偉い！", "神！", "ノーベル賞確定！",
    "圧倒的成長！", "最高！", "素晴らしい！", "国宝級！", "大天才！",
    "宇宙の覇者！", "奇跡の存在！", "ブラボー！", "拍手喝采！", "ビッグバン級！"
];

// 派手なカラーパレット
const colors = ['#FF1493', '#00FF00', '#00BFFF', '#FFD700', '#FF4500', '#00FA9A', '#FFFFFF'];

// オーディオコンテキストの初期化（初回タップ時に発火させる）
function initAudio() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
}

// ピコピコ音の生成（コンボに応じて音階が上昇）
function playSound(pitchMultiplier = 1) {
    if (!soundEnabled || !audioCtx) return;
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    // 基準となる周波数（ラドミファ...的なゲーム音風）
    const baseFreq = 440; 
    osc.frequency.setValueAtTime(baseFreq * pitchMultiplier, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * pitchMultiplier * 1.5, audioCtx.currentTime + 0.1);
    
    osc.type = 'sine'; // 耳に優しいサイン波
    
    // 音量のエンベロープ（減衰）
    gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
    
    osc.start();
    osc.stop(audioCtx.currentTime + 0.3);
}

// サウンドON/OFFトグル
soundToggle.addEventListener('click', () => {
    soundEnabled = !soundEnabled;
    soundToggle.innerText = soundEnabled ? '🔊' : '🔇';
    initAudio();
});

// リセット機能
resetBtn.addEventListener('click', () => {
    if (confirm('本当に褒められた回数をリセットしますか？')) {
        count = 0;
        localStorage.setItem('praiseCount', count);
        counterEl.innerText = `${count} 回 褒められた！`;
        combo = 0;
    }
});

// テキストをランダムな位置にポップアップさせる
function createPopupText() {
    const el = document.createElement('div');
    el.className = 'popup-text';
    el.innerText = praiseWords[Math.floor(Math.random() * praiseWords.length)];
    
    // ボタン周り（画面中央）を避けてランダムな座標を生成
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    let x, y;
    let overlapping = true;
    
    while (overlapping) {
        // 画面の幅・高さに収まるようにランダム設定 (テキストの幅を考慮して右寄りを避ける)
        x = 50 + Math.random() * (window.innerWidth - 300);
        y = 150 + Math.random() * (window.innerHeight - 250);
        
        // ボタン領域(中央の 幅±250px、高さ±150px) を避ける
        if (Math.abs(x - centerX) > 250 || Math.abs(y - centerY) > 150) {
            overlapping = false;
        }
    }
    
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    el.style.color = colors[Math.floor(Math.random() * colors.length)];
    
    // CSS変数にランダムな角度を渡して回転させる
    const rot = (Math.random() - 0.5) * 80;
    el.style.setProperty('--rot', rot);
    
    body.appendChild(el);
    
    // アニメーション終了後にDOMから削除（軽量化）
    setTimeout(() => {
        el.remove();
    }, 1000);
}

// 紙吹雪エフェクト (canvas-confetti)
function triggerConfetti() {
    confetti({
        particleCount: Math.min(50 + combo * 5, 300), // コンボで増える
        spread: 70 + Math.min(combo * 5, 100),
        origin: { y: 0.8 },
        colors: [colors[Math.floor(Math.random() * colors.length)], '#ffffff'],
        zIndex: 1
    });
}

// コンボ計算・フィーバー判定
function updateCombo() {
    combo++;
    clearTimeout(comboTimer);
    
    if (combo > 1) {
        comboEl.innerText = `${combo} COMBO!!`;
        // コンボ数に応じてコンボ表示を少し大きくする
        comboEl.style.transform = `scale(${Math.min(1 + combo * 0.05, 1.8)})`;
    }

    // キリ番（50回毎）でフィーバー演出
    if (combo > 0 && combo % 50 === 0) {
        body.classList.add('fever');
        setTimeout(() => body.classList.remove('fever'), 1000);
        
        // 大規模な紙吹雪
        confetti({
            particleCount: 500,
            spread: 200,
            startVelocity: 60,
            origin: { y: 0.5 },
            zIndex: 100
        });
    }

    // 1秒放置でコンボリセット
    comboTimer = setTimeout(() => {
        combo = 0;
        comboEl.innerText = '';
    }, 1000); 
}

// ピッチ（音程）をコンボ数から計算
function getPitch() {
    // 最大で元の2.5倍の高さまで登り詰める
    return 1 + Math.min(combo * 0.05, 1.5);
}

// メイン処理（ボタン押下時）
function handleClick(e) {
    initAudio(); // 音声再生の事前準備
    
    count++;
    localStorage.setItem('praiseCount', count);
    counterEl.innerText = `${count} 回 褒められた！`;
    
    updateCombo();
    playSound(getPitch());
    triggerConfetti();
    
    // バイブレーションAPI (スマホの触覚フィードバック用)
    if (navigator.vibrate) {
        navigator.vibrate(30); 
    }

    // 画面を揺らす（一度クラスを外してリフローし、再度付与）
    body.classList.remove('shake');
    void body.offsetWidth; 
    body.classList.add('shake');

    // 中央のボタン領域を避けてテキストを出現させる
    createPopupText();
}

// スマホでの体験を上げるため mousedown と touchstart 両対応
// ※touchstartはレスポンスが極めて速い
btn.addEventListener('mousedown', handleClick);
btn.addEventListener('touchstart', (e) => {
    e.preventDefault(); // ダブルクリックや余分なイベントの発火を防ぐ
    btn.classList.add('active'); // CSSの凹みエフェクトを手動適用
    handleClick(e);
}, {passive: false});

btn.addEventListener('touchend', () => {
    btn.classList.remove('active');
});

// iOS等での無駄なズーム動作を防止
document.addEventListener('dblclick', function(event) {
    event.preventDefault();
}, { passive: false });
