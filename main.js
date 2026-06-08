// === НАСТРОЙКИ МУЗЫКИ ===
const RADIO_STREAM_URL = "https://ep128.hostingradio.ru:8030/ep128";
let workoutAudio = new Audio(RADIO_STREAM_URL);
let isMusicPlaying = false;
workoutAudio.preload = "auto";
workoutAudio.volume = 0.7;

let plankTimerInterval = null; // Таймер для планки

function toggleMusic() {
    const btn = document.getElementById('music-toggle-btn') || document.getElementById('music-toggle-btn-running');
    if (!isMusicPlaying) {
        workoutAudio.play().then(() => {
            isMusicPlaying = true;
            btn.textContent = "🔊";
            btn.classList.add('music-playing');
        }).catch(error => {
            let msg = "Не удалось включить музыку.";
            if (error.name === 'NotAllowedError') msg += " Выключите беззвучный режим на iPhone и попробуйте снова.";
            else msg += " Проверьте интернет.";
            alert(msg);
        });
    } else {
        workoutAudio.pause();
        isMusicPlaying = false;
        btn.textContent = "🎵";
        btn.classList.remove('music-playing');
    }
}

function stopMusic() {
    if (isMusicPlaying) {
        workoutAudio.pause();
        workoutAudio.currentTime = 0;
        isMusicPlaying = false;
        const btn1 = document.getElementById('music-toggle-btn');
        const btn2 = document.getElementById('music-toggle-btn-running');
        if (btn1) { btn1.textContent = "🎵"; btn1.classList.remove('music-playing'); }
        if (btn2) { btn2.textContent = "🎵"; btn2.classList.remove('music-playing'); }
    }
}

// === ДАННЫЕ ТРЕНИРОВОК ===
const BASE_WORKOUT_DATA = {
    pullups: [
        { name: "Обычный хват (на уровне плеч)", desc: "Держите спину прямо, тянитесь грудью к перекладине.", category: "pullups" },
        { name: "Широкий хват", desc: "Руки шире плеч, акцент на широчайшие мышцы спины.", category: "pullups" },
        { name: "Руки на уровне груди, обычный хват", desc: "Касание перекладины нижней частью груди.", category: "pullups" },
        { name: "Руки на уровне груди, обратный хват", desc: "Ладони к себе, акцент на бицепс.", category: "pullups" }
    ],
    pushups: [
        { name: "Руки на уровне плеч", desc: "Классические отжимания. Тело образует прямую линию, локти под углом 45 градусов.", category: "pushups" },
        { name: "Руки шире плеч", desc: "Акцент на грудные мышцы. Следите, чтобы поясница не прогибалась.", category: "pushups" },
        { name: "Руки на уровне груди (узкие)", desc: "Руки сведены вместе под грудью. Максимальная нагрузка на трицепс.", category: "pushups" },
        { name: "На кулаках (на уровне плеч)", desc: "Отжимания на кулаках для укрепления запястий. Держите спину ровно.", category: "pushups" }
    ],
    abs: [
        { name: "Подъем корпуса", gif: "abs_1.gif", desc: "Лёжа на спине, ноги согнуты. Подъём корпуса с вытягиванием рук вперёд.", category: "abs", isPlank: false },
        { name: "Подъем ног", gif: "abs_2.gif", desc: "Лёжа на спине, руки вдоль тела. Подъём прямых ног до вертикали, медленное опускание.", category: "abs", isPlank: false },
        { name: "Касание пяток", gif: "abs_3.gif", desc: "Лёжа на спине, ноги согнуты. Боковое скручивание: правой рукой к правой пятке, левой к левой.", category: "abs", isPlank: false },
        { name: "Касание коленей", gif: "abs_4.gif", desc: "Лёжа на спине, руки за головой. Подъём корпуса с касанием локтем противоположного колена.", category: "abs", isPlank: false },
        { name: "Ножницы", gif: "abs_5.gif", desc: "Лёжа на спине, руки под ягодицами. Прямые ноги подняты, попеременные махи вверх-вниз.", category: "abs", isPlank: false },
        { name: "Планка", gif: "abs_6.gif", desc: "Упор на предплечья (локти под плечами). Тело — прямая линия от макушки до пяток.", category: "abs", isPlank: true },
        { name: "Подтягивание коленей в планке", gif: "abs_7.gif", desc: "Упор на предплечьях. Поочерёдное подтягивание коленей к груди с сокращением пресса.", category: "abs", isPlank: false },
        { name: "Скалолаз", gif: "abs_8.gif", desc: "Упор на прямых руках. Поочерёдное подтягивание коленей к груди в быстром темпе.", category: "abs", isPlank: false },
        { name: "Активная планка", gif: "abs_9.gif", desc: "Поочерёдный переход из упора на предплечьях в упор на прямые руки и обратно.", category: "abs", isPlank: true }
    ]
};

