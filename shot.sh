#!/bin/bash
# usage: shot.sh URL OUT WIDTH HEIGHT
CH=$(ls -d /opt/data/cache/chrome/chrome-headless-shell-linux64/chrome-headless-shell 2>/dev/null || find /opt/data/cache/chrome/chrome-headless-shell-linux64 -name chrome-headless-shell -type f | head -1)
P=/opt/data/cache/chrome/profile-jcv-$RANDOM
"$CH" --no-sandbox --hide-scrollbars --user-data-dir=$P --window-size=$3,$4 --virtual-time-budget=5000 --screenshot="$2" "$1" >/dev/null 2>&1
rm -rf $P
echo "$2"
