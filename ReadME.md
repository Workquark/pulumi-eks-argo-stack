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
## Get The cluster config 

    $ CLUSTER_NAME=$(aws eks list-clusters | jq  -r ".clusters | first")
    $ VPC_ID=$(aws ec2 describe-vpcs | 
    
## Apply ALB ingress controller

    helm upgrade -i aws-load-balancer-controller eks/aws-load-balancer-controller \
      -n kube-system \
      --set clusterName=$CLUSTER_NAME \
      --set serviceAccount.create=false \
      --set serviceAccount.name=alb-ingress-controller \
      --set region=eu-west-1 \
      --set vpcId=$VPC_ID \  
      --set image.repository=602401143452.dkr.ecr.eu-west-1.amazonaws.com/amazon/aws-load-balancer-controller
