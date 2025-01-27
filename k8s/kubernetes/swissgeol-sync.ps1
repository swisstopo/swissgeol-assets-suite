param (
    [Parameter(Mandatory=$true)]
    [ValidateSet("swissgeol-assets-sync")]
    [string]$template,

    [Parameter(Mandatory=$true)]
    [ValidateSet("swissgeol-assets-view-sync")]
    [string]$name,

    [Parameter(Mandatory=$true)]
    [ValidateSet("install","upgrade","uninstall")]
    [string]$action,

    [Parameter(Mandatory=$true)]
    [string]$context
)

# variables
$namespace = "$template"

Write-Output "*** Prepare kubectl context '$context' ***"
kubectl config use-context $context
kubectl create namespace $namespace --dry-run=client -o yaml | kubectl apply -f -
kubectl config set-context --current --namespace=$namespace

Write-Output "*** Execute action '$action' on context '$context' ***"
if ($action -eq 'install') {
    helm install $name helm/$template --namespace=$namespace --values helm/$template/values-prod-view-sync.yaml --values helm/$template/secrets-prod-view-sync.yaml
} elseif ($action -eq 'upgrade') {
    helm upgrade $name helm/$template --namespace=$namespace --values helm/$template/values-prod-view-sync.yaml --values helm/$template/secrets-prod-view-sync.yaml
} elseif ($action -eq 'uninstall') {
    helm uninstall $name --namespace=$namespace
} else {
    Write-Output "Invalid action '$action'"
}
