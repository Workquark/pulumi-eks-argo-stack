import * as eks from "@pulumi/eks";
import * as vpc from "../vpc";
import * as aws from "@pulumi/aws";
import { version } from "os";


const eksVersion = "1.22"
const clusterName = "PULUMI-EKS-CLUSTER-01"
const eksOptimisedAMIId = "ami-0808f507c5d46608c"

// Create an EKS cluster with the default configuration.
export const cluster = new eks.Cluster("Pulumi-EKS", {
  name: clusterName,
  nodeAmiId: eksOptimisedAMIId,
  skipDefaultNodeGroup: true,
  version: eksVersion,
  vpcId: vpc.vpc_main.id,
  // publicSubnetIds: vpc.vpc_main.publicSubnetIds,
  privateSubnetIds: vpc.vpc_main.privateSubnetIds,
  nodeAssociatePublicIpAddress: false,
  // desiredCapacity: 1,
  // minSize: 1,
  // maxSize: 2,
  endpointPrivateAccess: true,
  endpointPublicAccess: true,
  nodeUserData: `/etc/eks/bootstrap.sh ${clusterName} --use-max-pods false --kubelet-extra-args '--max-pods=220'`,
  enabledClusterLogTypes: [
    "api",
    "audit",
    "authenticator",
  ],
  providerCredentialOpts: {
    profileName: aws.config.profile
  },
  // roleMappings: [
  //   {
  //     groups: ["system:masters"],
  //     roleArn: clusterAdminRole.arn,
  //     username: "pulumi:admin-usr",
  //   },
  // ],
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

let policyArns = ['arn:aws:iam::aws:policy/AmazonEKSWorkerNodePolicy'
  , 'arn:aws:iam::aws:policy/AmazonEKS_CNI_Policy'
  , 'arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly']


const rolePolicyAttachments = policyArns.map(rolePolicyArn => {
  let policyName = rolePolicyArn.split('/')[1];

  let rolePolicyAttachment = new aws.iam.RolePolicyAttachment(policyName, {
    policyArn: rolePolicyArn,
    role: nodeRole.name,
  });
  return rolePolicyAttachment
})

const pulumiEksNodegroup = new aws.eks.NodeGroup("Pulumi-EKS-Nodegroup", {
  nodeGroupName: "Pulumi-EKS-Nodegroup-01",
  version: eksVersion,
  clusterName: cluster.eksCluster.name,
  nodeRoleArn: nodeRole.arn,
  subnetIds: vpc.vpc_main.privateSubnetIds,
  scalingConfig: {
    desiredSize: 2,
    maxSize: 2,
    minSize: 1,
  },

  updateConfig: {
    maxUnavailable: 1,
  }
}, {
  dependsOn: rolePolicyAttachments
});

['vpc-cni', 'coredns', 'aws-ebs-csi-driver'].forEach(addon => {
  const addon_resource = new aws.eks.Addon(addon, {
    clusterName: cluster.eksCluster.name,
    addonName: addon,
  }, {
    deleteBeforeReplace: true
  });
});


// Export the cluster's kubeconfig.
// export const kubeconfig = pulumiEKSCluster.kubeconfig;
