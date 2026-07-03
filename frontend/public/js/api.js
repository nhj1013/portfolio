// ============================================
// ✅ API 공통 모듈 (fetch 래퍼 + 토큰 관리)
// ============================================
const TOKEN_KEY = 'portfolio.accessToken';
const NICKNAME_KEY = 'portfolio.nickname';

export const auth = {
    get token() {
        return localStorage.getItem(TOKEN_KEY);
    },
    get nickname() {
        return localStorage.getItem(NICKNAME_KEY);
    },
    get isLoggedIn() {
        return !!this.token;
    },
    save({accessToken, nickname}) {
        localStorage.setItem(TOKEN_KEY, accessToken);
        localStorage.setItem(NICKNAME_KEY, nickname);
    },
    clear() {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(NICKNAME_KEY);
    },
};

export async function api(path, {method = 'GET', body} = {}) {
    const headers = {'Content-Type': 'application/json'};
    if (auth.token) {
        headers['Authorization'] = `Bearer ${auth.token}`;
    }

    const res = await fetch(`${window.ENV.API_BASE}${path}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
    });

    if (!res.ok) {
        let message = '요청에 실패했습니다.';
        try {
            const data = await res.json();
            if (data.message) message = data.message;
        } catch (e) { /* body 없는 에러 응답 */ }
        throw new Error(message);
    }

    if (res.status === 204 || res.headers.get('content-length') === '0') {
        return null;
    }
    const text = await res.text();
    return text ? JSON.parse(text) : null;
}
