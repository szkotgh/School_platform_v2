// Node.js 백엔드 서버 (SQLite 사용)
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const cors = require('cors');
const bcrypt = require('bcrypt');
const multer = require('multer');
const fs = require('fs');

const app = express();
const PORT = 3000;

// 업로드 디렉토리 생성
const uploadDir = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer 설정
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        // 파일명을 타임스탬프와 원본명으로 구성
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + '-' + file.originalname);
    }
});

const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB 제한
    },
    fileFilter: function (req, file, cb) {
        // 이미지 파일만 허용
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('이미지 파일만 업로드 가능합니다.'), false);
        }
    }
});

// 미들웨어
app.use(cors());
app.use(express.json());
app.use(express.static('public'));
app.use('/uploads', express.static(uploadDir));

// 깔끔한 URL 라우트 (HTML 확장자 제거)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/signup', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'signup.html'));
});

app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'register.html'));
});

app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.get('/project-detail', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'project-detail.html'));
});

// SQLite 데이터베이스 연결
const dbPath = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

// 데이터베이스 초기화
function initDatabase() {
    db.serialize(() => {
        // 관리자 테이블
        db.run(`
            CREATE TABLE IF NOT EXISTS admins (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // 사용자 테이블
        db.run(`
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                full_name TEXT NOT NULL,
                grade TEXT NOT NULL,
                class_name TEXT NOT NULL,
                student_number INTEGER NOT NULL,
                status TEXT DEFAULT 'pending',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                approved_at DATETIME
            )
        `);

        // 통합 프로젝트 테이블
        db.run(`
            CREATE TABLE IF NOT EXISTS projects (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                description TEXT NOT NULL,
                category TEXT NOT NULL,
                applicant_name TEXT NOT NULL,
                contact TEXT NOT NULL,
                email TEXT NOT NULL,
                project_url TEXT,
                image_url TEXT,
                image_size TEXT DEFAULT 'cover',
                detail_description TEXT,
                features TEXT,
                tech_stack TEXT,
                links TEXT,
                project_images TEXT,
                status TEXT DEFAULT 'pending',
                deadline TEXT,
                detail_url TEXT,
                detail_images TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                approved_at DATETIME
            )
        `);

        // 기존 테이블에 새로운 컬럼 추가 (마이그레이션)
        const addColumns = [
            'ALTER TABLE users ADD COLUMN student_number INTEGER',
            'ALTER TABLE users ADD COLUMN grade TEXT',
            'ALTER TABLE users ADD COLUMN class_name TEXT'
        ];

        addColumns.forEach(sql => {
            db.run(sql, (err) => {
                if (err && !err.message.includes('duplicate column name')) {
                    console.error('컬럼 추가 오류:', err);
                }
            });
        });

        // 기본 관리자 계정 생성 (비밀번호: admin123)
        const defaultPassword = bcrypt.hashSync('admin123', 10);
        db.run(`
            INSERT OR IGNORE INTO admins (username, password) 
            VALUES ('admin', ?)
        `, [defaultPassword]);

    });
}

// 로그인 시도 추적
const loginAttempts = new Map();
const userLoginAttempts = new Map();

// 관리자 로그인 API
app.post('/api/admin/login', (req, res) => {
    const { username, password } = req.body;
    const clientIP = req.ip || req.connection.remoteAddress;
    
    // IP별 로그인 시도 횟수 확인
    const attempts = loginAttempts.get(clientIP) || 0;
    if (attempts >= 5) {
        return res.status(429).json({ 
            success: false, 
            message: '너무 많은 로그인 시도가 있었습니다. 잠시 후 다시 시도해주세요.' 
        });
    }

    db.get(
        'SELECT * FROM admins WHERE username = ?',
        [username],
        (err, admin) => {
            if (err) {
                return res.status(500).json({ error: '서버 오류' });
            }

            if (!admin) {
                loginAttempts.set(clientIP, attempts + 1);
                setTimeout(() => {
                    loginAttempts.delete(clientIP);
                }, 15 * 60 * 1000); // 15분 후 초기화
                return res.status(401).json({ error: '잘못된 사용자명 또는 비밀번호입니다.' });
            }

            if (bcrypt.compareSync(password, admin.password)) {
                // 로그인 성공 시 시도 횟수 초기화
                loginAttempts.delete(clientIP);
                res.json({ 
                    success: true, 
                    message: '로그인 성공',
                    admin: { id: admin.id, username: admin.username }
                });
            } else {
                loginAttempts.set(clientIP, attempts + 1);
                setTimeout(() => {
                    loginAttempts.delete(clientIP);
                }, 15 * 60 * 1000); // 15분 후 초기화
                res.status(401).json({ error: '잘못된 시스템 ID 또는 접근 키입니다.' });
            }
        }
    );
});

// 사용자 회원가입 API
app.post('/api/users/register', (req, res) => {
    const { email, password, fullName, grade, className, studentNumber } = req.body;
    
    // 비밀번호 해시화
    const hashedPassword = bcrypt.hashSync(password, 10);
    
    db.run(
        `INSERT INTO users (email, password, full_name, grade, class_name, student_number)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [email, hashedPassword, fullName, grade, className, studentNumber],
        function(err) {
            if (err) {
                if (err.message.includes('UNIQUE constraint failed')) {
                    if (err.message.includes('email')) {
                        return res.status(400).json({ error: '이미 사용 중인 이메일입니다.' });
                    }
                }
                return res.status(500).json({ error: '회원가입 중 오류가 발생했습니다.' });
            }
            
            res.json({ 
                success: true, 
                message: '회원가입이 완료되었습니다. 관리자 승인 후 로그인이 가능합니다.',
                userId: this.lastID
            });
        }
    );
});

