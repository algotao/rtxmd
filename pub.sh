# 这是一个发布脚本，将项目编译成静态文件，然后发布到 wiki.algo.com.cn
# 发布需要ssh密钥，仅限作者自身使用

set -e
rm -rf ./build
npm run build

rsync -avz ./build/ wiki.algo.com.cn:/data/docker/nginx/web/wiki.algo.com.cn/
