#!/bin/bash
# Submit URLs to IndexNow (Bing, Yandex, and participating search engines)
# Usage: ./indexnow-submit.sh /the-lab/new-article-slug

KEY="6ae303f2f8eb4dc4aadd258352a9df18"
HOST="marginlabs.io"

if [ -z "$1" ]; then
  echo "Usage: ./indexnow-submit.sh /the-lab/article-slug [/the-lab/another-slug ...]"
  exit 1
fi

for path in "$@"; do
  URL="https://${HOST}${path}"
  echo "Submitting: ${URL}"
  curl -s -o /dev/null -w "  IndexNow API: HTTP %{http_code}\n" \
    "https://api.indexnow.org/indexnow?url=${URL}&key=${KEY}&keyLocation=https://${HOST}/${KEY}.txt"
  curl -s -o /dev/null -w "  Bing direct:  HTTP %{http_code}\n" \
    "https://www.bing.com/indexnow?url=${URL}&key=${KEY}&keyLocation=https://${HOST}/${KEY}.txt"
done

echo "Done. URLs submitted to IndexNow network."