// 사용자 로그인 API
app.post('/api/users/login', (req, res) => {
    const { email, password } = req.body;
    const clientIP = req.ip || req.connection.remoteAddress;
    
    // IP별 로그인 시도 횟수 확인
    const attempts = userLoginAttempts.get(clientIP) || 0;
    if (attempts >= 5) {
        return res.status(429).json({ 
            success: false, 
            message: '너무 많은 로그인 시도가 있었습니다. 잠시 후 다시 시도해주세요.' 
        });
    }

    db.get(
        'SELECT * FROM users WHERE email = ?',
        [email],
        (err, user) => {
            if (err) {
                return res.status(500).json({ error: '서버 오류' });
            }

            if (!user) {
                userLoginAttempts.set(clientIP, attempts + 1);
                setTimeout(() => {
                    userLoginAttempts.delete(clientIP);
                }, 15 * 60 * 1000); // 15분 후 초기화
                return res.status(401).json({ error: '잘못된 이메일 또는 비밀번호입니다.' });
            }

            if (bcrypt.compareSync(password, user.password)) {
                // 사용자 상태 확인
                if (user.status === 'pending') {
                    return res.status(403).json({ 
                        error: 'pending',
                        message: '관리자 승인 후 로그인이 가능합니다.'
                    });
                } else if (user.status === 'rejected') {
                    return res.status(403).json({ 
                        error: 'rejected',
                        message: '회원가입이 거부되었습니다. 관리자에게 문의하세요.'
                    });
                }
                
                // 로그인 성공 시 시도 횟수 초기화
                userLoginAttempts.delete(clientIP);
                res.json({ 
                    success: true, 
                    message: '로그인 성공',
                    user: { 
                        id: user.id, 
                        fullName: user.full_name,
                        email: user.email,
                        grade: user.grade,
                        className: user.class_name,
                        studentNumber: user.student_number
                    }
                });
            } else {
                userLoginAttempts.set(clientIP, attempts + 1);
                setTimeout(() => {
                    userLoginAttempts.delete(clientIP);
                }, 15 * 60 * 1000); // 15분 후 초기화
                res.status(401).json({ error: '잘못된 이메일 또는 비밀번호입니다.' });
            }
        }
    );
});

// 사용자 목록 조회 API (관리자용)
app.get('/api/users', (req, res) => {
    db.all(
        'SELECT id, email, full_name, grade, class_name, student_number, status, created_at, approved_at FROM users ORDER BY created_at DESC',
        (err, users) => {
            if (err) {
                return res.status(500).json({ error: '서버 오류' });
            }
            res.json(users);
        }
    );
});

