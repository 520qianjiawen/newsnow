#!/usr/bin/env bash
# Activate a NewsNow release from a tarball (stdin or file path).
# Usage:
#   tar -C dist/output -czf - . | ./release.sh
#   ./release.sh /path/to/output.tar.gz
set -euo pipefail

APP_DIR="/home/ubuntu/apps/newsnow"
RELEASES_DIR="${APP_DIR}/releases"
SHARED_DIR="${APP_DIR}/shared"
CURRENT_LINK="${APP_DIR}/current"
KEEP_RELEASES="${KEEP_RELEASES:-5}"
HEALTH_URL="${HEALTH_URL:-http://127.0.0.1:3001/}"

export NVM_DIR="${NVM_DIR:-/home/ubuntu/.nvm}"
# shellcheck disable=SC1091
. "${NVM_DIR}/nvm.sh"

timestamp="$(date -u +%Y%m%d-%H%M%S)"
sha="${DEPLOY_SHA:-${GITHUB_SHA:-manual}}"
release_id="${timestamp}-${sha:0:7}"
release_dir="${RELEASES_DIR}/${release_id}"

mkdir -p "${RELEASES_DIR}" "${SHARED_DIR}/.data" "${SHARED_DIR}/backups"
mkdir -p "${release_dir}"

cleanup_failed_extract() {
  if [[ "$(readlink -f "${CURRENT_LINK}" 2>/dev/null || true)" != "$(readlink -f "${release_dir}" 2>/dev/null || true)" ]]; then
    rm -rf "${release_dir}"
  fi
}

trap cleanup_failed_extract ERR

if [[ -n "${1:-}" ]]; then
  tar --no-same-owner -xzf "$1" -C "${release_dir}"
else
  tar --no-same-owner -xzf - -C "${release_dir}"
fi

if [[ ! -f "${release_dir}/server/index.mjs" ]]; then
  echo "invalid release: missing server/index.mjs" >&2
  cleanup_failed_extract
  exit 1
fi

if [[ -n "${sha}" && "${sha}" != "manual" ]]; then
  printf '%s\n' "${sha}" > "${release_dir}/REVISION"
fi

# Keep SQLite on the shared volume so pruning old releases cannot delete it.
if [[ -d "${CURRENT_LINK}/.data" || -L "${CURRENT_LINK}/.data" ]]; then
  live_data="$(readlink -f "${CURRENT_LINK}/.data")"
  shared_data="$(readlink -f "${SHARED_DIR}/.data")"
  if [[ -n "${live_data}" && "${live_data}" != "${shared_data}" && -f "${live_data}/db.sqlite3" ]]; then
    echo "migrating sqlite from ${live_data} to ${shared_data}"
    if [[ -f "${shared_data}/db.sqlite3" ]]; then
      cp -a "${shared_data}/db.sqlite3" "${SHARED_DIR}/backups/db-${timestamp}-shared-before-migrate.sqlite3"
    fi
    sqlite3 "${live_data}/db.sqlite3" ".backup '${shared_data}/db.sqlite3'"
  fi
fi

ln -sfn "${SHARED_DIR}/.data" "${release_dir}/.data"

previous="$(readlink -f "${CURRENT_LINK}" || true)"
ln -sfn "${release_dir}" "${CURRENT_LINK}.new"
mv -Tf "${CURRENT_LINK}.new" "${CURRENT_LINK}"

cd "${APP_DIR}/current"
pm2 restart newsnow
pm2 save

ok=0
for _ in $(seq 1 30); do
  if curl -fsS -o /dev/null --max-time 3 "${HEALTH_URL}"; then
    ok=1
    break
  fi
  sleep 1
done

if [[ "${ok}" != "1" ]]; then
  echo "health check failed for ${release_id}, rolling back" >&2
  if [[ -n "${previous}" && -d "${previous}" ]]; then
    ln -sfn "${previous}" "${CURRENT_LINK}.new"
    mv -Tf "${CURRENT_LINK}.new" "${CURRENT_LINK}"
    cd "${APP_DIR}/current"
    pm2 restart newsnow
    pm2 save
  fi
  exit 1
fi

trap - ERR

mapfile -t old_releases < <(ls -1dt "${RELEASES_DIR}"/*/ 2>/dev/null | tail -n +$((KEEP_RELEASES + 1)) || true)
current_real="$(readlink -f "${CURRENT_LINK}")"
shared_data="$(readlink -f "${SHARED_DIR}/.data")"
if ((${#old_releases[@]})); then
  for dir in "${old_releases[@]}"; do
    [[ -z "${dir}" ]] && continue
    dir="${dir%/}"
    [[ "$(readlink -f "${dir}")" == "${current_real}" ]] && continue
    data_real="$(readlink -f "${dir}/.data" 2>/dev/null || true)"
    if [[ -n "${data_real}" && "${data_real}" == "${shared_data}" && ! -L "${dir}/.data" ]]; then
      echo "skip prune ${dir}: live sqlite lives here"
      continue
    fi
    echo "prune ${dir}"
    rm -rf "${dir}"
  done
fi

find "${RELEASES_DIR}" -maxdepth 1 -type f -name '*.tar.gz' -mtime +14 -delete || true

echo "deployed ${release_id}"
echo "current -> ${release_dir}"
