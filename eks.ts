import * as eks from "@pulumi/eks";
import * as vpc from "./vpc";
import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi"

// class EKSCluster extends pulumi.ComponentResource {
//   constructor() {

//   }
// }


// Create an EKS cluster with the default configuration.
export const pulumiEKSCluster = new eks.Cluster("Pulumi-EKS", {
  name: "PULUMI-EKS-CLUSTER-01",
  skipDefaultNodeGroup: true,
  vpcId: vpc.vpc_main.id,
  // publicSubnetIds: vpc.vpc_main.publicSubnetIds,
  privateSubnetIds: vpc.vpc_main.privateSubnetIds,
  nodeAssociatePublicIpAddress: false,
  // desiredCapacity: 1,
  // minSize: 1,
  // maxSize: 2,
  endpointPrivateAccess: true,
  endpointPublicAccess: true,
  enabledClusterLogTypes: [
    "api",
    "audit",
    "authenticator",
  ],
  providerCredentialOpts: { // This is required if we are applying creds using aws profiles.
    profileName: "JROY-GCP-01"
  }
});

const nodeRole = new aws.iam.Role("eksNodeRole", {
  assumeRolePolicy: JSON.stringify({
    Statement: [{
      Action: "sts:AssumeRole",
      Effect: "Allow",
      Principal: {
        Service: "ec2.amazonaws.com",
      },
    }],
    Version: "2012-10-17",
  })
});

const example_AmazonEKSWorkerNodePolicy = new aws.iam.RolePolicyAttachment("AmazonEKSWorkerNodePolicy", {
  policyArn: "arn:aws:iam::aws:policy/AmazonEKSWorkerNodePolicy",
  role: nodeRole.name,
});
const example_AmazonEKSCNIPolicy = new aws.iam.RolePolicyAttachment("AmazonEKSCNIPolicy", {
  policyArn: "arn:aws:iam::aws:policy/AmazonEKS_CNI_Policy",
  role: nodeRole.name,
});
const example_AmazonEC2ContainerRegistryReadOnly = new aws.iam.RolePolicyAttachment("AmazonEC2ContainerRegistryReadOnly", {
  policyArn: "arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly",
  role: nodeRole.name,
});




const pulumiEksNodegroup = new aws.eks.NodeGroup("Pulumi-EKS-Nodegroup", {
  nodeGroupName: "Pulumi-EKS-Nodegroup",
  clusterName: pulumiEKSCluster.eksCluster.name,
  nodeRoleArn: nodeRole.arn,
  subnetIds: vpc.vpc_main.privateSubnetIds,
  scalingConfig: {
    desiredSize: 1,
    maxSize: 1,
    minSize: 1,
  },
  updateConfig: {
    maxUnavailable: 1,
  },
}, {
  dependsOn: [
    example_AmazonEC2ContainerRegistryReadOnly,
    example_AmazonEKSCNIPolicy,
    example_AmazonEC2ContainerRegistryReadOnly
  ],
});

const vpcCNI = new aws.eks.Addon("vpc-cni", {
  clusterName: pulumiEKSCluster.eksCluster.name,
  addonName: "vpc-cni",
});



const coreDNS = new aws.eks.Addon("coredns", {
  clusterName: pulumiEKSCluster.eksCluster.name,
  addonName: "coredns",
});

const ebsCSIDriver = new aws.eks.Addon("ebsCSIdriver", {
  clusterName: pulumiEKSCluster.eksCluster.name,
  addonName: "aws-ebs-csi-driver",
});




// Export the cluster's kubeconfig.
export const kubeconfig = pulumiEKSCluster.kubeconfig;
