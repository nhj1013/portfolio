# Oracle Cloud 무료 VM 배포 가이드

프론트(80 포트)만 외부에 노출하고, 백엔드와 MySQL은 Docker 내부 네트워크에서만 통신하는 구조입니다.

```
인터넷 ──:80──► frontend (Express, /api 프록시) ──► backend (Spring Boot :8080) ──► MySQL :3306
                          [Docker 내부 네트워크 — 외부 노출 없음]
```

## 1. Oracle Cloud 계정 & VM 생성

1. https://signup.cloud.oracle.com 에서 계정 생성 (해외 결제 가능한 카드 필요, 과금 없음)
2. 콘솔 → **Compute → Instances → Create Instance**
   - Image: **Ubuntu 22.04** (또는 24.04)
   - Shape: **Ampere A1.Flex** (Always Free — 최대 4 OCPU / 24GB. 안 잡히면 VM.Standard.E2.1.Micro)
   - SSH 공개키 등록 (없으면 `ssh-keygen -t ed25519` 로 생성)
3. 생성 후 **공인 IP** 확인

## 2. 방화벽(80 포트) 열기

Oracle은 2중 방화벽입니다. 둘 다 열어야 합니다.

**(1) 클라우드 콘솔** — VCN → Subnet → Security List → Ingress Rule 추가
- Source: `0.0.0.0/0`, Protocol: TCP, Destination Port: `80`

**(2) VM 내부 (Ubuntu)** — SSH 접속 후:
```bash
sudo iptables -I INPUT 5 -p tcp --dport 80 -j ACCEPT
sudo netfilter-persistent save   # 없으면: sudo apt install -y iptables-persistent
```

## 3. Docker 설치

```bash
ssh ubuntu@<공인IP>

curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker ubuntu
exit   # 재접속하면 docker 그룹 적용
```

## 4. 배포

```bash
ssh ubuntu@<공인IP>

git clone https://github.com/nhj1013/portfolio.git
cd portfolio

# 비밀값 설정
cp .env.example .env
nano .env   # 비밀번호/JWT 시크릿을 실제 값으로 교체 (openssl rand -base64 48)

# 빌드 + 기동 (첫 빌드는 5~10분)
docker compose -f docker-compose.prod.yml up -d --build

# 확인
docker compose -f docker-compose.prod.yml ps
curl http://localhost/api/v1/comments
```

브라우저에서 `http://<공인IP>` 접속 → 완료.
`restart: always` 라서 VM이 재부팅돼도 자동으로 다시 뜹니다.

## 5. 코드 수정 후 재배포

```bash
cd ~/portfolio
git pull
docker compose -f docker-compose.prod.yml up -d --build
```

## 6. 도메인 연결 (namhj97.duckdns.org) + HTTPS

### 6-1. DuckDNS 가 VM 을 가리키게 변경

1. https://www.duckdns.org 로그인
2. `namhj97` 도메인의 **current ip** 칸에 VM 공인 IP 입력 → **update ip**
3. 확인: `nslookup namhj97.duckdns.org` 결과가 VM IP 면 완료 (반영은 보통 1분 이내)

이것만 해도 `http://namhj97.duckdns.org` 로 접속됩니다.

### 6-2. HTTPS 적용 (Caddy — 인증서 자동 발급/갱신)

방화벽에서 **443 포트**도 80과 같은 방법으로 열어준 뒤 (Security List + iptables):

```bash
sudo apt install -y caddy
sudo tee /etc/caddy/Caddyfile > /dev/null <<'EOF'
namhj97.duckdns.org {
    reverse_proxy localhost:8081
}
EOF
```

Caddy 가 80/443 을 차지하므로 프론트 컨테이너는 내부 포트로 옮깁니다.
`docker-compose.prod.yml` 의 frontend `ports` 를:

```yaml
    ports:
      - "127.0.0.1:8081:3000"
```

로 바꾼 뒤:

```bash
docker compose -f docker-compose.prod.yml up -d
sudo systemctl reload caddy
```

이후 `https://namhj97.duckdns.org` 접속 — 인증서는 Let's Encrypt 로 자동 발급되고 자동 갱신됩니다.

## 트러블슈팅

| 증상 | 확인 |
|---|---|
| 브라우저 접속 안 됨 | Security List + iptables 둘 다 80 열렸는지 |
| 댓글 로드 실패 (502) | `docker logs portfolio-backend` — MySQL 기동 전 접속 시도면 재시작 대기 |
| 백엔드 기동 실패 | `.env` 의 `MYSQL_PASSWORD` 가 최초 기동 때 값과 다르면 volume 삭제 후 재기동: `docker compose -f docker-compose.prod.yml down -v` |
