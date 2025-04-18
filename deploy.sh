#!/bin/bash

# 서버 접속 정보
SERVER_USER=ubuntu
SERVER_IP=15.164.221.25
SERVER_PORT=22222
SERVER_KEY="D:/downloads/서버키.pem"
TARGET_DIR=/home/ubuntu/KKL_FRONT


echo "로컬 빌드 시작"
npm install
npm run build

echo "로컬 빌드 완료"

echo "서버로 빌드 결과 업로드 중..."
scp -i $SERVER_KEY -P $SERVER_PORT -r .next public package.json ecosystem.config.js .env.production $SERVER_USER@$SERVER_IP:$TARGET_DIR

echo "업로드 완료"

echo "서버 접속 후 pm2 재시작"
ssh -i $SERVER_KEY -p $SERVER_PORT $SERVER_USER@$SERVER_IP << EOF
  cd $TARGET_DIR
  pm2 delete kmap || true
  pm2 start ecosystem.config.js
EOF

echo "배포 완료!"
