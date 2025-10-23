// 회원가입 페이지 JavaScript

document.addEventListener('DOMContentLoaded', function() {
    const signupForm = document.getElementById('signupForm');
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    const passwordStatus = document.getElementById('passwordMatchStatus');
    
    // 실시간 비밀번호 확인
    function checkPasswordMatch() {
        const password = passwordInput.value;
        const confirmPassword = confirmPasswordInput.value;
        
        if (confirmPassword === '') {
            passwordStatus.textContent = '';
            passwordStatus.className = 'password-status';
            return;
        }
        
        if (password === confirmPassword) {
            passwordStatus.textContent = '일치합니다';
            passwordStatus.className = 'password-status match';
        } else {
            passwordStatus.textContent = '비밀번호가 일치하지 않습니다';
            passwordStatus.className = 'password-status mismatch';
        }
    }
    
    // 비밀번호 입력 시 실시간 확인
    passwordInput.addEventListener('input', checkPasswordMatch);
    confirmPasswordInput.addEventListener('input', checkPasswordMatch);
    
    signupForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // 비밀번호 확인
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        
        if (password !== confirmPassword) {
            alert('비밀번호가 일치하지 않습니다.');
            return;
        }
        
        // 폼 데이터 수집
        const formData = new FormData(signupForm);
        const data = {
            email: formData.get('email'),
            password: formData.get('password'),
            fullName: formData.get('fullName'),
            grade: formData.get('grade'),
            className: formData.get('className'),
            studentNumber: parseInt(formData.get('studentNumber'))
        };
        
        try {
            const response = await fetch('/api/users/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });
            
            const result = await response.json();
            
            if (result.success) {
                // 회원가입 성공 모달 표시
                showPendingModal();
            } else {
                alert(result.error || '회원가입에 실패했습니다.');
            }
        } catch (error) {
            console.error('회원가입 오류:', error);
            alert('서버 연결에 실패했습니다.');
        }
    });
});

function showPendingModal() {
    document.getElementById('pendingModal').style.display = 'flex';
}

function closePendingModal() {
    document.getElementById('pendingModal').style.display = 'none';
    // 메인 페이지로 이동
    window.location.href = '/';
}
