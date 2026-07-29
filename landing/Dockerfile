# ═══════════════════════════════════════════════════════════════════
#  ImagineCode landing page
#  A static site — no build step, no Node in the image, ~1.8 MB of files
#  on top of nginx:alpine.
#
#  Build context is this directory (landing/), not the repo root.
#    docker build -t imaginecode-landing landing/
#    docker run --rm -p 4321:4321 imaginecode-landing
# ═══════════════════════════════════════════════════════════════════
FROM nginx:1.27-alpine

# 4321 keeps the container clear of the host ports already in use on the
# VPS (3000, 3001, 8080, 8888) in case it is ever published directly, and
# it matches the dev server in .claude/launch.json so local and deployed
# are the same number. Behind Dokploy's Traefik nothing is published at
# all — this is the container port Traefik dials on the internal network.
EXPOSE 4321

COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copied leaf by leaf rather than `COPY . .` so the Dockerfile and the
# nginx config never end up served as part of the site. Add a line here
# if the site grows a new top-level directory.
COPY index.html /usr/share/nginx/html/index.html
COPY css/       /usr/share/nginx/html/css/
COPY js/        /usr/share/nginx/html/js/
COPY assets/    /usr/share/nginx/html/assets/

# busybox wget — no curl in the alpine image
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -q -O /dev/null http://127.0.0.1:4321/healthz || exit 1
