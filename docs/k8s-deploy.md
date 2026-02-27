<!-- @format -->

# Deploy Euterpe on Kubernetes

Sona calls Euterpe from Cloudflare Workers, so Euterpe must be reachable at a
public URL. Use Ingress + TLS or a LoadBalancer.

## Prerequisites

- `kubectl` configured for your cluster
- Container registry the cluster can pull from (GHCR, GCR, ECR, or local for
  kind/minikube)
- ffmpeg runs inside the container (included in the Docker image)

## 1. Build and push the image

From the monorepo root:

```bash
# Build (Dockerfile expects repo root as context)
docker build -t ghcr.io/vesta-cx/euterpe:latest -f apps/euterpe/Dockerfile .

# Push (example: ghcr.io/myorg/euterpe)
docker push ghcr.io/vesta-cx/euterpe:latest
```

For **kind** (local): load the image after building:

```bash
kind load docker-image euterpe:latest --name <cluster-name>
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

## 5. Expose externally

**Option A: Ingress** (typical for production)

1. Edit `k8s/ingress.yaml`: set `host`, `ingressClassName`, and TLS if needed
2. For large uploads, add `proxy-body-size` and `proxy-read-timeout` annotations
3. If using cert-manager, TLS can be provisioned automatically
4. Apply:

```bash
kubectl apply -f apps/euterpe/k8s/ingress.yaml
```

**Option B: LoadBalancer**

```bash
kubectl patch service euterpe -p '{"spec":{"type":"LoadBalancer"}}'
kubectl get svc euterpe  # use EXTERNAL-IP as EUTERPE_URL
```

Use HTTPS in front (e.g. load balancer termination or an Ingress) for secure
traffic.

## 6. Configure Sona

Set in Sona’s wrangler secrets or env:

- `EUTERPE_URL` — public URL (e.g. `https://euterpe.example.com`)
- `PRIVATE_EUTERPE_API_KEY` — same value as `EUTERPE_API_KEY` in the Euterpe
  secret

## Verify

```bash
kubectl get pods -l app=euterpe
kubectl logs -f deployment/euterpe
curl -H "Authorization: Bearer <api-key>" https://euterpe.example.com/health
```
