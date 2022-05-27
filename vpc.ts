import * as pulumi from "@pulumi/pulumi";
import * as awsx from "@pulumi/awsx";
import * as aws from "@pulumi/aws";


export const vpc_main = new awsx.ec2.Vpc("EKS-VPC", {
  cidrBlock: "10.15.0.0/16",
  subnets: [
    { type: "public",
      tags:{
        "kubernetes.io/role/elb": "1",
        "kubernetes.io/cluster/PULUMI-EKS-CLUSTER-01": "shared"
      }
    },
    {
      type: "private",
      tags: {
        "kubernetes.io/role/internal-elb": "",
        "kubernetes.io/cluster/PULUMI-EKS-CLUSTER-01": "shared"
      }
    },
    { type: "isolated", name: "db" },
    { type: "isolated", name: "redis" },
  ],
  numberOfNatGateways: 1,
  tags: {
    Name: "EKS-VPC"
  }
});



const secondaryCidr = new aws.ec2.VpcIpv4CidrBlockAssociation("EKS-VPC-POD-CIDR", {
    vpcId: vpc_main.id,
    cidrBlock: "100.64.0.0/16",
},{
  deleteBeforeReplace: true
});
