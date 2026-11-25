#!/usr/bin/env bash
set -euo pipefail

release_url=$(curl --fail --silent --show-error --location --retry 3 \
  --output /dev/null --write-out '%{url_effective}' \
  'https://github.com/johanohly/AirTrail/releases/latest')
version=${release_url##*/}
if [[ ! "$release_url" =~ ^https://github\.com/johanohly/AirTrail/releases/tag/v[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
  echo "Unexpected stable release URL: $release_url" >&2
  exit 1
fi
current=$(<.upstream-version)
printf 'Currently tracked: %s\nOfficial latest stable: %s\n' "$current" "$version"
if [[ "$current" == "$version" ]]; then
  exit 0
fi
if [[ "$(printf '%s\n' "$current" "$version" | sort -V | tail -1)" != "$version" ]]; then
  echo "Refusing upstream downgrade from $current to $version" >&2
  exit 1
fi

git fetch --no-tags https://github.com/johanohly/AirTrail.git "refs/tags/$version"
upstream=$(git rev-parse 'FETCH_HEAD^{commit}')
if ! git merge --no-ff --no-edit "$upstream"; then
  echo 'The upstream merge failed. Resolve these conflicts on subpath before rerunning.'
  git status --short
  git diff --name-only --diff-filter=U
  git diff --cc
  exit 1
fi
printf '%s\n' "$version" > .upstream-version
git add .upstream-version
git commit -m "chore(subpath): track AirTrail $version"
