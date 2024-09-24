WORKER=$1

if [ "$WORKER" = "FASTLY" ]; then
    HOST=n.sni.global.fastly.net
elif [ "$WORKER" = "CLOUDFLARE" ]; then
    HOST=rum.hlx.page.cdn.cloudflare.net
else
    echo No host mapping in the DNS case
    exit 0
fi


echo Setting up /etc/hosts mapping for $WORKER by mapping rum.hlx.page to $HOST
echo "$(dig +short $HOST | head -n 1) rum.hlx.page" | tee -a /etc/hosts
