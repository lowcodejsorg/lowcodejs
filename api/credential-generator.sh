#!/bin/bash

openssl genrsa -out temp_private.pem 2048
openssl rsa -in temp_private.pem -pubout -out temp_public.pem

echo "JWT_PRIVATE_KEY=$(base64 -w 0 temp_private.pem)"
echo "JWT_PUBLIC_KEY=$(base64 -w 0 temp_public.pem)"
echo "COOKIE_SECRET=$(openssl rand -hex 32)"

rm temp_private.pem temp_public.pem