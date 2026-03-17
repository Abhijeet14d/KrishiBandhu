# EKS Deployment Runbook (KrishiBandhu)

This runbook deploys the current app to AWS EKS, installs Prometheus + Grafana, and enables CPU-based autoscaling.

## 1) Prerequisites

- AWS CLI configured with an IAM user/role that can create EKS and ELB resources
- `eksctl`, `kubectl`, and `helm` installed
- Docker images already pushed to Docker Hub (you already have GitHub Actions for this)

Optional quick checks:

```bash
aws sts get-caller-identity
eksctl version
kubectl version --client
helm version
```

## 2) Create EKS Cluster (t3.small)

```bash
eksctl create cluster \
	--name krishiBandhu \
	--region us-east-1 \
	--nodegroup-name ng-general \
	--node-type t3.small \
	--nodes 2 \
	--nodes-min 2 \
	--nodes-max 4 \
	--managed
```

Verify:

```bash
kubectl get nodes
```

## 3) Install Metrics Server (required for HPA)

```bash
kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml
kubectl -n kube-system rollout status deployment metrics-server
kubectl top nodes
```

If `kubectl top nodes` fails initially, wait 1-2 minutes and retry.

## 4) Deploy Application

Apply namespace first:

```bash
kubectl apply -f aws/k8s/00-namespace.yaml
```

Create backend secret from your local backend `.env` (recommended):

```bash
kubectl -n krishi create secret generic backend-env \
	--from-env-file=backend/.env \
	--dry-run=client -o yaml | kubectl apply -f -
```

Alternative: use and edit `aws/k8s/01-backend-secret.example.yaml`.

Apply backend + frontend + HPAs:

```bash
kubectl apply -f aws/k8s/10-backend.yaml
kubectl apply -f aws/k8s/11-frontend.yaml
```

Verify rollout:

```bash
kubectl -n krishi get deploy,svc,pods,hpa
kubectl -n krishi rollout status deployment/backend
kubectl -n krishi rollout status deployment/frontend
```

Get frontend external endpoint:

```bash
kubectl -n krishi get svc frontend-service
```

Notes:
- Frontend Nginx is configured to proxy `/api/*` and `/socket.io/*` to backend service internally.
- Backend service remains internal (`ClusterIP`) by default.

## 5) Install Prometheus + Grafana

Add helm repo and install kube-prometheus-stack:

```bash
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update

kubectl create namespace monitoring --dry-run=client -o yaml | kubectl apply -f -

helm upgrade --install monitoring prometheus-community/kube-prometheus-stack \
	--namespace monitoring \
	-f aws/monitoring/kube-prometheus-values.yaml
```

Add backend ServiceMonitor and alert rules:

```bash
kubectl apply -f aws/monitoring/backend-servicemonitor.yaml
kubectl apply -f aws/monitoring/backend-alert-rules.yaml
```

Verify monitoring resources:

```bash
kubectl -n monitoring get pods
kubectl -n monitoring get servicemonitor,prometheusrule
```

Get Grafana endpoint:

```bash
kubectl -n monitoring get svc monitoring-grafana
```

Grafana default user: `admin`
Grafana password: value from `aws/monitoring/kube-prometheus-values.yaml`

## 6) Validate Health and Metrics

Backend health:

```bash
kubectl -n krishi port-forward svc/backend-service 5000:80
curl http://localhost:5000/health
curl http://localhost:5000/metrics | head
```

In Grafana, use Prometheus datasource and test queries:

```text
sum(rate(container_cpu_usage_seconds_total{namespace="krishi"}[5m])) by (pod)
histogram_quantile(0.95, sum(rate(http_request_duration_ms_bucket[5m])) by (le))
up{service="backend-service"}
```

## 7) Validate Autoscaling

Check HPA state:

```bash
kubectl -n krishi get hpa -w
```

Generate temporary backend load from inside the cluster:

```bash
kubectl -n krishi run loadgen --rm -it --image=busybox:1.36 -- /bin/sh
# inside pod:
while true; do wget -q -O- http://backend-service/health > /dev/null; done
```

You should see backend CPU usage rise and `backend-hpa` scale replicas up (if threshold sustained).

## 8) Useful Debug Commands

```bash
kubectl -n krishi describe pod <pod-name>
kubectl -n krishi logs deploy/backend --tail=200
kubectl -n krishi logs deploy/frontend --tail=200
kubectl get events -A --sort-by=.lastTimestamp | tail -n 50
```
