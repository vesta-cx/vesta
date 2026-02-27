<!-- @format -->

# Deploy Euterpe on Kubernetes

Sona calls Euterpe from Cloudflare Workers, so Euterpe must be reachable at a public URL. Use Ingress + TLS or a LoadBalancer.

## Prerequisites

- `kubectl` configured for your cluster
- Container registry the cluster can pull from (GHCR, GCR, ECR, or local for kind/minikube)
- ffmpeg runs inside the container (included in the Docker image)

## 1. Build and push the image

From the monorepo root:

```bash
# Build baseline image (Dockerfile expects repo root as context)
docker build -t ghcr.io/vesta-cx/euterpe:latest -f apps/euterpe/Dockerfile .

# Build pointer-compression canary image (optional)
docker build \
  --build-arg NODE_IMAGE=platformatic/node-caged:25-slim \
  -t ghcr.io/vesta-cx/euterpe:node-caged-canary \
  -f apps/euterpe/Dockerfile .

# Push (example: ghcr.io/myorg/euterpe)
docker push ghcr.io/vesta-cx/euterpe:latest
docker push ghcr.io/vesta-cx/euterpe:node-caged-canary
```

For **kind** (local): load the image after building:

```bash
kind load docker-image euterpe:latest --name <cluster-name>
kind load docker-image euterpe:node-caged-canary --name <cluster-name>
```

## 2. Create the secret

```bash
cp apps/euterpe/k8s/secret.yaml.example apps/euterpe/k8s/secret.yaml
# Edit secret.yaml: set real EUTERPE_API_KEY (run `pnpm --filter euterpe gen-key` to generate)
kubectl apply -f apps/euterpe/k8s/secret.yaml
```

Keep `secret.yaml` out of git (it’s in `.gitignore` if you add it).

## 3. Update the Deployment image

If you use a different image name or registry, set it in `k8s/deployment.yaml`:

```yaml
containers:
  - name: euterpe
    image: ghcr.io/myorg/euterpe:latest # change from euterpe:latest
```

## 4. Apply manifests

```bash
kubectl apply -f apps/euterpe/k8s/pvc.yaml
kubectl apply -f apps/euterpe/k8s/configmap.yaml
kubectl apply -f apps/euterpe/k8s/deployment.yaml
kubectl apply -f apps/euterpe/k8s/service.yaml
```

## 4b. Optional: split worker pools by workload

Use workload-specific deployments to isolate scheduling and capacity:

```bash
# Transcode-only workers
kubectl apply -f apps/euterpe/k8s/deployment-transcode-workers.yaml

# Audio-analyze workers
kubectl apply -f apps/euterpe/k8s/deployment-semantic-workers.yaml
```

Each deployment sets `EUTERPE_ALLOWED_WORKLOADS` and node affinity. Label nodes accordingly:

```bash
kubectl label node <node-name> workload/audio-transcode=true
kubectl label node <node-name> workload/audio-analyze=true
```

`EUTERPE_ALLOWED_WORKLOADS` uses `media:kind` tokens (for example `audio:transcode,audio:analyze`).

## 5. Expose externally

**Option A: Ingress** (typical for production)

1. Edit `k8s/ingress.yaml`: set `host`, `ingressClassName`, and TLS if needed
2. For large uploads, add `proxy-body-size` and `proxy-read-timeout` annotations
3. If using cert-manager, TLS can be provisioned automatically
4. Apply:

```bash
kubectl apply -f apps/euterpe/k8s/ingress.yaml
```

### Option B: LoadBalancer

```bash
kubectl patch service euterpe -p '{"spec":{"type":"LoadBalancer"}}'
kubectl get svc euterpe  # use EXTERNAL-IP as EUTERPE_URL
```

Use HTTPS in front (e.g. load balancer termination or an Ingress) for secure traffic.

## 6. Configure Sona

Set in Sona’s wrangler secrets or env:

- `EUTERPE_URL` — public URL (e.g. `https://euterpe.example.com`)
- `PRIVATE_EUTERPE_API_KEY` — same value as `EUTERPE_API_KEY` in the Euterpe secret

## Verify

```bash
kubectl get pods -l app=euterpe
kubectl logs -f deployment/euterpe
curl -H "Authorization: Bearer <api-key>" https://euterpe.example.com/health
```

## Node memory canary checklist

Use this flow for `node-caged` evaluation after streaming I/O changes are deployed.

1. **Compatibility checks**

```bash
# No NAN addons expected
pnpm --filter euterpe exec npm ls nan
```

1. **Canary rollout**

- Keep baseline deployment on `node:20-slim`.
- Create a separate canary deployment and service from:
  - `apps/euterpe/k8s/deployment-canary.yaml`
  - `apps/euterpe/k8s/service-canary.yaml`
- Apply canary manifests:

```bash
kubectl apply -f apps/euterpe/k8s/deployment-canary.yaml
kubectl apply -f apps/euterpe/k8s/service-canary.yaml
```

- Keep app code/config identical between baseline and canary.
- If you have traffic-splitting infra (Ingress controller, service mesh, or gateway), send 5-10% production traffic to canary.
- Otherwise, keep production traffic on baseline and run synthetic canary load checks against the canary service URL only.

1. **Native addon smoke test**

`@libsql/client` can use native binaries. Validate startup and one real transcode before running large canary tests.

```bash
kubectl logs -f deployment/euterpe-canary
curl -H "Authorization: Bearer <api-key>" https://euterpe-canary.example.com/health
```

1. **Load-check command**

Run from monorepo root against each environment:

```bash
# Copy and edit once:
# cp apps/euterpe/scripts/transcode-load-config.example.json /tmp/transcode-load-config.json

node apps/euterpe/scripts/transcode-load-check.mjs \
  --url=https://euterpe.example.com \
  --api-key=... \
  --file=/absolute/path/to/large-input.flac \
  --config=/tmp/transcode-load-config.json \
  --requests=20 \
  --concurrency=2 \
  --poll-ms=1000 \
  --timeout-ms=900000
```

Run this command twice with the same input/config:

- baseline URL (`node:20-slim`)
- canary URL (`platformatic/node-caged:25-slim`)

1. **Compare these metrics**

- Pod/container memory (RSS), process `heapUsed`
- p50/p95/p99 for `POST /transcode`
- job completion latency (submit -> complete)
- transcode failure rate and webhook delivery success
- CPU saturation / throttling

Suggested commands:

```bash
kubectl top pods -l app=euterpe
kubectl top pods -l app=euterpe-canary
kubectl logs deployment/euterpe --since=10m
kubectl logs deployment/euterpe-canary --since=10m
```

1. **Rollback thresholds**

Rollback canary immediately if any of the following are sustained for 3 consecutive 5-minute windows:

- Failure rate increases by >= 1%
- p95 or p99 job latency regresses by >= 10%
- CPU throttling causes queueing/backlog growth
- Any correctness issue in transcoded outputs or webhook payloads
