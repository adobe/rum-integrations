WORKER=$1

if [ "$WORKER" = "FASTLY" ]; then
    echo "Fastly doesn't need extra sleep"
else
    echo Sleep an extra 90 minutes for Cloudflare or potential Cloudflare
    sleep 5400
fi

