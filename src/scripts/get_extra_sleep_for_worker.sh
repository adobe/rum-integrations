WORKER=$1
TASK=$2

if [ "$WORKER" = "FASTLY" ]; then
    echo "Fastly doesn't need extra sleep"
else
    echo "Running with Cloudflare or potential Cloudflare worker"
    if [ "$TASK" = "s3" ]; then
        echo "Cloudflare s3 extra sleep"
        sleep 2700
    else
        echo "Cloudflare extra sleep"
        sleep 5400
    fi
fi