const CATEGORY_NAMES = { 'abs': 'Пресс', 'pullups': 'Подтягивания', 'pushups': 'Отжимания', 'running': 'Бег', 'complex': 'Комплексная тренировка' };
const LEVEL_CONFIG = {
    1: { name: "Новичок", pullupReps: 7, pullupRest: 600, pushupReps: 10, pushupRest: 600, absReps: 20, absRest: 60, plankTime: 40, runDistance: "1 км" },
    2: { name: "Любитель", pullupReps: 10, pullupRest: 420, pushupReps: 20, pushupRest: 420, absReps: 30, absRest: 40, plankTime: 60, runDistance: "2 км" },
    3: { name: "Профи", pullupReps: 12, pullupRest: 300, pushupReps: 30, pushupRest: 300, absReps: 40, absRest: 20, plankTime: 120, runDistance: "3 км" }
};

let currentWorkout = { type: null, exerciseIndex: 0, setIndex: 0, timerInterval: null, exercises: [] };
let runningState = { isRunning: false, seconds: 0, interval: null };

// === ФУНКЦИИ ОЗВУЧКИ ===
function stopSpeaking() {
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        window.speechSynthesis.pause();
        window.speechSynthesis.cancel();
    }
}

function speak(text) {
    stopSpeaking();
    if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'ru-RU';
        utterance.rate = 1.0;
        setTimeout(() => { window.speechSynthesis.speak(utterance); }, 50);
    }
}

// === ИНИЦИАЛИЗАЦИЯ ===
document.addEventListener('DOMContentLoaded', () => {
    checkUserStatus();
    document.getElementById('registration-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('userName').value.trim();
        const gender = document.querySelector('input[name="gender"]:checked').value;
        if (name && gender) { saveProfile(name, gender); showWelcomeScreen(name); }
    });
    document.querySelectorAll('input[name="complex-type"]').forEach(cb => {
        cb.addEventListener('change', updateComplexButton);
    });
});

function checkUserStatus() {
    const profile = localStorage.getItem('fithero_profile');
    if (profile) {
        const data = JSON.parse(profile);
        if (!localStorage.getItem('fithero_stats')) localStorage.setItem('fithero_stats', JSON.stringify({ totalWorkouts: 0, currentStreak: 0, lastWorkoutDate: null, maxLevel: data.level || 1 }));
        if (data.level) showDashboard(data.name, data.level);
        else showWelcomeScreen(data.name);
    } else { document.getElementById('onboarding-screen').classList.remove('hidden'); }
}

function saveProfile(name, gender) {
    localStorage.setItem('fithero_profile', JSON.stringify({ name, gender, onboarded: true, level: null }));
    localStorage.setItem('fithero_stats', JSON.stringify({ totalWorkouts: 0, currentStreak: 0, lastWorkoutDate: null, maxLevel: 1 }));
}

