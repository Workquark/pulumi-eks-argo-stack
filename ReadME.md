# Deploy EKS and argo stack apps-

## Create EKS using pulumi -

  > export the variable for pulumi passphrase and pulumi up command -
  > put this in .zshrc/.bashrc for local
  
    export PULUMI_CONFIG_PASSPHRASE="pulumi"
  
  > set the aws profile for the setup

    pulumi config set aws:profile <profileName>

  > -s option is for stack. Here dev is the stack and -y is basically approval for --yes parameter.

    pulumi up -s dev -y

## Create the initial argocd deployment -

  > apply argocd kustomize -

    kubectl apply -k manifests/argocd/overlays/dev

## Create the argocd project -

    kubectl apply -f manifests/project.yaml 

## Create the argocd apps -

    kubectl apply -f manifests/apps.yaml

## The apps which would be created are -

    - nginx ingress
    - sealed secrets 
