let score = 0;
let currentQ = 0;

function showPage(id) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    if(id === 'learn') loadInitialVocab();
    if(id === 'quiz') startQuiz();
}

// --- VOCABULARY ---
const vocabData = [
    {w:"Petrichor", p:"/ˈpe-trī-kôr/", m:"The earthy scent after rain."},
    {w:"Elysian", p:"/ə-ˈli-zhən/", m:"Beautiful, creative, or blissful."},
    {w:"Mellifluous", p:"/mə-ˈli-floo-əs/", m:"A sound that is sweet and smooth."},
    {w:"Luminous", p:"/ˈloo-mə-nəs/", m:"Full of light; bright and shining."},
    {w:"Ephemeral", p:"/ə-ˈfe-m(ə-)rəl/", m:"Lasting for a short time."},
    {w:"Quintessential", p:"/ˌkwin-tə-ˈsen-shəl/", m:"The most perfect example of something."},
    {w:"Serendipity", p:"/ˌser-ən-ˈdi-pə-tē/", m:"Happy accidents or luck."},
    {w:"Resilient", p:"/ri-ˈzil-yənt/", m:"Strong enough to bounce back."}
];

function loadInitialVocab() {
    const list = document.getElementById('vocab-list');
    list.innerHTML = vocabData.slice(0, 4).map(i => createCard(i)).join('');
}

function loadMoreVocab() {
    const list = document.getElementById('vocab-list');
    list.innerHTML += vocabData.slice(4).map(i => createCard(i)).join('');
    document.getElementById('load-more-btn').style.display = 'none';
}

function createCard(item) {
    return `<div class="card"><h3>${item.w}</h3><span class="pronounce-tag">${item.p}</span><p>${item.m}</p></div>`;
}

// --- DICTIONARY ---
async function fetchWord() {
    const word = document.getElementById('dictInput').value.toLowerCase().trim();
    const resDiv = document.getElementById('dictResult');
    if(!word) return;

    resDiv.innerHTML = "<div class='loader'>Searching...</div>";

    try {
        const dRes = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);
        const dData = await dRes.json();

        if(!dRes.ok) {
            resDiv.innerHTML = "<h3>Word not found.</h3>";
            return;
        }

        const meaning = dData[0].meanings[0].definitions[0].definition;
        const phonetic = dData[0].phonetic || "/Pronunciation N/A/";

        // IMAGE LOGIC: Using Unsplash Source with a unique timestamp to prevent caching issues
        const imgUrl = `https://source.unsplash.com/featured/?${word}&sig=${Math.random()}`;

        resDiv.innerHTML = `
            <div class="result-box">
                <div class="result-info">
                    <h2 style="margin:0">${word.toUpperCase()}</h2>
                    <span class="pronounce-tag">${phonetic}</span>
                    <p><strong>Definition:</strong> ${meaning}</p>
                    <button class="btn-primary" onclick="speak('${word}')" style="background:#475569">🔊 Listen</button>
                </div>
                <img class="result-img" src="${imgUrl}" onerror="this.style.display='none'" alt="${word}">
            </div>`;
    } catch(e) {
        resDiv.innerHTML = "❌ Connection Error.";
    }
}

function speak(t) { window.speechSynthesis.speak(new SpeechSynthesisUtterance(t)); }

// --- QUIZ ---
const questions = [
    {
        img: "assets/lion.jpg",
        options: ["Lion","Tiger","Cheetah"],
        answer: 0
    },
    {
        img: "assets/apple.jpg",
        options: ["Apple","Banana","Mango"],
        answer: 0
    },
    {
        img: "assets/dog.jpg",
        options: ["Tiger","Lion","Dog"],
        answer: 2
    }
];

function startQuiz() { score=0; currentQ=0; showQ(); }
function startQuiz() {
    score = 0;
    currentQ = 0;
    showQ();
}

function showQ() {
    const q = questions[currentQ];

    document.getElementById('quiz-body').innerHTML = `
        <img src="${q.img}" class="quiz-img" alt="Question Image">
        ${q.options.map((opt,i)=>`<button class="opt" onclick="check(${i})">${opt}</button>`).join('')}
    `;
}

function check(selected) {
    if(selected === questions[currentQ].answer) score += 10;
    document.getElementById('score').innerText = "Score: " + score;
    currentQ++;
    if(currentQ < questions.length) showQ();
    else {
        document.getElementById('quiz-body').innerHTML = `
            <h3>Quiz Complete! 🏆</h3>
            <button class="btn-secondary" onclick="startQuiz()">Play Again</button>
        `;
    }
}
