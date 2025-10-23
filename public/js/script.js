// 메인 JavaScript 파일

document.addEventListener('DOMContentLoaded', function() {
    // 로그인 상태 확인 및 UI 업데이트
    checkLoginStatus();
    
    // 승인된 프로젝트 목록 로드
    loadApprovedProjects();
});

function checkLoginStatus() {
    const isLoggedIn = localStorage.getItem('userLoggedIn') === 'true';
    const userInfo = document.getElementById('userInfo');
    const guestNav = document.getElementById('guestNav');
    const userName = document.getElementById('userName');
    const logoutBtn = document.getElementById('logoutBtn');
    
    if (isLoggedIn) {
        const userData = JSON.parse(localStorage.getItem('userInfo') || '{}');
        userName.textContent = `${userData.fullName}님`;
        userInfo.style.display = 'flex';
        guestNav.style.display = 'none';
        
        // 로그아웃 버튼 이벤트
        logoutBtn.addEventListener('click', function() {
            localStorage.removeItem('userLoggedIn');
            localStorage.removeItem('userInfo');
            location.reload();
        });
    } else {
        userInfo.style.display = 'none';
        guestNav.style.display = 'flex';
    }
}

async function loadApprovedProjects() {
    try {
        const response = await fetch('/api/projects');
        const projects = await response.json();
        
        if (projects.length === 0) {
            // 데이터베이스에 프로젝트가 없으면 기본 프로젝트들 표시
            renderProjects();
            return;
        }
        
        renderProjectsFromDB(projects);
    } catch (error) {
        console.error('프로젝트 로드 오류:', error);
        // 오류 시 기본 프로젝트들 표시
        renderProjects();
    }
}

function renderProjects() {
    const projectsGrid = document.getElementById('projects-grid');
    
    projects.forEach(project => {
        const projectCard = createProjectCard(project);
        projectsGrid.appendChild(projectCard);
    });
}

function renderProjectsFromDB(projects) {
    const projectsGrid = document.getElementById('projects-grid');
    projectsGrid.innerHTML = ''; // 기존 내용 지우기
    
    projects.forEach(project => {
        const projectCard = createProjectCardFromDB(project);
        projectsGrid.appendChild(projectCard);
    });
}

function createProjectCard(project) {
    const card = document.createElement('a');
    card.href = `/project-detail?id=${project.id}`;
    card.className = 'project-card';
    
    const categoryColor = getCategoryColor(project.category);
    const categoryIcon = getCategoryIcon(project.category);
    
    card.innerHTML = `
        <div class="project-category-badge">${project.category}</div>
        <div class="project-content">
            <h3 class="project-title">${project.title}</h3>
            <p class="project-description">${project.description}</p>
        </div>
    `;
    
    return card;
}

function createProjectCardFromDB(project) {
    const card = document.createElement('a');
    card.href = `/project-detail?id=${project.id}`;
    card.className = 'project-card';
    
    const categoryColor = getCategoryColor(project.category);
    const categoryIcon = getCategoryIcon(project.category);
    
    card.innerHTML = `
        <div class="project-category-badge">${project.category}</div>
        <div class="project-content">
            <h3 class="project-title">${project.title}</h3>
            <p class="project-description">${project.description}</p>
        </div>
    `;
    
    return card;
}

function getCategoryColor(category) {
    switch (category) {
        case '웹':
            return '#4A90E2';
        case '앱':
            return '#7ED321';
        case '게임':
            return '#BD10E0';
        case '기타':
            return '#F5A623';
        default:
            return '#666666';
    }
}

function getCategoryIcon(category) {
    switch (category) {
        case '웹':
            return '🌐';
        case '앱':
            return '📱';
        case '게임':
            return '🎮';
        case '기타':
            return '💻';
        default:
            return '💻';
    }
}

// 프로젝트 추가 함수 (관리자용)
function addNewProject() {
    const title = prompt('프로젝트 제목을 입력하세요:');
    if (!title) return;
    
    const description = prompt('프로젝트 설명을 입력하세요:');
    if (!description) return;
    
    const url = prompt('프로젝트 URL을 입력하세요:');
    if (!url) return;
    
    const category = prompt('카테고리를 입력하세요 (웹/앱/게임/기타):');
    if (!category) return;
    
    const deadline = prompt('마감일을 입력하세요 (YYYY.MM.DD 형식):');
    if (!deadline) return;
    
    const image = prompt('이미지 URL을 입력하세요 (선택사항):');
    const imageSize = prompt('이미지 크기 조정을 입력하세요 (cover/contain/fill/scale-down/none, 기본값: cover):');
    
    const newProject = {
        title: title,
        description: description,
        url: url,
        category: category,
        deadline: deadline,
        image: image || `https://via.placeholder.com/400x200/666666/ffffff?text=${encodeURIComponent(title)}`,
        imageSize: imageSize || 'cover'
    };
    
    addProject(newProject);
    
    // 페이지 새로고침하여 새 프로젝트 표시
    location.reload();
}