// === НАВИГАЦИЯ И UI ===
function showWelcomeScreen(name) { stopSpeaking(); hideAllScreens(); document.getElementById('welcome-screen').classList.remove('hidden'); document.getElementById('greeting-text').textContent = `Привет, ${name}! 💪`; }
function selectLevel(level) {
    const profile = JSON.parse(localStorage.getItem('fithero_profile'));
    profile.level = level;
    localStorage.setItem('fithero_profile', JSON.stringify(profile));
    const stats = JSON.parse(localStorage.getItem('fithero_stats'));
    if (level > stats.maxLevel) { stats.maxLevel = level; localStorage.setItem('fithero_stats', JSON.stringify(stats)); }
    showDashboard(profile.name, level);
}
function showDashboard(name, level) {
    stopSpeaking(); stopMusic(); clearPlankTimer(); hideAllScreens();
    document.getElementById('dashboard-screen').classList.remove('hidden');
    document.getElementById('dashboard-greeting').textContent = `Привет, ${name}!`;
    document.getElementById('current-level-badge').textContent = `Уровень: ${LEVEL_CONFIG[level].name}`;
    document.getElementById('main-nav').classList.remove('hidden');
    updateNavActive('dashboard');
    document.getElementById('complex-run-dist').textContent = LEVEL_CONFIG[level].runDistance;
}
function goToLevelSelect() { const profile = JSON.parse(localStorage.getItem('fithero_profile')); showWelcomeScreen(profile.name); }
function switchTab(tabName) {
    stopSpeaking(); stopMusic(); clearPlankTimer(); clearTimer(); stopRunningTimer(); hideAllScreens();
    document.getElementById('main-nav').classList.remove('hidden');
    if (tabName === 'dashboard') { const p = JSON.parse(localStorage.getItem('fithero_profile')); showDashboard(p.name, p.level); }
    else if (tabName === 'calendar') { document.getElementById('calendar-screen').classList.remove('hidden'); renderCalendar(); }
    else if (tabName === 'achievements') { document.getElementById('achievements-screen').classList.remove('hidden'); renderAchievements(); }
    updateNavActive(tabName);
}
function updateNavActive(activeTab) {
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
    const index = activeTab === 'dashboard' ? 0 : activeTab === 'calendar' ? 1 : 2;
    document.querySelectorAll('.nav-item')[index].classList.add('active');
}
function hideAllScreens() { document.querySelectorAll('.screen').forEach(screen => screen.classList.add('hidden')); }

// === ДОСТИЖЕНИЯ ===
function renderAchievements() {
    const stats = JSON.parse(localStorage.getItem('fithero_stats') || '{"totalWorkouts":0,"currentStreak":0,"maxLevel":1}');
    const profile = JSON.parse(localStorage.getItem('fithero_profile'));
    const currentLevel = profile ? profile.level : 1;
    if (currentLevel > stats.maxLevel) { stats.maxLevel = currentLevel; localStorage.setItem('fithero_stats', JSON.stringify(stats)); }
    const achievements = [
        { id: 'first_step', icon: '🏆', title: 'Первый шаг', desc: 'Заверши первую тренировку', condition: () => stats.totalWorkouts >= 1, progress: () => `${Math.min(stats.totalWorkouts, 1)} / 1` },
        { id: 'iron_will', icon: '💪', title: 'Железный характер', desc: 'Заверши 10 тренировок всего', condition: () => stats.totalWorkouts >= 10, progress: () => `${Math.min(stats.totalWorkouts, 10)} / 10` },
        { id: 'on_fire', icon: '🔥', title: 'На огне', desc: 'Тренируйся 3 дня подряд', condition: () => stats.currentStreak >= 3, progress: () => `${Math.min(stats.currentStreak, 3)} / 3 дн.` },
        { id: 'absolute_pro', icon: '👑', title: 'Абсолютный профи', desc: 'Достигни 3 уровня сложности', condition: () => stats.maxLevel >= 3, progress: () => `Уровень ${Math.min(stats.maxLevel, 3)} / 3` }
    ];
    const container = document.getElementById('achievements-list'); container.innerHTML = '';
    achievements.forEach(ach => {
        const isUnlocked = ach.condition();
        const item = document.createElement('div'); item.className = `achievement-item ${isUnlocked ? 'unlocked' : 'locked'}`;
        item.innerHTML = `<div class="ach-icon">${ach.icon}</div><div class="ach-info"><h4>${ach.title}</h4><p>${ach.desc}</p>${!isUnlocked ? `<span class="ach-progress">${ach.progress()}</span>` : '<span class="ach-progress" style="color:#10b981">Разблокировано! ✨</span>'}</div>`;
        container.appendChild(item);
    });
}

