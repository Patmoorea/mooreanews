#!/usr/bin/env bash
# Affiche les clés VAPID à copier sur Vercel
npx web-push generate-vapid-keys
echo ""
echo "→ Vercel : VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT=mailto:postmaster@mooreanews.com"
