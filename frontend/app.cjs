// ============================================
// ✅ 경력기술서 포트폴리오 - 정적 서버 + API 프록시
// 실무 프로젝트(e3-admin-teacher-admin-front)와 동일하게
// Express 로 정적 리소스를 서빙하고,
// /api 요청은 백엔드(Spring Boot)로 프록시한다.
// → 브라우저는 단일 오리진만 바라보므로 CORS 이슈가 없고,
//   운영 서버에서 백엔드 포트(8080)를 외부에 노출하지 않아도 된다.
// ============================================
const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
// 로컬: localhost:8080 / Docker Compose: http://backend:8080
const API_TARGET = process.env.API_TARGET || 'http://localhost:8080';

app.use('/api', express.raw({type: '*/*', limit: '2mb'}), async (req, res) => {
    const headers = {};
    if (req.headers['content-type']) headers['content-type'] = req.headers['content-type'];
    if (req.headers['authorization']) headers['authorization'] = req.headers['authorization'];
    if (req.headers['cookie']) headers['cookie'] = req.headers['cookie']; // 방문자 쿠키 전달

    const init = {method: req.method, headers};
    if (!['GET', 'HEAD'].includes(req.method) && req.body && req.body.length) {
        init.body = req.body;
    }

    try {
        const upstream = await fetch(`${API_TARGET}/api${req.url}`, init);
        res.status(upstream.status);
        const contentType = upstream.headers.get('content-type');
        if (contentType) res.set('content-type', contentType);
        // 백엔드가 발급한 쿠키(Set-Cookie)를 브라우저까지 전달
        const setCookies = typeof upstream.headers.getSetCookie === 'function'
            ? upstream.headers.getSetCookie()
            : [];
        if (setCookies.length) res.set('set-cookie', setCookies);
        res.send(Buffer.from(await upstream.arrayBuffer()));
    } catch (err) {
        console.error('❌ API 프록시 실패:', err.message);
        res.status(502).json({message: '백엔드 서버에 연결할 수 없습니다.'});
    }
});

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`✅ portfolio front: http://localhost:${PORT} (API → ${API_TARGET})`);
});
