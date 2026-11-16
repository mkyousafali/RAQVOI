FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev --ignore-scripts
COPY server.mjs admin.mjs admin-mail.mjs validation.mjs google-flow.mjs otp.html ./
USER node
CMD ["node","server.mjs"]
