// 로그인 페이지 JavaScript

document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    
    // 로그인 상태 확인
    const isLoggedIn = localStorage.getItem('userLoggedIn') === 'true';
    if (isLoggedIn) {
        window.location.href = '/';
        return;
    }
    
    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        
        try {
            const response = await fetch('/api/users/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password })
            });
            
            const result = await response.json();
            
            if (result.success) {
                // 로그인 성공
                localStorage.setItem('userLoggedIn', 'true');
                localStorage.setItem('userInfo', JSON.stringify(result.user));
                window.location.href = '/';
            } else if (response.status === 403) {
                // 승인 대기 또는 거부 상태
                if (result.error === 'pending') {
                    showPendingModal();
                } else if (result.error === 'rejected') {
                    showRejectedModal();
                }
            } else {
                alert(result.error || '로그인에 실패했습니다.');
            }
        } catch (error) {
            console.error('로그인 오류:', error);
            alert('서버 연결에 실패했습니다.');
        }
    });
});

function showPendingModal() {
    document.getElementById('pendingModal').style.display = 'flex';
}

function closePendingModal() {
    document.getElementById('pendingModal').style.display = 'none';
}

function showRejectedModal() {
    document.getElementById('rejectedModal').style.display = 'flex';
}

function closeRejectedModal() {
    document.getElementById('rejectedModal').style.display = 'none';
}
