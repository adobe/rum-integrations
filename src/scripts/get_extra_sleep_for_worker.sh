WORKER=$1

if [ "$WORKER" = "FASTLY" ]; then
    echo "Fastly doesn't need extra sleep"
else
    echo Sleep an extra hour for Cloudflare or potential Cloudflare
    sleep 3600
fi

