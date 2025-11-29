// Import Firebase modules
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getDatabase, ref, set, push, get, remove } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js';

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

// Check if user is admin
const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
if (!currentUser.isAdmin) {
    window.location.href = 'login.html';
}

// Initialize default questions
async function initializeDefaultQuestions() {
    const questionsRef = ref(database, 'questions');
    const snapshot = await get(questionsRef);
    
    if (!snapshot.exists()) {
        const defaultQuestions = [
            {
                question: "உடலின் அமைப்பு",
                optionA: "மெலிந்த உடல்",
                optionB: "சராசரியான உடல்வாகு",
                optionC: "கனத்த பருமனான உடல்"
            },
            {
                question: "உயரம்",
                optionA: "அதிக உயரம்",
                optionB: "நடுத்தர உயரம்",
                optionC: "குள்ளம்"
            },
            {
                question: "உடல் வலிமை",
                optionA: "மிகக்குறைவு",
                optionB: "மிதமாக",
                optionC: "அதிகமாக"
            },
            {
                question: "தோலின் நிறம்",
                optionA: "கருமை",
                optionB: "மஞ்சள் (சிவப்பு)",
                optionC: "வெளுத்த தோல்"
            }
        ];

        for (const q of defaultQuestions) {
            const newQuestionRef = push(ref(database, 'questions'));
            await set(newQuestionRef, q);
        }
        console.log('Default questions initialized');
        loadAdminData();
    }
}

// Add Question
window.addQuestion = async () => {
    const questionText = document.getElementById('questionText').value.trim();
    const optionA = document.getElementById('optionA').value.trim();
    const optionB = document.getElementById('optionB').value.trim();
    const optionC = document.getElementById('optionC').value.trim();

    if (!questionText || !optionA || !optionB || !optionC) {
        alert('Please fill all fields');
        return;
    }

    const newQuestionRef = push(ref(database, 'questions'));
    await set(newQuestionRef, {
        question: questionText,
        optionA,
        optionB,
        optionC,
        createdAt: Date.now()
    });

    // Clear form
    document.getElementById('questionText').value = '';
    document.getElementById('optionA').value = '';
    document.getElementById('optionB').value = '';
    document.getElementById('optionC').value = '';

    alert('Question added successfully!');
    loadAdminData();
};

// Delete Question
window.deleteQuestion = async (questionId) => {
    if (confirm('Are you sure you want to delete this question?')) {
        const questionRef = ref(database, `questions/${questionId}`);
        await remove(questionRef);
        alert('Question deleted successfully!');
        loadAdminData();
    }
};

// Load Admin Data
async function loadAdminData() {
    // Load questions
    const questionsRef = ref(database, 'questions');
    const questionsSnapshot = await get(questionsRef);
    
    const adminQuestionsList = document.getElementById('adminQuestionsList');
    adminQuestionsList.innerHTML = '';

    if (questionsSnapshot.exists()) {
        const questions = questionsSnapshot.val();
        Object.entries(questions).forEach(([id, q], index) => {
            const questionItem = document.createElement('div');
            questionItem.className = 'question-item';
            questionItem.innerHTML = `
                <div class="question-item-text">
                    <strong>${index + 1}. ${q.question}</strong>
                    <small>A: ${q.optionA}</small>
                    <small>B: ${q.optionB}</small>
                    <small>C: ${q.optionC}</small>
                </div>
                <button class="btn-delete" onclick="deleteQuestion('${id}')">Delete</button>
            `;
            adminQuestionsList.appendChild(questionItem);
        });
    } else {
        adminQuestionsList.innerHTML = '<p>No questions available</p>';
    }

    // Load user results
    const resultsRef = ref(database, 'results');
    const resultsSnapshot = await get(resultsRef);
    
    const userResultsList = document.getElementById('userResultsList');
    userResultsList.innerHTML = '';

    if (resultsSnapshot.exists()) {
        const results = resultsSnapshot.val();
        Object.entries(results).forEach(([userId, result]) => {
            const resultItem = document.createElement('div');
            resultItem.className = 'result-item';
            
            let dominant = '';
            let dominantScore = Math.max(result.scoreA, result.scoreB, result.scoreC);
            
            if (result.scoreA === dominantScore) {
                dominant = 'வாதம் (Vata)';
            } else if (result.scoreB === dominantScore) {
                dominant = 'பித்தம் (Pitta)';
            } else {
                dominant = 'கபம் (Kapha)';
            }

            resultItem.innerHTML = `
                <h4>${result.name} (Age: ${result.age})</h4>
                <p>Dominant Type: ${dominant}</p>
                <div class="result-scores">
                    <span>வாதம்: ${result.scoreA}</span>
                    <span>பித்தம்: ${result.scoreB}</span>
                    <span>கபம்: ${result.scoreC}</span>
                </div>
                <p><small>Date: ${result.date || new Date(result.timestamp).toLocaleString('ta-IN')}</small></p>
            `;
            userResultsList.appendChild(resultItem);
        });
    } else {
        userResultsList.innerHTML = '<p>No results available yet</p>';
    }
}

// Logout
window.logout = () => {
    localStorage.removeItem('currentUser');
    window.location.href = 'login.html';
};

// Initialize
initializeDefaultQuestions();
loadAdminData();