// 사용자 승인 API
app.post('/api/users/:id/approve', (req, res) => {
    const userId = req.params.id;

    db.run(
        'UPDATE users SET status = ?, approved_at = CURRENT_TIMESTAMP WHERE id = ?',
        ['approved', userId],
        function(err) {
            if (err) {
                return res.status(500).json({ error: '승인 처리 중 오류 발생' });
            }
            res.json({ success: true, message: '사용자가 승인되었습니다' });
        }
    );
});

// 사용자 거부 API
app.post('/api/users/:id/reject', (req, res) => {
    const userId = req.params.id;

    db.run(
        'UPDATE users SET status = ? WHERE id = ?',
        ['rejected', userId],
        function(err) {
            if (err) {
                return res.status(500).json({ error: '거부 처리 중 오류 발생' });
            }
            res.json({ success: true, message: '사용자가 거부되었습니다' });
        }
    );
});

// 프로젝트 신청 목록 조회 API
app.get('/api/applications', (req, res) => {
    db.all(
        'SELECT * FROM projects WHERE status = "pending" ORDER BY created_at DESC',
        (err, applications) => {
            if (err) {
                return res.status(500).json({ error: '서버 오류' });
            }
            res.json(applications);
        }
    );
});

// 프로젝트 신청 승인 API
app.post('/api/applications/:id/approve', (req, res) => {
    const projectId = req.params.id;

    db.run(
        'UPDATE projects SET status = ?, approved_at = CURRENT_TIMESTAMP WHERE id = ?',
        ['approved', projectId],
        function(err) {
            if (err) {
                return res.status(500).json({ error: '승인 처리 중 오류 발생' });
            }
            
            if (this.changes === 0) {
                return res.status(404).json({ error: '프로젝트를 찾을 수 없습니다' });
            }
            
            res.json({ 
                success: true, 
                message: '프로젝트가 승인되었습니다',
                projectId: projectId
            });
        }
    );
});

// 프로젝트 신청 거부 API
app.post('/api/applications/:id/reject', (req, res) => {
    const projectId = req.params.id;

    db.run(
        'UPDATE projects SET status = ? WHERE id = ?',
        ['rejected', projectId],
        function(err) {
            if (err) {
                return res.status(500).json({ error: '거부 처리 중 오류 발생' });
            }
            res.json({ success: true, message: '신청이 거부되었습니다' });
        }
    );
});

// 승인된 프로젝트 목록 조회 API
app.get('/api/projects', (req, res) => {
    db.all(
        'SELECT * FROM projects WHERE status = "approved" ORDER BY created_at DESC',
        (err, projects) => {
            if (err) {
                return res.status(500).json({ error: '서버 오류' });
            }
            res.json(projects);
        }
    );
});

// 승인된 프로젝트 조회 API (단일)
app.get('/api/projects/:id', (req, res) => {
    const projectId = req.params.id;
    
    db.get(
        'SELECT * FROM projects WHERE id = ? AND status = "approved"', 
        [projectId], 
        (err, project) => {
            if (err) {
                return res.status(500).json({ error: '프로젝트 조회 중 오류 발생' });
            }
            
            if (!project) {
                return res.status(404).json({ error: '프로젝트를 찾을 수 없습니다' });
            }
            
            res.json(project);
        }
    );
});

// 승인된 프로젝트 수정 API
app.put('/api/projects/:id', (req, res) => {
    const projectId = req.params.id;
    const { 
        title, description, project_url, image_size, 
        detail_url, detail_images, detail_description, features, tech_stack, links 
    } = req.body;
    
    db.run(
        `UPDATE projects 
         SET title = ?, description = ?, project_url = ?, image_size = ?,
             detail_url = ?, detail_images = ?, detail_description = ?, features = ?, tech_stack = ?, links = ?
         WHERE id = ? AND status = "approved"`,
        [title, description, project_url, image_size, 
         detail_url, detail_images, detail_description, features, tech_stack, links, projectId],
        function(err) {
            if (err) {
                return res.status(500).json({ error: '수정 처리 중 오류 발생' });
            }
            
            if (this.changes === 0) {
                return res.status(404).json({ error: '프로젝트를 찾을 수 없습니다' });
            }
            
            res.json({ success: true, message: '프로젝트가 수정되었습니다' });
        }
    );
});

