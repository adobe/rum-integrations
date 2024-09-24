JOB_ID=$1
LAST_CHAR=${JOB_ID:0-1}

if ((0<=$LAST_CHAR && $LAST_CHAR<=3))
then
  echo FASTLY
elif ((4<=$LAST_CHAR && $LAST_CHAR<=7))
then
  echo CLOUDFLARE
else
  echo DNS
fi

