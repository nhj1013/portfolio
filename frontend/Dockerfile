# ============================================
# ✅ Frontend - Express 정적 서버 + API 프록시
# ============================================
FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY app.cjs ./
COPY public ./public
EXPOSE 3000
CMD ["node", "app.cjs"]
