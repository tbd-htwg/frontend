# Image Bucket CORS and Signed Upload Setup

This directory contains the CORS policy for browser uploads to signed Google Cloud Storage URLs and the full setup steps for impersonated URL signing.

## Service account setup

- **Signer service account:** Create a dedicated service account whose credentials are used only to **sign** GCS V4 URLs. Grant that account **`roles/storage.objectCreator`** (and usually **`roles/storage.objectViewer`**) on the image bucket so signed `PUT`s succeed (step 5 below).
- **Runtime deletes objects:** The **Cloud Run runtime** service account performs **server-side `storage.delete`** when users remove profile or trip-location images (`DELETE …/images`). It needs **`storage.objects.delete`** on the image bucket (step 5b). Without it, the API still clears the URL in the database but orphaned objects remain in GCS. A practical predefined role is **`roles/storage.objectAdmin`** on the bucket for that SA only; for least privilege, use a **custom role** that includes `storage.objects.delete` (and optionally `storage.objects.get`).
- **Runtime impersonates signer:** Grant the **Cloud Run runtime** service account **`roles/iam.serviceAccountTokenCreator`** on the **signer** service account so the backend can impersonate the signer when minting signed URLs (step 4), rather than using the runtime identity to sign. Set **`SPRING_CLOUD_GCP_IMPERSONATE_SERVICE_ACCOUNT`** to the signer email in the backend environment (step 8).
- **Local development:** For Application Default Credentials on a workstation, grant **TokenCreator** on the signer to your **user** principal as well (second command block in step 4).
- **API:** Enable **`iamcredentials.googleapis.com`** on the project before impersonation-based signing works (step 3).

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

## 5b) Grant runtime SA object delete (server-side image removal)

The backend removes blobs with the **Cloud Run runtime** identity (Application Default Credentials), not the signer. Grant that identity permission to delete objects in the image bucket.

Using the predefined role that includes delete (adjust `RUN_SA` / `RUN_SA_PROD` per environment):

```bash
gcloud storage buckets add-iam-policy-binding "gs://${BUCKET_NAME}" \
  --member="serviceAccount:${RUN_SA}" \
  --role="roles/storage.objectAdmin"
```

Production example:

```bash
gcloud storage buckets add-iam-policy-binding "gs://${BUCKET_NAME}" \
  --member="serviceAccount:${RUN_SA_PROD}" \
  --role="roles/storage.objectAdmin"
```

For **least privilege**, create a custom role with only `storage.objects.delete` (and `storage.objects.get` if you add existence checks), bind that role to `RUN_SA` on the bucket, and omit `objectAdmin` if you prefer not to grant full object lifecycle control to the runtime SA.

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
