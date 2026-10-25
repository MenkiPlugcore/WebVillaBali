#!/usr/bin/env bash
# Workstation setup for the verified Linux Mint 22.3 / Ubuntu Noble amd64 host.
set -euo pipefail
trap 'printf "\nPersiapan berhenti pada baris %s. Kirim pesan error terakhir tanpa kredensial.\n" "$LINENO" >&2' ERR

if (( EUID == 0 )); then
  printf 'Jalankan sebagai pengguna biasa; skrip meminta sudo saat diperlukan.\n' >&2
  exit 1
fi
. /etc/os-release
if [[ "${ID:-}" != linuxmint || "${UBUNTU_CODENAME:-}" != noble || "$(dpkg --print-architecture)" != amd64 ]]; then
  printf 'Skrip ini khusus Linux Mint berbasis Ubuntu Noble, arsitektur amd64.\n' >&2
  exit 1
fi
command -v node >/dev/null
command -v npm >/dev/null
command -v gpg >/dev/null
node -e 'const [a,b,c]=process.versions.node.split(".").map(Number); if(!((a===22&&(b>22||(b===22&&c>=2)))||(a===24&&b>=15)||a>=26)){console.error("Versi Node belum cocok untuk npm 12.2.1.");process.exit(1)}'

sudo -v
printf '\nMemperbarui npm ke 12.2.1…\n'
npm_prefix="$(npm prefix -g)"
npm_root="$(npm root -g)"
node_bin="$(node -p 'process.execPath')"
npm_cli="$(readlink -f "$(command -v npm)")"
if [[ -w "$npm_prefix" && ( ! -e "$npm_root" || -w "$npm_root" ) && ( ! -e "$npm_root/npm" || -w "$npm_root/npm" ) ]]; then
  npm install --global npm@12.2.1 --ignore-scripts --registry=https://registry.npmjs.org
else
  sudo -- "$node_bin" "$npm_cli" install --global npm@12.2.1 --prefix "$npm_prefix" --ignore-scripts --registry=https://registry.npmjs.org
fi
hash -r
[[ "$(npm --version)" == 12.2.1 ]]

printf '\nMenyiapkan paket dan sumber resmi…\n'
sudo apt-get update
sudo apt-get install --yes --no-remove ca-certificates curl
setup_tmp="$(mktemp -d -t aup-backup-setup.XXXXXXXX)"
trap 'rm -rf -- "$setup_tmp"' EXIT

curl --fail --location --show-error --silent --retry 2 https://download.docker.com/linux/ubuntu/gpg -o "$setup_tmp/docker.asc"
curl --fail --location --show-error --silent --retry 2 https://www.postgresql.org/media/keys/ACCC4CF8.asc -o "$setup_tmp/postgresql.asc"
sudo install -d -m 0755 /etc/apt/keyrings /usr/share/postgresql-common/pgdg
sudo install -m 0644 "$setup_tmp/docker.asc" /etc/apt/keyrings/docker.asc
sudo install -m 0644 "$setup_tmp/postgresql.asc" /usr/share/postgresql-common/pgdg/apt.postgresql.org.asc
sudo tee /etc/apt/sources.list.d/docker.sources >/dev/null <<'DOCKER_SOURCE'
Types: deb
URIs: https://download.docker.com/linux/ubuntu
Suites: noble
Components: stable
Architectures: amd64
Signed-By: /etc/apt/keyrings/docker.asc
DOCKER_SOURCE
sudo tee /etc/apt/sources.list.d/pgdg.sources >/dev/null <<'POSTGRES_SOURCE'
Types: deb
URIs: https://apt.postgresql.org/pub/repos/apt
Suites: noble-pgdg
Components: main
Architectures: amd64
Signed-By: /usr/share/postgresql-common/pgdg/apt.postgresql.org.asc
POSTGRES_SOURCE

printf '\nMengunduh Supabase CLI 2.122.0 dan memeriksa checksum…\n'
curl --fail --location --show-error --silent --retry 2 https://github.com/supabase/cli/releases/download/v2.122.0/supabase_2.122.0_linux_amd64.deb -o "$setup_tmp/supabase.deb"
printf '%s  %s\n' '119a0f7123f381846f80cf3c4efe96cffb943db55b747177c411f2ac705a5942' "$setup_tmp/supabase.deb" | sha256sum --check -

sudo apt-get update
sudo apt-get install --yes --no-remove --no-install-recommends docker-ce docker-ce-cli containerd.io postgresql-client-17 "$setup_tmp/supabase.deb"
sudo systemctl start docker
sudo docker info --format '{{.ServerVersion}}'
# Docker access grants administrative capabilities; only the invoking account is added.
sudo usermod -aG docker "$(id -un)"

repo_root="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/../.." && pwd)"
cd -- "$repo_root"
npm ci --omit=dev --ignore-scripts
printf '\nVersi alat yang terpasang:\n'
node --version
npm --version
supabase --version
docker --version
psql --version
printf '\nPersiapan selesai. Jalankan newgrp docker, lalu ulangi preflight.\n'

