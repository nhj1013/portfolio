// ============================================
// ✅ 방문자 수 카운터
// 페이지 로드 시 방문을 기록하고(쿠키 기준 하루 1회),
// 오늘/누적 방문자 수를 footer 에 표시한다.
// ============================================
import {api} from './api.js';

export async function initVisitor() {
    try {
        const {today, total} = await api('/api/v1/visitors/visit', {method: 'POST'});
        document.getElementById('visitorToday').textContent = today.toLocaleString();
        document.getElementById('visitorTotal').textContent = total.toLocaleString();
    } catch (e) {
        // 카운터 실패는 사이트 이용에 지장이 없으므로 무시
        console.warn('방문자 수 조회 실패:', e.message);
    }
}