// === СТАТИСТИКА ===
function updateStats() {
    const stats = JSON.parse(localStorage.getItem('fithero_stats') || '{"totalWorkouts":0,"currentStreak":0,"lastWorkoutDate":null,"maxLevel":1}');
    const today = new Date().toISOString().split('T')[0];
    if (stats.lastWorkoutDate === today) return;
    stats.totalWorkouts += 1;
    if (stats.lastWorkoutDate) {
        const diffDays = Math.ceil(Math.abs(new Date(today) - new Date(stats.lastWorkoutDate)) / (1000 * 60 * 60 * 24)); 
        if (diffDays === 1) stats.currentStreak += 1; else if (diffDays > 1) stats.currentStreak = 1;
    } else { stats.currentStreak = 1; }
    stats.lastWorkoutDate = today;
    localStorage.setItem('fithero_stats', JSON.stringify(stats));
}

// === КАЛЕНДАРЬ ===
function renderCalendar() {
    const today = new Date(); const year = today.getFullYear(); const month = today.getMonth();
    const monthNames = ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"];
    document.getElementById('calendar-month-year').textContent = `${monthNames[month]} ${year}`;
    const firstDay = new Date(year, month, 1); let startDay = firstDay.getDay() - 1; if (startDay === -1) startDay = 6;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const calendarGrid = document.getElementById('calendar-grid'); calendarGrid.innerHTML = '';
    const trainedDays = JSON.parse(localStorage.getItem('fithero_calendar') || '[]');
    for (let i = 0; i < startDay; i++) { const c = document.createElement('div'); c.className = 'calendar-day empty'; calendarGrid.appendChild(c); }
    for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const isTrained = trainedDays.includes(dateStr); const isToday = (day === today.getDate());
        const dayCell = document.createElement('div'); dayCell.className = `calendar-day ${isToday ? 'today' : ''}`; dayCell.innerHTML = `<span class="day-number">${day}</span>`;
        if (isTrained) { const dot = document.createElement('div'); dot.className = 'training-dot'; dayCell.appendChild(dot); }
        calendarGrid.appendChild(dayCell);
    }
}

// === ЛОГИКА ТРЕНИРОВОК ===
function openWorkout(type) {
    stopSpeaking(); stopMusic(); clearPlankTimer();
    if (type === 'complex') {
        hideAllScreens(); document.getElementById('main-nav').classList.add('hidden'); document.getElementById('complex-setup-screen').classList.remove('hidden');
        document.querySelectorAll('input[name="complex-type"]').forEach(cb => cb.checked = false); updateComplexButton();
    } else if (type === 'pullups' || type === 'pushups' || type === 'abs') startWorkout(type);
    else if (type === 'running') startRunningWorkout();
}
function updateComplexButton() { document.getElementById('btn-start-complex').disabled = !document.querySelector('input[name="complex-type"]:checked'); }

function startComplexWorkout() {
    const profile = JSON.parse(localStorage.getItem('fithero_profile'));
    const selected = Array.from(document.querySelectorAll('input[name="complex-type"]:checked')).map(cb => cb.value);
    let ex = [];
    if (selected.includes('pullups')) ex = ex.concat(BASE_WORKOUT_DATA.pullups);
    if (selected.includes('pushups')) ex = ex.concat(BASE_WORKOUT_DATA.pushups);
    if (selected.includes('abs')) ex = ex.concat(BASE_WORKOUT_DATA.abs);
    if (selected.includes('running')) ex.push({ name: "Бег", desc: `Пробежите дистанцию ${LEVEL_CONFIG[profile.level].runDistance}.`, category: "running", isRunning: true });
    currentWorkout = { type: 'complex', exerciseIndex: 0, setIndex: 0, level: profile.level, exercises: ex };
    hideAllScreens(); document.getElementById('main-nav').classList.add('hidden'); document.getElementById('workout-screen').classList.remove('hidden');
    document.getElementById('workout-title').textContent = "Комплексная"; renderExercise();
}