// 승인된 프로젝트 삭제 API
app.delete('/api/projects/:id', (req, res) => {
    const projectId = req.params.id;

    db.run(
        'DELETE FROM projects WHERE id = ? AND status = "approved"',
        [projectId],
        function(err) {
            if (err) {
                return res.status(500).json({ error: '삭제 중 오류 발생' });
            }
            res.json({ success: true, message: '프로젝트가 삭제되었습니다' });
        }
    );
});

// 사용자 삭제 API
app.delete('/api/users/:id', (req, res) => {
    const userId = req.params.id;

    db.run(
        'DELETE FROM users WHERE id = ?',
        [userId],
        function(err) {
            if (err) {
                return res.status(500).json({ error: '사용자 삭제 중 오류 발생' });
            }
            
            if (this.changes === 0) {
                return res.status(404).json({ error: '사용자를 찾을 수 없습니다' });
            }
            
            res.json({ success: true, message: '사용자가 삭제되었습니다' });
        }
    );
});

// 통계 정보 API
app.get('/api/stats', (req, res) => {
    const stats = {};

    // 대기 중인 신청 수
    db.get(
        'SELECT COUNT(*) as count FROM projects WHERE status = "pending"',
        (err, result) => {
            if (err) return res.status(500).json({ error: '서버 오류' });
            stats.pending = result.count;

            // 승인된 프로젝트 수
            db.get(
                'SELECT COUNT(*) as count FROM projects WHERE status = "approved"',
                (err, result) => {
                    if (err) return res.status(500).json({ error: '서버 오류' });
                    stats.approved = result.count;

                    // 전체 프로젝트 수 (승인된 프로젝트만)
                    stats.total = stats.approved;
                    res.json(stats);
                }
            );
        }
    );
});

// 이미지 업로드 API
app.post('/api/upload', upload.single('image'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: '이미지 파일이 필요합니다.' });
    }
    
    const imageUrl = `/uploads/${req.file.filename}`;
    res.json({
        success: true,
        message: '이미지가 업로드되었습니다.',
        imageUrl: imageUrl,
        filename: req.file.filename
    });
});

// 여러 이미지 업로드 API
app.post('/api/upload-multiple', upload.array('images', 10), (req, res) => {
    if (!req.files || req.files.length === 0) {
        return res.status(400).json({ error: '이미지 파일이 필요합니다.' });
    }
    
    const imageUrls = req.files.map(file => `/uploads/${file.filename}`);
    res.json({
        success: true,
        message: '이미지들이 업로드되었습니다.',
        imageUrls: imageUrls,
        filenames: req.files.map(file => file.filename)
    });
});

// 프로젝트 신청 저장 API (등록 폼에서 사용)
app.post('/api/applications', (req, res) => {
    const { 
        title, description, category, applicant_name, contact, email, 
        project_url, image_size, detail_description, 
        features, tech_stack, links, project_images 
    } = req.body;

    // 첫 번째 이미지를 메인 이미지로 사용
    let mainImageUrl = '';
    if (project_images) {
        try {
            const images = JSON.parse(project_images);
            if (images.length > 0) {
                mainImageUrl = images[0];
            }
        } catch (e) {
            console.error('이미지 데이터 파싱 오류:', e);
        }
    }

    db.run(
        `INSERT INTO projects 
         (title, description, category, applicant_name, contact, email, project_url, image_url, 
          image_size, detail_description, features, tech_stack, links, project_images, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
        [title, description, category, applicant_name, contact, email, project_url, mainImageUrl,
         image_size || 'cover', detail_description || '', features || '', tech_stack || '', 
         links || '', project_images || ''],
        function(err) {
            if (err) {
                return res.status(500).json({ error: '신청 저장 중 오류 발생' });
            }
            
            const projectId = this.lastID;
            
            res.json({ 
                success: true, 
                message: '신청이 접수되었습니다',
                projectId: projectId
            });
        }
    );
});

// 서버 시작
app.listen(PORT, () => {
    console.log(`🚀 서버 실행: http://localhost:${PORT}`);
    initDatabase();
});

module.exports = app;
