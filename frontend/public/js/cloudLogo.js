// GNB 구름 로고: SVG 파일을 인라인으로 주입하고 스크롤 반응 효과를 건다
// <img src>로 넣으면 페이지 CSS(별/글자 애니메이션, 다크모드 해·달 전환)가
// SVG 내부에 적용되지 않으므로 fetch 후 인라인 주입 방식을 사용한다
const ICON_URL = '/images/hj-cloud-icon.svg';

export async function initCloudLogo() {
    const logo = document.querySelector('.logo');
    if (!logo) return;

    try {
        const res = await fetch(ICON_URL);
        if (!res.ok) return;
        logo.innerHTML = await res.text();
    } catch {
        return; // 아이콘 로드 실패 시 로고 없이 동작
    }

    const cloud = logo.querySelector('.hj-cloud-icon');
    if (!cloud) return;

    let offset = 0;   // 현재 적용 중인 오프셋(px)
    let target = 0;   // 스크롤 속도로 쌓이는 목표 오프셋(px)
    let lastY = window.scrollY;
    let rafId = null;

    const tick = () => {
        target *= 0.88;                       // 목표값은 서서히 0으로 복귀
        offset += (target - offset) * 0.15;   // 현재값은 목표를 부드럽게 추적

        if (Math.abs(offset) < 0.05 && Math.abs(target) < 0.05) {
            cloud.style.transform = '';
            rafId = null;
            return;
        }

        // 스크롤 다운 → 구름이 살짝 떠오르며 기울고, 멈추면 되돌아옴
        cloud.style.transform = `translateY(${(-offset).toFixed(2)}px) rotate(${(offset * 0.6).toFixed(2)}deg)`;
        rafId = requestAnimationFrame(tick);
    };

    window.addEventListener('scroll', () => {
        const dy = window.scrollY - lastY;
        lastY = window.scrollY;
        target = Math.max(-8, Math.min(8, target + dy * 0.08));
        if (rafId === null) {
            rafId = requestAnimationFrame(tick);
        }
    }, { passive: true });
}