function startWorkout(type) {
    const profile = JSON.parse(localStorage.getItem('fithero_profile'));
    currentWorkout = { type, exerciseIndex: 0, setIndex: 0, level: profile.level, exercises: BASE_WORKOUT_DATA[type] };
    hideAllScreens(); document.getElementById('main-nav').classList.add('hidden'); document.getElementById('workout-screen').classList.remove('hidden');
    document.getElementById('workout-title').textContent = { pullups: "Подтягивания", pushups: "Отжимания", abs: "Пресс" }[type];
    renderExercise();
}

function renderExercise() {
    clearPlankTimer(); // Сбрасываем старый таймер планки если был
    const { exerciseIndex, setIndex, level, exercises } = currentWorkout;
    const ex = exercises[exerciseIndex]; const config = LEVEL_CONFIG[level];
    if (ex.isRunning) { startRunningWithinComplex(); return; }

    const totalSets = (ex.category === 'abs') ? 3 : 1;
    const totalSteps = exercises.reduce((acc, c) => acc + (c.category === 'abs' ? 3 : 1), 0);
    let currentStep = 0; for (let i = 0; i < exerciseIndex; i++) currentStep += (exercises[i].category === 'abs' ? 3 : 1); currentStep += setIndex;
    
    document.getElementById('workout-progress').style.width = `${(currentStep / totalSteps) * 100}%`;
    document.getElementById('workout-progress-text').textContent = (ex.category === 'abs') ? `Упр. ${exerciseIndex + 1}/${exercises.length}, Подход ${setIndex + 1}/${totalSets}` : `Упр. ${exerciseIndex + 1}/${exercises.length}`;
    
    document.getElementById('exercise-name').textContent = ex.name;
    document.getElementById('exercise-desc').textContent = ex.desc;
        // ЛОГИКА ОТОБРАЖЕНИЯ GIF
    const gifElement = document.getElementById('exercise-gif');
    if (ex.gif) {
        // Добавляем случайное число в конец, чтобы браузер не кэшировал гифку и всегда показывал свежую
        gifElement.src = `gifs/${ex.gif}?t=${new Date().getTime()}`;
        gifElement.style.display = 'block';
    } else {
        gifElement.style.display = 'none';
    }
    
    let targetValue = 0, restSec = 0, labelText = "раз";
    if (ex.category === 'abs') {
        if (ex.isPlank) { targetValue = config.plankTime; labelText = "сек"; } else { targetValue = config.absReps; }
        restSec = config.absRest;
    } else if (ex.category === 'pullups') { targetValue = config.pullupReps; restSec = config.pullupRest; }
    else if (ex.category === 'pushups') { targetValue = config.pushupReps; restSec = config.pushupRest; }
    
    document.getElementById('exercise-reps').textContent = `${targetValue} ${labelText}`;
    const isLastStep = (exerciseIndex === exercises.length - 1) && (setIndex === totalSets - 1);
    document.getElementById('rest-info-block').style.display = isLastStep ? 'none' : 'flex';
    if (!isLastStep) {
        const m = Math.floor(restSec / 60), s = restSec % 60;
        document.getElementById('rest-time-display').textContent = m > 0 ? `${m} мин ${s} сек` : `${s} сек`;
    }
    
    const btn = document.getElementById('btn-complete-set');
    const categoryName = CATEGORY_NAMES[ex.category] || 'Тренировка';

    if (ex.isPlank) {
        btn.classList.add('hidden'); // Скрываем кнопку "Выполнено"
        speak(`${categoryName}. ${ex.name}. Держите планку ${targetValue} секунд.`);
        setTimeout(() => startPlankTimer(targetValue), 1500); // Запускаем таймер сразу после озвучки
    } else {
        btn.classList.remove('hidden');
        btn.textContent = 'Выполнено ✅'; btn.onclick = completeSet;
        const setInfo = (ex.category === 'abs') ? `Подход ${setIndex + 1} из ${totalSets}. ` : '';
        speak(`${categoryName}. ${ex.name}. ${setInfo}Необходимо выполнить ${targetValue} раз.`);
    }
}

