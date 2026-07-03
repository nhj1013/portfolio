// data-copy="복사할 텍스트" 버튼 클릭 시 클립보드에 복사하고 얼럿 표시
// 사용 예: <button data-copy="nhj6358@gmail.com">...</button>
export function initCopyText() {
    document.querySelectorAll('[data-copy]').forEach(btn => {
        btn.addEventListener('click', async () => {
            const text = btn.dataset.copy;
            try {
                await navigator.clipboard.writeText(text);
            } catch {
                // 클립보드 API를 못 쓰는 환경(비보안 컨텍스트 등) 폴백
                const ta = document.createElement('textarea');
                ta.value = text;
                ta.style.position = 'fixed';
                ta.style.opacity = '0';
                document.body.appendChild(ta);
                ta.select();
                document.execCommand('copy');
                ta.remove();
            }
            alert('복사되었습니다');
        });
    });
}
