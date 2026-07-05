// 스크롤 위치에 따라 GNB에서 현재 보고 있는 섹션의 링크를 강조
export function initScrollSpy() {
    const links = [...document.querySelectorAll('.gnb a[href^="#"]')];
    const sections = links
        .map(a => document.getElementById(a.getAttribute('href').slice(1)))
        .filter(Boolean);
    if (sections.length === 0) return;

    const update = () => {
        // 앵커 스크롤이 멈추는 지점(scroll-padding-top) 바로 아래를 기준선으로,
        // 기준선을 지난 마지막 섹션이 현재 섹션 (CSS 값을 읽으므로 헤더 높이가 바뀌어도 자동 추적)
        const pad = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 110;
        const line = window.scrollY + pad + 10;
        let current = sections[0];
        for (const sec of sections) {
            if (sec.offsetTop <= line) current = sec;
        }

        // 페이지 끝까지 내렸을 때는 마지막 섹션(높이가 짧아도) 강조
        if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2) {
            current = sections[sections.length - 1];
        }

        links.forEach(a =>
            a.classList.toggle('active', a.getAttribute('href') === '#' + current.id)
        );
    };

    window.addEventListener('scroll', update, { passive: true });
    update(); // 초기 진입(새로고침 시 중간 위치 포함) 상태 반영
}
