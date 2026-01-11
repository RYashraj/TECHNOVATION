let score = 0;
let currentQ = 0;

const WORD_BATCH = 5;
const API_FETCH_COUNT = 10;
const WORD_PERIOD = 'day'; // 'visit' or 'day'

let wordsPool = [];
let wordsShown = 0;

function hideLoader() {
    document.getElementById('words-loader').innerHTML = "";
}


const vocabData = [
    {w:"Petrichor", p:"/ˈpe-trī-kôr/", m:"The earthy scent after rain."},
    {w:"Elysian", p:"/ə-ˈli-zhən/", m:"Beautiful, creative, or blissful."},
    {w:"Mellifluous", p:"/mə-ˈli-floo-əs/", m:"A sound that is sweet and smooth."},
    {w:"Luminous", p:"/ˈloo-mə-nəs/", m:"Full of light; bright and shining."},
    {w:"Ephemeral", p:"/ə-ˈfe-m(ə-)rəl/", m:"Lasting for a short time."},
    {w:"Quintessential", p:"/ˌkwin-tə-ˈsen-shəl/", m:"The most perfect example"},
    {w:"Serendipity", p:"/ˌser-ən-ˈdi-pə-tē/", m:"Happy accidents or luck."},
    {w:"Resilient", p:"/ri-ˈzil-yənt/", m:"Strong enough to bounce back."}
];


function shuffle(arr) {
    return arr.sort(() => Math.random() - 0.5);
}

async function loadWords() {
    document.getElementById('words-loader').innerHTML = `
        <div class="loader-spinner"></div>
        <div>Loading words...</div>
    `;
    document.getElementById('words-list').innerHTML = "";
    document.getElementById('words-more-btn').style.display = "none";

    const today = new Date().toISOString().split('T')[0];
    const cacheKey = `words_${today}`;

    if (WORD_PERIOD === 'day') {
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
            wordsPool = JSON.parse(cached);
            hideLoader();
            return renderWordsInit();
        }
    }

    // fetch fresh + enrich
    wordsPool = await fetchAndEnrichWords(API_FETCH_COUNT);

    if (WORD_PERIOD === 'day') {
        localStorage.setItem(cacheKey, JSON.stringify(wordsPool));
    }

    hideLoader();
    renderWordsInit();
}


function renderWordsInit() {
    wordsShown = 0;
    document.getElementById('words-list').innerHTML = "";
    renderWords();
}

async function fetchAndEnrichWords(n) {
    let results = [];

    while (results.length < n) {
        const needed = n - results.length;

        // fetch N random words
        const raw = await fetch(`https://random-word-api.herokuapp.com/word?number=${needed}`)
                            .then(res => res.json())
                            .catch(() => []);

        // ENRICH ALL IN PARALLEL (THIS IS WHERE Promise.all GOES)
        const enriched = await Promise.all(raw.map(fetchNounInfo));

        // filter out nulls (not nouns / no definitions)
        results.push(...enriched.filter(Boolean));
    }

    return results;
}


async function fetchNounInfo(word) {
    try {
        const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);
        const data = await res.json();
        if (!res.ok) return null;

        // find noun meaning
        const nounEntry = data[0].meanings.find(m => m.partOfSpeech === "noun");
        if (!nounEntry) return null;

        // extract definition
        const def = nounEntry.definitions?.[0]?.definition;
        if (!def) return null;

        // phonetics & audio
        const phon = data[0].phonetics?.[0]?.text || "/No phonetic/";
        const audio = data[0].phonetics?.find(p => p.audio)?.audio || null;

        return {
            w: word,
            p: phon,
            m: def,
            audio
        };

    } catch(e) {
        return null;
    }
}



function generateWords() {
    wordsPool = shuffle([...vocabData]).slice(0, 20); // or however many you want
}

function renderWords() {
    const list = document.getElementById('words-list');
    const next = wordsPool.slice(wordsShown, wordsShown + WORD_BATCH);

    list.innerHTML += next.map(createCard).join('');

    wordsShown += WORD_BATCH;

    document.getElementById('words-more-btn').style.display =
        wordsShown < wordsPool.length ? "inline-block" : "none";
}


document.getElementById('words-more-btn').onclick = renderWords;


function showPage(id) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    if(id === 'quiz') startQuiz();
    if(id === 'words') loadWords();
}

function playWordAudio(url) {
    new Audio(url).play();
}

function speak(t) { speechSynthesis.speak(new SpeechSynthesisUtterance(t)); }


function createCard(item) {
    let audioBtn = "";

    if (item.audio) {
        audioBtn = `
            <button class="btn-primary audio-btn" onclick="playWordAudio('${item.audio}')">
                🔊 Listen
            </button>
        `;
    } else {
        audioBtn = `
            <button class="btn-secondary audio-btn" onclick="speak('${item.w}')">
                💬 Say It
            </button>
        `;
    }

    return `
        <div class="card">
            <h3>${item.w}</h3>
            <span class="pronounce-tag">${item.p}</span>
            <p>${item.m}</p>
            ${audioBtn}
        </div>
    `;
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
    },
    {
        img: "assets/bike.jpg",
        options: ["Bicycle","Motorcycle","Car"],
        answer: 0
    },
    {
        img: "assets/chairs.jpg",
        options: ["Chair","Table","Sofa"],
        answer: 0
    }
];

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
    const q = questions[currentQ];
    const buttons = document.querySelectorAll('.opt');

    // disable all buttons to prevent re-clicking
    buttons.forEach(btn => btn.classList.add('disabled'));

    // apply feedback class
    if (selected === q.answer) {
        score += 10;
        buttons[selected].classList.add('correct');
    } else {
        buttons[selected].classList.add('wrong');
        buttons[q.answer].classList.add('correct');
    }

    document.getElementById('score').innerText = "Score: " + score;

    // delay before moving to next question
    setTimeout(() => {
        currentQ++;
        if (currentQ < questions.length) {
            showQ();
        } else {
            document.getElementById('quiz-body').innerHTML = `
                <h3>Quiz Complete! 🏆</h3>
                <button class="btn-secondary" onclick="startQuiz()">Play Again</button>
            `;
        }
    }, 900);
}

