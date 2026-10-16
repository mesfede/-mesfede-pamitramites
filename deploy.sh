#!/usr/bin/env bash
# Script de despliegue para Google Cloud Run / Firebase
echo "=== 1. Compilando aplicación ==="
npm run build

echo "=== 2. Desplegando reglas de Firestore ==="
npx firebase deploy --only firestore:rules

echo "=== Despliegue preparado exitosamente ==="
echo "Puedes desplegar la imagen con Cloud Run usando:"
echo "gcloud run deploy pami-guia --source . --region us-central1 --allow-unauthenticated"
