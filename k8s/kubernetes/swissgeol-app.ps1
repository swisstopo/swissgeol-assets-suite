param (
    [Parameter(Mandatory=$true)]
    [ValidateSet("swissgeol-assets","swissgeol-search")]
    [string]$template,

    [Parameter(Mandatory=$false)]
    [ValidateSet("","ext","view")]
    [string]$instance,

    [Parameter(Mandatory=$true)]
    [ValidateSet("dev","int","prod")]
    [string]$stage,

    [Parameter(Mandatory=$true)]
    [ValidateSet("install","upgrade","uninstall")]
    [string]$action,

    [Parameter(Mandatory=$true)]
    [string]$context
)

# variables
$postfix = ""
if (![string]::IsNullOrEmpty($instance)) {
    $postfix = "-$instance"
} 
$namespace = "$template$postfix" 
$name = "$template$postfix"

Write-Output "*** Prepare kubectl context '$context' ***"
kubectl config use-context $context
kubectl create namespace $namespace --dry-run=client -o yaml | kubectl apply -f - 
kubectl config set-context --current --namespace=$namespace

Write-Output "*** Execute action '$action' on context '$context' ***"
if ($action -eq 'install') {
    helm install $name helm/$template --namespace=$namespace --values helm/$template/values-$stage$postfix.yaml --values helm/$template/secrets-$stage$postfix.yaml
} elseif ($action -eq 'upgrade') {
    helm upgrade $name helm/$template --namespace=$namespace --values helm/$template/values-$stage$postfix.yaml --values helm/$template/secrets-$stage$postfix.yaml
} elseif ($action -eq 'uninstall') {
    helm uninstall $name --namespace=$namespace
} else {
    Write-Output "Invalid action '$action'"
}
