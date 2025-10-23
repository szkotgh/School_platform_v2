// 관리자 페이지 JavaScript

document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    const adminDashboard = document.getElementById('adminDashboard');
    const adminLoginForm = document.getElementById('adminLoginForm');
    const logoutBtn = document.getElementById('logoutBtn');
    
    // 로그인 상태 확인
    const isLoggedIn = localStorage.getItem('adminLoggedIn') === 'true';
    if (isLoggedIn) {
        showDashboard();
        loadDashboardData();
        setupSidebarNavigation();
        setupTabNavigation();
        setupSidebarToggle();
    }

    // 로그인 폼 제출
    adminLoginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        const username = document.getElementById('adminUsername').value;
        const password = document.getElementById('adminPassword').value;
        
        try {
            const response = await fetch('/api/admin/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const result = await response.json();
            
            if (result.success) {
                localStorage.setItem('adminLoggedIn', 'true');
                localStorage.setItem('adminUsername', result.admin.username);
                showDashboard();
                loadDashboardData();
                
                // 초기 데이터 로드
                loadAllUserData();
            } else {
                alert(result.error || '로그인에 실패했습니다.');
            }
        } catch (error) {
            console.error('로그인 오류:', error);
            alert('서버 연결에 실패했습니다.');
        }
        
        return false;
    });

    // 로그아웃
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            localStorage.removeItem('adminLoggedIn');
            localStorage.removeItem('adminUsername');
            showLoginForm();
        });
    }

    // 대시보드 표시
    function showDashboard() {
        loginForm.style.display = 'none';
        adminDashboard.style.display = 'block';
    }

    // 로그인 폼 표시
    function showLoginForm() {
        loginForm.style.display = 'block';
        adminDashboard.style.display = 'none';
    }

    // 대시보드 데이터 로드
    async function loadDashboardData() {
        try {
            // 통계 정보 로드
            const statsResponse = await fetch('/api/stats');
            
            if (!statsResponse.ok) {
                throw new Error(`HTTP error! status: ${statsResponse.status}`);
            }
            
            const stats = await statsResponse.json();
            
            // 통계 업데이트 (요소가 존재할 때만)
            const pendingCountEl = document.getElementById('pendingCount');
            const approvedCountEl = document.getElementById('approvedCount');
            
            if (pendingCountEl) {
                pendingCountEl.textContent = stats.pending;
            }
            if (approvedCountEl) {
                approvedCountEl.textContent = stats.approved;
            }

            // 사용자 목록 로드
            await loadUsers();
            
            // 대기 중인 신청 목록 로드
            await loadApplications();
            
            // 승인된 프로젝트 목록 로드
            await loadApprovedProjects();
            
        } catch (error) {
            console.error('데이터 로드 오류:', error);
        }
    }

    // 사이드바 네비게이션 설정
    function setupSidebarNavigation() {
        const navItems = document.querySelectorAll('.nav-item');
        const contentSections = document.querySelectorAll('.content-section');

        if (navItems.length === 0 || contentSections.length === 0) {
            console.error('네비게이션 요소를 찾을 수 없습니다.');
            return;
        }

        navItems.forEach(item => {
            item.addEventListener('click', () => {
                const section = item.dataset.section;
                
                // 모든 네비게이션 아이템 비활성화
                navItems.forEach(nav => nav.classList.remove('active'));
                // 클릭된 아이템 활성화
                item.classList.add('active');
                
                // 모든 콘텐츠 섹션 숨기기
                contentSections.forEach(section => section.classList.remove('active'));
                // 해당 섹션 표시
                document.getElementById(section + 'Section').classList.add('active');
            });
        });
    }


    // 사이드바 토글 기능
    function setupSidebarToggle() {
        const sidebarToggle = document.getElementById('sidebarToggle');
        const sidebarClose = document.getElementById('sidebarClose');
        const adminSidebar = document.getElementById('adminSidebar');
        const sidebarOverlay = document.getElementById('sidebarOverlay');

        if (!sidebarToggle || !sidebarClose || !adminSidebar || !sidebarOverlay) {
            console.error('사이드바 요소를 찾을 수 없습니다.');
            return;
        }

        // 사이드바 열기
        sidebarToggle.addEventListener('click', () => {
            adminSidebar.classList.add('open');
            sidebarOverlay.classList.add('open');
            sidebarToggle.classList.add('sidebar-open');
            document.body.style.overflow = 'hidden'; // 스크롤 방지
        });

        // 사이드바 닫기 함수
        function closeSidebar() {
            adminSidebar.classList.remove('open');
            sidebarOverlay.classList.remove('open');
            sidebarToggle.classList.remove('sidebar-open');
            document.body.style.overflow = ''; // 스크롤 복원
        }

        // 사이드바 닫기 버튼
        sidebarClose.addEventListener('click', closeSidebar);

        // 오버레이 클릭 시 닫기
        sidebarOverlay.addEventListener('click', closeSidebar);

        // ESC 키로 닫기
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && adminSidebar.classList.contains('open')) {
                closeSidebar();
            }
        });
    }

    // 승인된 사용자만 로드
    async function loadApprovedUsersOnly() {
        try {
            const response = await fetch('/api/users');
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const users = await response.json();
            const approvedUsers = users.filter(user => user.status === 'approved');
            const approvedContainer = document.getElementById('approvedUsers');
            const approvedCountElement = document.getElementById('approvedUsersCount');
            
            if (approvedCountElement) {
                approvedCountElement.textContent = approvedUsers.length;
            }
            
            if (approvedContainer) {
                if (approvedUsers.length === 0) {
                    approvedContainer.innerHTML = '<div class="empty-state">승인된 사용자가 없습니다.</div>';
                } else {
                    approvedContainer.innerHTML = approvedUsers.map(user => {
                        const createdDate = new Date(user.created_at).toLocaleDateString('ko-KR');
                        const approvedDate = user.approved_at ? new Date(user.approved_at).toLocaleDateString('ko-KR') : '알 수 없음';
                        
                        return `
                        <div class="application-card" data-id="${user.id}">
                            <div class="application-header">
                                <h4 class="application-title">${user.full_name}</h4>
                                <span class="application-status status-approved">승인됨</span>
                            </div>
                            
                            <div class="application-info">
                                <div class="info-item">
                                    <span class="info-label">이메일</span>
                                    <span class="info-value">${user.email}</span>
                                </div>
                                <div class="info-item">
                                    <span class="info-label">학년/반/번호</span>
                                    <span class="info-value">${user.grade}학년 ${user.class_name}반 ${user.student_number}번</span>
                                </div>
                                <div class="info-item">
                                    <span class="info-label">가입일</span>
                                    <span class="info-value">${createdDate}</span>
                                </div>
                                <div class="info-item">
                                    <span class="info-label">승인일</span>
                                    <span class="info-value">${approvedDate}</span>
                                </div>
                            </div>
                            
                            <div class="application-actions">
                                <button class="btn-reject" onclick="rejectUser(${user.id})">승인 취소</button>
                            </div>
                        </div>
                    `;
                    }).join('');
                }
            }
            
        } catch (error) {
            console.error('승인된 사용자 목록 로드 오류:', error);
        }
    }

    // 사용자 목록 로드
    async function loadUsers() {
        try {
            const response = await fetch('/api/users');
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const users = await response.json();
            
            // 대기 중인 사용자 처리
            const pendingUsers = users.filter(user => user.status === 'pending');
            const pendingUsersHTML = pendingUsers.length === 0 
                ? '<div class="empty-state">승인 대기 중인 사용자가 없습니다.</div>'
                : pendingUsers.map(user => {
                    const createdDate = new Date(user.created_at).toLocaleDateString('ko-KR');
                    
                    return `
                    <div class="application-card" data-id="${user.id}">
                        <div class="application-header">
                            <h4 class="application-title">${user.full_name}</h4>
                            <span class="application-status status-pending">승인 대기</span>
                        </div>
                        
                        <div class="application-info">
                            <div class="info-item">
                                <span class="info-label">이메일</span>
                                <span class="info-value">${user.email}</span>
                            </div>
                            <div class="info-item">
                                <span class="info-label">학년/반/번호</span>
                                <span class="info-value">${user.grade}학년 ${user.class_name}반 ${user.student_number}번</span>
                            </div>
                            <div class="info-item">
                                <span class="info-label">가입일</span>
                                <span class="info-value">${createdDate}</span>
                            </div>
                        </div>
                        
                        <div class="application-actions">
                            <button class="btn-approve" onclick="approveUser(${user.id})">승인</button>
                            <button class="btn-reject" onclick="rejectUser(${user.id})">거부</button>
                        </div>
                    </div>
                `;
                }).join('');
            
            // 대기 중인 사용자 탭에만 표시
            const pendingContainer = document.getElementById('pendingUsers');
            if (pendingContainer) {
                pendingContainer.innerHTML = pendingUsersHTML;
            }
            
            // 카운트 업데이트
            document.getElementById('pendingUsersCount').textContent = pendingUsers.length;
            
        } catch (error) {
            console.error('사용자 목록 로드 오류:', error);
        }
    }

    // 대기 중인 신청 목록 로드
    async function loadApplications() {
        try {
            const response = await fetch('/api/applications');
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const applications = await response.json();
            
            const pendingApplications = applications.filter(app => app.status === 'pending');
            const container = document.getElementById('pendingApplications');
            const container2 = document.getElementById('pendingApplications2');
            
            const pendingApplicationsHTML = pendingApplications.length === 0 
                ? '<div class="empty-state">대기 중인 신청이 없습니다.</div>'
                : pendingApplications.map(app => {
                // 날짜 포맷팅 (YYYY-MM-DD)
                const createdAt = new Date(app.created_at);
                const formattedDate = createdAt.getFullYear() + '-' + 
                                      String(createdAt.getMonth() + 1).padStart(2, '0') + '-' + 
                                      String(createdAt.getDate()).padStart(2, '0');
                
                return `
                <div class="application-card" data-id="${app.id}">
                    <div class="application-header">
                        <div class="application-image-section">
                            ${app.image_url ? 
                                `<div class="application-image-container">
                                    <img src="${app.image_url}" alt="${app.title}" class="application-image" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                                    <div class="application-icon" style="display: none;"><i class="fas fa-folder-open"></i></div>
                                </div>` : 
                                `<div class="application-icon"><i class="fas fa-folder-open"></i></div>`
                            }
                        </div>
                        <div class="application-title-section">
                            <h4 class="application-title">${app.title}</h4>
                            <span class="application-status status-pending">대기중</span>
                        </div>
                    </div>
                    
                    <div class="application-info">
                        <div class="info-item">
                            <span class="info-label">카테고리</span>
                            <span class="info-value">${app.category}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">신청자</span>
                            <span class="info-value">${app.applicant_name}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">연락처</span>
                            <span class="info-value">${app.contact}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">이메일</span>
                            <span class="info-value">${app.email}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">프로젝트 URL</span>
                            <span class="info-value">${app.project_url || '없음'}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">신청일</span>
                            <span class="info-value">${formattedDate}</span>
                        </div>
                    </div>
                    
                    <div class="info-item">
                        <span class="info-label">프로젝트 설명</span>
                        <span class="info-value">${app.description}</span>
                    </div>
                    
                    <div class="application-actions">
                        <button class="btn-approve" onclick="approveApplication(${app.id})">승인</button>
                        <button class="btn-reject" onclick="rejectApplication(${app.id})">거부</button>
                    </div>
                </div>
            `;
                }).join('');
            
            // 대기 중인 신청 탭에만 표시
            if (container) {
                container.innerHTML = pendingApplicationsHTML;
            }
            
            // 카운트 업데이트
            document.getElementById('pendingCount').textContent = pendingApplications.length;
            
        } catch (error) {
            console.error('신청 목록 로드 오류:', error);
        }
    }

    // 승인된 프로젝트 목록 로드
    async function loadApprovedProjects() {
        try {
            const response = await fetch('/api/projects');
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const projects = await response.json();
            const container = document.getElementById('approvedProjects');
            const container2 = document.getElementById('approvedProjects2');
            
            const approvedProjectsHTML = projects.length === 0 
                ? '<div class="empty-state">승인된 프로젝트가 없습니다.</div>'
                : projects.map(project => {
                // 신청일 포맷팅 (YYYY-MM-DD)
                const applicationDate = project.application_date ? new Date(project.application_date) : new Date(project.created_at);
                const formattedApplicationDate = applicationDate.getFullYear() + '-' + 
                                               String(applicationDate.getMonth() + 1).padStart(2, '0') + '-' + 
                                               String(applicationDate.getDate()).padStart(2, '0');
                
                return `
                <div class="project-card" data-id="${project.id}">
                    <div class="application-header">
                        <h4 class="application-title">${project.title}</h4>
                        <span class="application-status status-approved">승인됨</span>
                    </div>
                    
                    <div class="application-info">
                        <div class="info-item">
                            <span class="info-label">카테고리</span>
                            <span class="info-value">${project.category}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">프로젝트 URL</span>
                            <span class="info-value">${project.project_url || '없음'}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">신청일</span>
                            <span class="info-value">${formattedApplicationDate}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">승인일</span>
                            <span class="info-value">${new Date(project.created_at).toLocaleDateString('ko-KR')}</span>
                        </div>
                    </div>
                    
                    <div class="info-item">
                        <span class="info-label">프로젝트 설명</span>
                        <span class="info-value">${project.description}</span>
                    </div>
                    
                    <div class="application-actions">
                        <button class="btn-edit" onclick="editProject(${project.id})">수정</button>
                        <button class="btn-delete" onclick="deleteProject(${project.id})">삭제</button>
                    </div>
                </div>
            `;
                }).join('');
            
            // 승인된 프로젝트 탭에만 표시
            if (container) {
                container.innerHTML = approvedProjectsHTML;
            }
            
            // 카운트 업데이트
            document.getElementById('approvedCount').textContent = projects.length;
            
        } catch (error) {
            console.error('프로젝트 목록 로드 오류:', error);
        }
    }

    // 전역 함수들
    window.deleteUser = async function(userId) {
        if (!confirm('정말로 이 사용자를 삭제하시겠습니까?\n삭제된 사용자는 복구할 수 없습니다.')) {
            return;
        }
        
        try {
            const response = await fetch(`/api/users/${userId}`, {
                method: 'DELETE'
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const result = await response.json();
            
            if (result.success) {
                alert('사용자가 삭제되었습니다.');
                // 데이터 새로고침
                loadUsers();
                loadApprovedUsersOnly();
            } else {
                alert(result.error || '사용자 삭제에 실패했습니다.');
            }
        } catch (error) {
            console.error('사용자 삭제 오류:', error);
            alert('사용자 삭제 중 오류가 발생했습니다.');
        }
    };

    window.approveUser = async function(userId) {
        if (!confirm('이 사용자를 승인하시겠습니까?')) {
            return;
        }
        
        try {
            const response = await fetch(`/api/users/${userId}/approve`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({})
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const result = await response.json();
            
            if (result.success) {
                alert('사용자가 승인되었습니다!');
                loadDashboardData(); // 데이터 새로고침
            } else {
                alert(result.error || '승인 처리에 실패했습니다.');
            }
        } catch (error) {
            console.error('사용자 승인 오류:', error);
            alert('승인 처리 중 오류가 발생했습니다.');
        }
    };

    window.rejectUser = async function(userId) {
        if (!confirm('정말로 이 사용자를 거부하시겠습니까?')) {
            return;
        }
        
        try {
            const response = await fetch(`/api/users/${userId}/reject`, {
                method: 'POST'
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const result = await response.json();
            
            if (result.success) {
                alert('사용자가 거부되었습니다.');
                loadDashboardData(); // 데이터 새로고침
            } else {
                alert(result.error || '거부 처리에 실패했습니다.');
            }
        } catch (error) {
            console.error('사용자 거부 오류:', error);
            alert('거부 처리 중 오류가 발생했습니다.');
        }
    };

    window.approveApplication = async function(applicationId) {
        if (!confirm('이 프로젝트를 승인하시겠습니까?')) {
            return;
        }
        
        try {
            const response = await fetch(`/api/applications/${applicationId}/approve`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({})
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const result = await response.json();
            
            if (result.success) {
                alert('프로젝트가 승인되었습니다!');
                loadDashboardData(); // 데이터 새로고침
            } else {
                alert(result.error || '승인 처리에 실패했습니다.');
            }
        } catch (error) {
            console.error('승인 오류:', error);
            alert('승인 처리 중 오류가 발생했습니다.');
        }
    };

    window.rejectApplication = async function(applicationId) {
        if (!confirm('정말로 이 신청을 거부하시겠습니까?')) {
            return;
        }
        
        try {
            const response = await fetch(`/api/applications/${applicationId}/reject`, {
                method: 'POST'
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const result = await response.json();
            
            if (result.success) {
                alert('신청이 거부되었습니다.');
                loadDashboardData(); // 데이터 새로고침
            } else {
                alert(result.error || '거부 처리에 실패했습니다.');
            }
        } catch (error) {
            console.error('거부 오류:', error);
            alert('거부 처리 중 오류가 발생했습니다.');
        }
    };

    // 프로젝트 수정 모달 열기
    window.editProject = async function(projectId) {
        try {
            const response = await fetch(`/api/projects/${projectId}`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const project = await response.json();
            
            if (project) {
                // 모달 폼에 데이터 채우기
                document.getElementById('editTitle').value = project.title;
                document.getElementById('editDescription').value = project.description;
                document.getElementById('editProjectUrl').value = project.project_url || '';
                document.getElementById('editImageSize').value = project.image_size || 'cover';
                document.getElementById('editDetailUrl').value = project.detail_url || '';
                // 파일 입력은 값을 설정할 수 없으므로 숨겨진 입력에 JSON 데이터 저장
                document.getElementById('editDetailImagesJson').value = project.detail_images || '';
                document.getElementById('editDetailDescription').value = project.detail_description || '';
                document.getElementById('editFeatures').value = project.features || '';
                document.getElementById('editTechStack').value = project.tech_stack || '';
                document.getElementById('editLinks').value = project.links || '';
                
                // 프로젝트 이미지들 미리보기 표시
                let allImages = [];
                
                // 기존 메인 이미지가 있으면 추가
                if (project.image_url) {
                    allImages.push(project.image_url);
                }
                
                // 상세 이미지들이 있으면 추가
                if (project.detail_images) {
                    try {
                        const detailImages = JSON.parse(project.detail_images);
                        allImages = allImages.concat(detailImages);
                    } catch (e) {
                        // JSON 파싱 실패 시 무시
                    }
                }
                
                // 모든 이미지를 미리보기에 표시
                const detailImagesPreview = document.getElementById('editImagesPreview');
                if (detailImagesPreview) {
                    detailImagesPreview.innerHTML = '';
                    allImages.forEach(url => {
                        const img = document.createElement('img');
                        img.src = url;
                        img.alt = '프로젝트 이미지';
                        detailImagesPreview.appendChild(img);
                    });
                }
                
                // 통합된 이미지들을 hidden 필드에 저장 (file input에는 값을 직접 넣을 수 없음)
                const imagesJsonInput = document.getElementById('editDetailImagesJson');
                if (imagesJsonInput) {
                    imagesJsonInput.value = JSON.stringify(allImages);
                }
                
                // 모달에 프로젝트 ID 저장
                document.getElementById('editProjectForm').dataset.projectId = projectId;
                
                // 모달 표시
                document.getElementById('editModal').style.display = 'flex';
            }
        } catch (error) {
            console.error('프로젝트 정보 로드 오류:', error);
            alert('프로젝트 정보를 불러오는 중 오류가 발생했습니다. 프로젝트가 존재하지 않을 수 있습니다.');
        }
    };

    // 모달 닫기
    window.closeEditModal = function() {
        document.getElementById('editModal').style.display = 'none';
        document.getElementById('editProjectForm').reset();
    };

    // 이미지 업로드 기능
    function setupImageUpload() {
        // 프로젝트 이미지들 업로드
        const editDetailImagesUploadBtn = document.getElementById('editDetailImagesUploadBtn');
        const editDetailImagesFile = document.getElementById('editDetailImagesFile');
        const editDetailImages = document.getElementById('editDetailImages');
        const editDetailImagesPreview = document.getElementById('editDetailImagesPreview');

        editDetailImagesUploadBtn.addEventListener('click', () => {
            editDetailImagesFile.click();
        });

        editDetailImagesFile.addEventListener('change', async (e) => {
            const files = Array.from(e.target.files);
            if (files.length > 0) {
                await uploadMultipleImages(files, editDetailImages, editDetailImagesPreview);
            }
        });
    }


    async function uploadMultipleImages(files, textarea, previewContainer) {
        const formData = new FormData();
        files.forEach(file => {
            formData.append('images', file);
        });

        try {
            const response = await fetch('/api/upload-multiple', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();

            if (result.success) {
                // JSON 배열 형태로 저장
                textarea.value = JSON.stringify(result.imageUrls);
                
                // 미리보기 표시
                previewContainer.innerHTML = '';
                result.imageUrls.forEach(url => {
                    const img = document.createElement('img');
                    img.src = url;
                    img.alt = '업로드된 이미지';
                    previewContainer.appendChild(img);
                });
                
                alert(`${result.imageUrls.length}개의 이미지가 업로드되었습니다!`);
            } else {
                alert('이미지 업로드에 실패했습니다: ' + result.error);
            }
        } catch (error) {
            console.error('업로드 오류:', error);
            alert('이미지 업로드 중 오류가 발생했습니다.');
        }
    }

    // 프로젝트 수정 폼 제출
    document.getElementById('editProjectForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const projectId = this.dataset.projectId;
        const formData = new FormData(this);
        const data = {
            title: formData.get('title'),
            description: formData.get('description'),
            project_url: formData.get('project_url'),
            image_size: formData.get('image_size'),
            detail_url: formData.get('detail_url'),
            detail_images: formData.get('detail_images'),
            detail_description: formData.get('detail_description'),
            features: formData.get('features'),
            tech_stack: formData.get('tech_stack'),
            links: formData.get('links')
        };
        
        try {
            const response = await fetch(`/api/projects/${projectId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const result = await response.json();
            
            if (result.success) {
                alert('프로젝트가 수정되었습니다!');
                closeEditModal();
                loadDashboardData(); // 데이터 새로고침
            } else {
                alert(result.error || '수정 처리에 실패했습니다.');
            }
        } catch (error) {
            console.error('수정 오류:', error);
            alert('수정 처리 중 오류가 발생했습니다.');
        }
    });

    window.deleteProject = async function(projectId) {
        if (!confirm('정말로 이 프로젝트를 삭제하시겠습니까?')) {
            return;
        }
        
        try {
            const response = await fetch(`/api/projects/${projectId}`, {
                method: 'DELETE'
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const result = await response.json();
            
            if (result.success) {
                alert('프로젝트가 삭제되었습니다.');
                loadDashboardData(); // 데이터 새로고침
            } else {
                alert(result.error || '삭제 처리에 실패했습니다.');
            }
        } catch (error) {
            console.error('삭제 오류:', error);
            alert('삭제 처리 중 오류가 발생했습니다.');
        }
    };

    // 탭 네비게이션 설정
    function setupTabNavigation() {
        const tabBtns = document.querySelectorAll('.tab-btn');
        const tabContents = document.querySelectorAll('.tab-content');

        if (tabBtns.length === 0) {
            console.error('탭 버튼을 찾을 수 없습니다.');
            return;
        }

        tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const tab = btn.dataset.tab;
                
                // 같은 섹션 내의 탭 버튼들만 비활성화
                const section = btn.closest('.content-section');
                const sectionTabBtns = section.querySelectorAll('.tab-btn');
                const sectionTabContents = section.querySelectorAll('.tab-content');
                
                sectionTabBtns.forEach(tabBtn => tabBtn.classList.remove('active'));
                btn.classList.add('active');
                
                sectionTabContents.forEach(content => content.classList.remove('active'));
                
                // 탭 ID 매핑
                const tabIdMap = {
                    'pending-users': 'pendingUsersTab',
                    'approved-users': 'approvedUsersTab',
                    'pending-projects': 'pendingProjectsTab',
                    'approved-projects': 'approvedProjectsTab'
                };
                
                const targetTabId = tabIdMap[tab];
                const targetTab = targetTabId ? document.getElementById(targetTabId) : null;
                
                if (targetTab) {
                    targetTab.classList.add('active');
                } else {
                    console.error(`탭 요소를 찾을 수 없습니다: ${tab} (ID: ${targetTabId})`);
                }
                
                // 탭 전환 시 모든 데이터 로드
                if (tab === 'pending-users' || tab === 'approved-users') {
                    // 사용자 탭일 때 모든 사용자 데이터 로드
                    loadAllUserData();
                } else if (tab === 'pending-projects' || tab === 'approved-projects') {
                    // 프로젝트 탭일 때 모든 프로젝트 데이터 로드
                    loadAllProjectData();
                }
            });
        });
    }

    // 승인된 사용자 로드
    async function loadApprovedUsers() {
        try {
            const response = await fetch('/api/users');
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const users = await response.json();
            const approvedUsers = users.filter(user => user.status === 'approved');
            
            const approvedUsersHTML = approvedUsers.length === 0 
                ? '<div class="empty-state">승인된 사용자가 없습니다.</div>'
                : approvedUsers.map(user => {
                    const createdDate = new Date(user.created_at).toLocaleDateString('ko-KR');
                    const approvedDate = user.approved_at ? new Date(user.approved_at).toLocaleDateString('ko-KR') : '알 수 없음';
                    
                    return `
                    <div class="application-card" data-id="${user.id}">
                        <div class="application-header">
                            <h4 class="application-title">${user.full_name}</h4>
                            <span class="application-status status-approved">승인됨</span>
                        </div>
                        
                        <div class="application-info">
                            <div class="info-item">
                                <span class="info-label">이메일</span>
                                <span class="info-value">${user.email}</span>
                            </div>
                            <div class="info-item">
                                <span class="info-label">학년/반/번호</span>
                                <span class="info-value">${user.grade}학년 ${user.class_name}반 ${user.student_number}번</span>
                            </div>
                            <div class="info-item">
                                <span class="info-label">가입일</span>
                                <span class="info-value">${createdDate}</span>
                            </div>
                            <div class="info-item">
                                <span class="info-label">승인일</span>
                                <span class="info-value">${approvedDate}</span>
                            </div>
                        </div>
                        
                        <div class="application-actions">
                            <button class="btn-reject" onclick="rejectUser(${user.id})">승인 취소</button>
                        </div>
                    </div>
                    `;
                }).join('');
            
            // 승인된 사용자 탭에만 표시
            const approvedContainer = document.getElementById('approvedUsers');
            if (approvedContainer) {
                approvedContainer.innerHTML = approvedUsersHTML;
            }
            
            // 카운트 업데이트
            document.getElementById('approvedUsersCount').textContent = approvedUsers.length;
            
        } catch (error) {
            console.error('승인된 사용자 로드 오류:', error);
        }
    }

    // 모든 사용자 데이터 로드
    async function loadAllUserData() {
        try {
            await loadUsers();
            await loadApprovedUsers();
        } catch (error) {
            console.error('사용자 데이터 로드 오류:', error);
        }
    }

    // 모든 프로젝트 데이터 로드
    async function loadAllProjectData() {
        try {
            await loadApplications();
            await loadApprovedProjects();
        } catch (error) {
            console.error('프로젝트 데이터 로드 오류:', error);
        }
    }
});
