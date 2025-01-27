# Kubernetes Deployment

## Connect to Kubernetes Cluster

## Prerequisites

1. Create secret and access key for your [AWS account](https://us-east-1.console.aws.amazon.com/iamv2/home?region=us-east-1#/security_credentials?section=IAM_credentials)
2. Download, install and configure [AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html)
3. Download, install and configure [kubectl](https://kubernetes.io/docs/tasks/tools/install-kubectl-windows/#install-nonstandard-package-tools)
4. Download, install and configure [helm](https://helm.sh/docs/intro/install/)
5. Keel is deployed into cluster [keel installation](https://keel.sh/docs/#installation)

## Validate Application

Validate deployment with

```bash
helm lint helm/swissgeol-assets
```

```bash
helm lint helm/swissgeol-search
```

or pretend to install the chart to the cluster and if there is some issue it will show the error.

```bash
helm install --dry-run swissgeol-assets helm/swissgeol-assets
```

```bash
helm install --dry-run swissgeol-search helm/swissgeol-search
```

## Deploy Application

Use the following commands to install, upgrade and uninstall the swissgeol-asset/swissgeol-search application on the cluster.

Valid actions are `install`, `upgrade` and `uninstall`.
Valid template are `swissgeol-assets` and `swissgeol-search`
Valid stages are `dev`, `int` and `prod`
Valid instance (optional) are `ext` and `view`

```bash
# Installs the application on the cluster
.\swissgeol-app.ps1 -action install -template swissgeol-assets -stage dev -context my-stage-context

# Installs the application on the cluster as specific instance
.\swissgeol-app.ps1 -action install -template swissgeol-search -stage prod -instance view -context my-stage-context

# Update the application on the cluster
.\swissgeol-app.ps1 -action upgrade -template swissgeol-assets -stage dev -context my-stage-context

# Uninstall the application from the cluster. Use with caution!
.\swissgeol-app.ps1 -action uninstall -template swissgeol-assets -stage dev -context my-stage-context
```
