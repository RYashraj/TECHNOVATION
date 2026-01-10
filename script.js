// --- STATE MANAGEMENT ---
let score = 0;
let currentQ = 0;

// --- PAGE NAVIGATION ---
function showPage(id) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    if(id === 'learn') loadInitialVocab();
    if(id === 'quiz') startQuiz();
}

// --- VOCABULARY SECTION ---
const vocabData = [
    {w:"Petrichor", p:"/ˈpeˌtrīkôr/", m:"The pleasant, earthy smell after rain."},
    {w:"Elysian", p:"/əˈliZHən/", m:"Beautiful or creative; divinely inspired."},
    {w:"Mellifluous", p:"/məˈliflo͞oəs/", m:"A sound that is sweet and smooth to hear."},
    {w:"Luminous", p:"/ˈlo͞omənəs/", m:"Full of or shedding light; bright."},
    {w:"Ephemeral", p:"/əˈfem(ə)rəl/", m:"Lasting for a very short time."},
    {w:"Quintessential", p:"/ˌkwin-tə-ˈsen-shəl/", m:"The most perfect example of a quality."},
    {w:"Serendipity", p:"/ˌserənˈdipədē/", m:"Finding good things without looking for them."},
    {w:"Resilient", p:"/rəˈzilyənt/", m:"Able to withstand or recover from difficult conditions."}
];

function loadInitialVocab() {
    const list = document.getElementById('vocab-list');
    list.innerHTML = ""; // Clear existing
    const firstSet = vocabData.slice(0, 4);
    list.innerHTML = firstSet.map(i => createCard(i)).join('');
}

function loadMoreVocab() {
    const list = document.getElementById('vocab-list');
    const fullSet = vocabData.slice(4);
    list.innerHTML += fullSet.map(i => createCard(i)).join('');
    document.getElementById('load-more-btn').style.display = 'none'; // Hide button after use
}

function createCard(item) {
    return `
        <div class="card">
            <h3 style="margin:0">${item.w}</h3>
            <span class="pronounce-tag">${item.p}</span>
            <p style="margin-top:10px">${item.m}</p>
        </div>`;
}

// --- DICTIONARY SECTION ---
async function fetchWord() {
    const input = document.getElementById('dictInput');
    const word = input.value.toLowerCase().trim();
    const resDiv = document.getElementById('dictResult');
    
    if(!word) return;
    resDiv.innerHTML = "<p>Searching Magic Scrolls...</p>";

    try {
        const dRes = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);
        const dData = await dRes.json();

        if(!dRes.ok) {
            resDiv.innerHTML = "<h3>Oops! Word not found.</h3><p>Try searching for 'Science' or 'Elephant'.</p>";
            return;
        }

        const entry = dData[0];
        const meaning = entry.meanings[0].definitions[0].definition;
        const phonetic = entry.phonetic || "Pronunciation N/A";

        resDiv.innerHTML = `
            <div class="result-box">
                <div class="result-info">
                    <h2 style="margin:0">${word.toUpperCase()}</h2>
                    <span class="pronounce-tag">${phonetic}</span>
                    <p style="margin-top:20px; line-height:1.6"><strong>Meaning:</strong> ${meaning}</p>
                    <button class="btn-primary" onclick="speak('${word}')" style="margin-top:10px; background:#64748b">🔊 Hear Pronunciation</button>
                </div>
                <img class="result-img" src="https://images.unsplash.com/photo-1503023345030-a7c39a8523f4?q=80&w=300&auto=format&fit=crop" 
                     onerror="this.src='https://via.placeholder.com/300?text=${word}'"
                     onload="this.src='https://source.unsplash.com/featured/?${word}'">
            </div>`;
    } catch(e) {
        resDiv.innerHTML = "❌ Error connecting to library. Check your internet.";
    }
}

function speak(text) {
    const msg = new SpeechSynthesisUtterance(text);
    msg.rate = 0.9;
    window.speechSynthesis.speak(msg);
}

// --- QUIZ SECTION ---
const quizQuestions = [
    {q:"What is the center of an atom?", a:["Electron","Nucleus","Proton"], c:1},
    {q:"Which is a synonym for 'Huge'?", a:["Tiny","Gigantic","Soft"], c:1},
    {q:"Which planet is closest to the Sun?", a:["Venus","Mars","Mercury"], c:2},
    {q:"Which of these is a 'Naming Word'?", a:["Run","Blue","Noun"], c:2},
    {q:"How many legs does a spider have?", a:["6","8","10"], c:1}
];

function startQuiz() {
    score = 0; currentQ = 0;
    document.getElementById('score').innerText = "0";
    showQuestion();
}

function showQuestion() {
    const q = quizQuestions[currentQ];
    document.getElementById('quiz-body').innerHTML = `
        <h3 style="margin-bottom:20px">${q.q}</h3>
        ${q.a.map((o,i) => `<button class="opt" onclick="checkAns(${i})">${o}</button>`).join('')}
    `;
}

function checkAns(idx) {
    if(idx === quizQuestions[currentQ].c) {
        score += 10;
        document.getElementById('score').innerText = score;
    }
    currentQ++;
    if(currentQ < quizQuestions.length) {
        showQuestion();
    } else {
        document.getElementById('quiz-body').innerHTML = "<h3>🏆 Congratulations! You finished the quiz!</h3><button class='btn-primary' onclick='startQuiz()'>Restart Quiz</button>";
    }
}