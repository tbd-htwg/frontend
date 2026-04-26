# Image Bucket CORS and Signed Upload Setup

This directory contains the CORS policy for browser uploads to signed Google Cloud Storage URLs and the full setup steps for impersonated URL signing.

## Files

- `cors.json`: CORS policy for direct browser uploads (`PUT`) and image reads (`GET`/`HEAD`).

## 1) Set common variables (shell)

```bash
PROJECT_ID="project-9118634e-c9f1-4f29-804"
BUCKET_NAME="project-9118634e-c9f1-4f29-804-images-bucket"
SIGNER_SA="tripplanning-dev-image-url-sig@${PROJECT_ID}.iam.gserviceaccount.com"
RUN_SA="tripplanning-dev-be-rt@${PROJECT_ID}.iam.gserviceaccount.com"
LOCAL_USER="user:bnthn@posteo.de"

# Production variants
RUN_SA_PROD="tripplanning-prod-be-rt@${PROJECT_ID}.iam.gserviceaccount.com"
SIGNER_SA_PROD="tripplanning-prod-image-url-si@${PROJECT_ID}.iam.gserviceaccount.com"
```

## 2) Create impersonated signer service account

```bash
gcloud iam service-accounts create tripplanning-dev-image-url-sig \
  --project="${PROJECT_ID}" \
  --display-name="Tripplanning signed URL signer"
```

## 3) Enable IAM Credentials API

```bash
gcloud services enable iamcredentials.googleapis.com \
  --project="${PROJECT_ID}"
```

## 4) Allow runtime SA to impersonate signer SA

```bash
gcloud iam service-accounts add-iam-policy-binding "${SIGNER_SA}" \
  --project="${PROJECT_ID}" \
  --member="serviceAccount:${RUN_SA}" \
  --role="roles/iam.serviceAccountTokenCreator"
```

For local development (ADC user account), also grant TokenCreator to your user principal:

```bash
gcloud iam service-accounts add-iam-policy-binding "${SIGNER_SA}" \
  --project="${PROJECT_ID}" \
  --member="${LOCAL_USER}" \
  --role="roles/iam.serviceAccountTokenCreator"
```

## 5) Grant bucket write/read permissions to signer SA

```bash
gcloud storage buckets add-iam-policy-binding "gs://${BUCKET_NAME}" \
  --member="serviceAccount:${SIGNER_SA}" \
  --role="roles/storage.objectCreator"

gcloud storage buckets add-iam-policy-binding "gs://${BUCKET_NAME}" \
  --member="serviceAccount:${SIGNER_SA}" \
  --role="roles/storage.objectViewer"
```

## 6) Apply CORS policy to image bucket

Run this command from repository root:

```bash
gcloud storage buckets update "gs://${BUCKET_NAME}" \
  --cors-file=frontend/doc/image-bucket-cors/cors.json
```

## 7) Verify setup

```bash
gcloud iam service-accounts get-iam-policy "${SIGNER_SA}" --project="${PROJECT_ID}"

gcloud storage buckets get-iam-policy "gs://${BUCKET_NAME}" \
  --format="json(bindings)"

gcloud storage buckets describe "gs://${BUCKET_NAME}" \
  --format="json(cors)"
```

## 8) Backend configuration reminder

Set this in backend runtime environment (Cloud Run/GitHub vars):

```bash
SPRING_CLOUD_GCP_IMPERSONATE_SERVICE_ACCOUNT="${SIGNER_SA}"
```
