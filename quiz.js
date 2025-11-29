// Import Firebase modules
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getDatabase, ref, set, get } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js';

// Firebase Configuration - REPLACE WITH YOUR OWN CONFIG
const firebaseConfig = {
  apiKey: "AIzaSyDK8HtD3cRxGpFSERD2pc1tF907h1zvmYs",
  authDomain: "diagnosio-64657.firebaseapp.com",
  projectId: "diagnosio-64657",
  storageBucket: "diagnosio-64657.firebasestorage.app",
  messagingSenderId: "182463804824",
  appId: "1:182463804824:web:d42f6575aca092e2dca7ed"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

// Check if user is logged in
const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
if (!currentUser.name || currentUser.isAdmin) {
    window.location.href = 'login.html';
}

// Display user name
document.getElementById('userName').textContent = `வணக்கம், ${currentUser.name} (வயது: ${currentUser.age})`;

// Load Questions
async function loadQuestions() {
    const questionsRef = ref(database, 'questions');
    const snapshot = await get(questionsRef);
    
    if (snapshot.exists()) {
        const questions = snapshot.val();
        const container = document.getElementById('questionsContainer');
        container.innerHTML = '';

        Object.entries(questions).forEach(([id, q], index) => {
            const questionCard = document.createElement('div');
            questionCard.className = 'question-card';
            questionCard.innerHTML = `
                <h3>${index + 1}. ${q.question}</h3>
                <label class="option">
                    <input type="radio" name="q${id}" value="A" onchange="selectOption(this)">
                    ${q.optionA}
                </label>
                <label class="option">
                    <input type="radio" name="q${id}" value="B" onchange="selectOption(this)">
                    ${q.optionB}
                </label>
                <label class="option">
                    <input type="radio" name="q${id}" value="C" onchange="selectOption(this)">
                    ${q.optionC}
                </label>
            `;
            container.appendChild(questionCard);
        });
    } else {
        document.getElementById('questionsContainer').innerHTML = '<p>கேள்விகள் இல்லை. Admin பேனலில் கேள்விகள் சேர்க்கவும்.</p>';
    }
}

// Select Option
window.selectOption = (radio) => {
    const options = radio.closest('.question-card').querySelectorAll('.option');
    options.forEach(opt => opt.classList.remove('selected'));
    radio.closest('.option').classList.add('selected');
};

// Submit Quiz
window.submitQuiz = async () => {
    const radios = document.querySelectorAll('#questionsContainer input[type="radio"]:checked');
    
    const questionsRef = ref(database, 'questions');
    const snapshot = await get(questionsRef);
    const totalQuestions = snapshot.exists() ? Object.keys(snapshot.val()).length : 0;
    
    if (radios.length !== totalQuestions) {
        alert('தயவுசெய்து அனைத்து கேள்விகளுக்கும் பதிலளிக்கவும்');
        return;
    }

    let scoreA = 0, scoreB = 0, scoreC = 0;

    radios.forEach(radio => {
        if (radio.value === 'A') scoreA++;
        else if (radio.value === 'B') scoreB++;
        else if (radio.value === 'C') scoreC++;
    });

    // Save result to database
    const resultRef = ref(database, `results/${currentUser.userId}`);
    await set(resultRef, {
        name: currentUser.name,
        age: currentUser.age,
        scoreA,
        scoreB,
        scoreC,
        timestamp: Date.now(),
        date: new Date().toLocaleString('ta-IN')
    });

    // Determine dominant type
    let dominant = '';
    let dominantScore = Math.max(scoreA, scoreB, scoreC);
    
    if (scoreA === dominantScore) {
        dominant = 'உங்கள் உடல் வகை: வாதம் (Vata)';
    } else if (scoreB === dominantScore) {
        dominant = 'உங்கள் உடல் வகை: பித்தம் (Pitta)';
    } else {
        dominant = 'உங்கள் உடல் வகை: கபம் (Kapha)';
    }

    // Save results to localStorage for results page
    localStorage.setItem('quizResults', JSON.stringify({
        scoreA,
        scoreB,
        scoreC,
        dominant
    }));

    // Redirect to results page
    window.location.href = 'results.html';
};

// Logout
window.logout = () => {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('quizResults');
    window.location.href = 'login.html';
};

// Load questions on page load
loadQuestions();