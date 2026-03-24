const STREAM_URL = "http://onair.mapofm.net/mapofm";
const API_URL = "https://mapo-fm.github.io/api/v1/programs/mapofm.json";

const audio = document.getElementById('audio-stream');
const playPauseBtn = document.getElementById('play-pause-btn');
const playIcon = document.getElementById('play-icon');
const pauseIcon = document.getElementById('pause-icon');
const programTitle = document.getElementById('program-title');
const programImage = document.getElementById('program-image');
const programTime = document.getElementById('program-time');
const scheduleList = document.getElementById('schedule-list');
const dayTabs = document.querySelectorAll('.day-tab');

let scheduleData = [];
let isPlaying = false;

// 요일 매핑
const DAYS_KR = ["일요일", "월요일", "화요일", "수요일", "목요일", "금요일", "토요일"];

async function init() {
    await fetchData();
    const currentDay = DAYS_KR[new Date().getDay()];
    setActiveTab(currentDay);
    updateNowPlaying();
    renderSchedule(currentDay);
}

async function fetchData() {
    try {
        const response = await fetch(API_URL);
        const data = await response.json();
        scheduleData = data.schedule;
    } catch (error) {
        console.error("데이터를 불러오는데 실패했습니다:", error);
        programTitle.innerText = "데이터 로드 실패";
    }
}

function updateNowPlaying() {
    const now = new Date();
    const currentDay = DAYS_KR[now.getDay()];
    const currentTimeStr = `${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`;

    const currentProgram = scheduleData.find(prog => {
        if (prog.day !== currentDay) return false;
        return isTimeInRange(currentTimeStr, prog.startTime, prog.endTime);
    });

    if (currentProgram) {
        programTitle.innerText = currentProgram.programName;
        programTime.innerText = `${currentProgram.startTime} - ${currentProgram.endTime}`;
        programImage.src = currentProgram.image || "https://via.placeholder.com/150";
    } else {
        programTitle.innerText = "방송 준비 중";
        programTime.innerText = "-";
        programImage.src = "https://via.placeholder.com/150";
    }
}

function isTimeInRange(nowStr, startStr, endStr) {
    const now = parseTime(nowStr);
    const start = parseTime(startStr);
    let end = parseTime(endStr);

    // 자정(0:00) 처리
    if (end === 0) end = 24 * 60;

    return now >= start && now < end;
}

function parseTime(timeStr) {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
}

function renderSchedule(day) {
    scheduleList.innerHTML = '';
    const filtered = scheduleData.filter(prog => prog.day === day);
    
    const now = new Date();
    const currentDay = DAYS_KR[now.getDay()];
    const currentTimeStr = `${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`;

    filtered.forEach(prog => {
        const isOnAir = (day === currentDay && isTimeInRange(currentTimeStr, prog.startTime, prog.endTime));
        
        const item = document.createElement('div');
        item.className = `program-item ${isOnAir ? 'on-air' : ''}`;
        
        item.innerHTML = `
            <div class="program-item-info">
                <div class="program-item-time">${prog.startTime} - ${prog.endTime}</div>
                <div class="program-item-title">${prog.programName}</div>
            </div>
            ${prog.link ? `<a href="${prog.link}" target="_blank" class="program-item-link">상세정보</a>` : ''}
        `;
        scheduleList.appendChild(item);
    });
}

function setActiveTab(day) {
    dayTabs.forEach(tab => {
        if (tab.getAttribute('data-day') === day) {
            tab.classList.add('active');
        } else {
            tab.classList.remove('active');
        }
    });
}

// Event Listeners
playPauseBtn.addEventListener('click', () => {
    if (isPlaying) {
        audio.pause();
        playIcon.classList.remove('hidden');
        pauseIcon.classList.add('hidden');
        playPauseBtn.innerHTML = '<span id="play-icon">▶</span> 재생';
    } else {
        // 스트리밍 특성상 항상 최신 시점으로 재생하기 위해 src를 다시 설정하거나 로드함
        audio.load();
        audio.play().catch(e => console.error("재생 실패:", e));
        playIcon.classList.add('hidden');
        pauseIcon.classList.remove('hidden');
        playPauseBtn.innerHTML = '<span id="pause-icon">||</span> 정지';
    }
    isPlaying = !isPlaying;
});

dayTabs.forEach(tab => {
    tab.addEventListener('click', () => {
        const selectedDay = tab.getAttribute('data-day');
        setActiveTab(selectedDay);
        renderSchedule(selectedDay);
    });
});

// 1분마다 현재 방송 정보 업데이트
setInterval(updateNowPlaying, 60000);

init();