function completeSet() {
    const { exerciseIndex, setIndex, exercises } = currentWorkout;
    const ex = exercises[exerciseIndex]; const totalSets = (ex.category === 'abs') ? 3 : 1;
    if (setIndex < totalSets - 1) startRestTimer();
    else if (exerciseIndex < exercises.length - 1) startRestTimer();
    else finishWorkout();
}

function startRestTimer() {
    const { exerciseIndex, setIndex, level, exercises } = currentWorkout;
    const ex = exercises[exerciseIndex]; const config = LEVEL_CONFIG[level];
    const totalSets = (ex.category === 'abs') ? 3 : 1;
    let restSec = 0;
    if (ex.category === 'abs') restSec = config.absRest;
    else if (ex.category === 'pullups') restSec = config.pullupRest;
    else if (ex.category === 'pushups') restSec = config.pushupRest;
    
    document.getElementById('btn-complete-set').textContent = 'Идет отдых...'; document.getElementById('btn-complete-set').onclick = null;
    document.getElementById('rest-timer-block').classList.remove('hidden');
    let remaining = restSec; updateTimerDisplay(remaining); speak("Начинаем отдых");
    currentWorkout.timerInterval = setInterval(() => {
        remaining--; updateTimerDisplay(remaining);
        if (remaining <= 0) {
            clearTimer(); speak("Отдых окончен");
            if (setIndex < totalSets - 1) currentWorkout.setIndex++;
            else { currentWorkout.exerciseIndex++; currentWorkout.setIndex = 0; }
            renderExercise();
        }
    }, 1000);
}

// === ТАЙМЕР ПЛАНКИ (НОВЫЙ) ===
function startPlankTimer(seconds) {
    const timerBlock = document.getElementById('rest-timer-block');
    timerBlock.classList.remove('hidden');
    timerBlock.querySelector('h3').textContent = "⏱ Держите планку!";
    document.getElementById('rest-timer-display').textContent = formatTime(seconds);
    
    const actionBtn = timerBlock.querySelector('.btn-secondary');
    actionBtn.textContent = "Завершить раньше ⏹";
    actionBtn.onclick = () => { clearPlankTimer(); speak("Упражнение завершено."); completeSet(); };

    let remaining = seconds;
    plankTimerInterval = setInterval(() => {
        remaining--;
        document.getElementById('rest-timer-display').textContent = formatTime(remaining);
        if (remaining <= 0) {
            clearPlankTimer();
            speak("Время вышло! Планка завершена.");
            if (navigator.vibrate) navigator.vibrate([200, 100, 200]); // Вибрация на Android
            completeSet();
        }
    }, 1000);
}

function clearPlankTimer() {
    if (plankTimerInterval) { clearInterval(plankTimerInterval); plankTimerInterval = null; }
    document.getElementById('rest-timer-block').classList.add('hidden');
    const actionBtn = document.getElementById('rest-timer-block').querySelector('.btn-secondary');
    actionBtn.textContent = "Пропустить отдых"; actionBtn.onclick = skipRest;
    document.getElementById('btn-complete-set').classList.remove('hidden');
}

function formatTime(sec) { const m = Math.floor(sec / 60).toString().padStart(2, '0'); const s = (sec % 60).toString().padStart(2, '0'); return `${m}:${s}`; }
function updateTimerDisplay(seconds) { document.getElementById('rest-timer-display').textContent = formatTime(seconds); }
function skipRest() { clearTimer(); clearPlankTimer(); const { exerciseIndex, setIndex, exercises } = currentWorkout; const ex = exercises[exerciseIndex]; const totalSets = (ex.category === 'abs') ? 3 : 1; if (setIndex < totalSets - 1) currentWorkout.setIndex++; else { currentWorkout.exerciseIndex++; currentWorkout.setIndex = 0; } renderExercise(); }
function clearTimer() { if (currentWorkout.timerInterval) { clearInterval(currentWorkout.timerInterval); currentWorkout.timerInterval = null; } }

function exitWorkout() { stopSpeaking(); stopMusic(); clearPlankTimer(); clearTimer(); stopRunningTimer(); switchTab('dashboard'); }
function finishWorkout() { stopSpeaking(); stopMusic(); clearPlankTimer(); clearTimer(); speak("Поздравляю, тренировка завершена!"); saveToCalendar(); updateStats(); alert("🎉 Тренировка завершена! Достижения обновлены."); switchTab('dashboard'); }

// === ЛОГИКА БЕГА ===
function startRunningWorkout() { hideAllScreens(); document.getElementById('main-nav').classList.add('hidden'); document.getElementById('running-screen').classList.remove('hidden'); const p = JSON.parse(localStorage.getItem('fithero_profile')); document.getElementById('running-distance-target').textContent = LEVEL_CONFIG[p.level].runDistance; resetRunningUI(); speak(`Бег. Ваша цель на сегодня: ${LEVEL_CONFIG[p.level].runDistance}. Нажмите старт.`); }
function startRunningWithinComplex() { hideAllScreens(); document.getElementById('running-screen').classList.remove('hidden'); const p = JSON.parse(localStorage.getItem('fithero_profile')); document.getElementById('running-distance-target').textContent = LEVEL_CONFIG[p.level].runDistance; resetRunningUI(); document.getElementById('btn-running-finish').onclick = finishRunningWithinComplex; speak("Бег. Финальное упражнение. Нажмите старт."); }
function resetRunningUI() { runningState = { isRunning: false, seconds: 0, interval: null }; document.getElementById('stopwatch-display').textContent = "00:00:00"; const btn = document.getElementById('btn-running-toggle'); btn.textContent = "▶ Старт"; btn.classList.remove('is-running'); document.getElementById('btn-running-finish').disabled = true; document.getElementById('btn-running-finish').onclick = finishRunning; }
function toggleRunningTimer() {
    const btn = document.getElementById('btn-running-toggle');
    if (!runningState.isRunning) {
        runningState.isRunning = true; btn.textContent = "⏸ Пауза"; btn.classList.add('is-running'); document.getElementById('btn-running-finish').disabled = false; speak("Тренировка началась");
        runningState.interval = setInterval(() => { runningState.seconds++; const h = Math.floor(runningState.seconds / 3600).toString().padStart(2, '0'); const m = Math.floor((runningState.seconds % 3600) / 60).toString().padStart(2, '0'); const s = (runningState.seconds % 60).toString().padStart(2, '0'); document.getElementById('stopwatch-display').textContent = `${h}:${m}:${s}`; }, 1000);
    } else { runningState.isRunning = false; btn.textContent = "▶ Продолжить"; btn.classList.remove('is-running'); clearInterval(runningState.interval); }
}
function stopRunningTimer() { if (runningState.interval) clearInterval(runningState.interval); }
function finishRunning() { stopSpeaking(); stopMusic(); clearPlankTimer(); stopRunningTimer(); speak("Пробежка завершена!"); saveToCalendar(); updateStats(); alert("🎉 Пробежка завершена! Достижения обновлены."); switchTab('dashboard'); }
function finishRunningWithinComplex() { stopSpeaking(); stopMusic(); clearPlankTimer(); stopRunningTimer(); speak("Пробежка завершена! Комплексная тренировка окончена."); saveToCalendar(); updateStats(); alert("🎉 Комплексная тренировка завершена! Достижения обновлены."); switchTab('dashboard'); }

function saveToCalendar() { const today = new Date().toISOString().split('T')[0]; let c = JSON.parse(localStorage.getItem('fithero_calendar') || '[]'); if (!c.includes(today)) { c.push(today); localStorage.setItem('fithero_calendar', JSON.stringify(c)); } }