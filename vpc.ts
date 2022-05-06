import * as pulumi from "@pulumi/pulumi";
import * as awsx from "@pulumi/awsx";

export const vpc_main = new awsx.ec2.Vpc("EKS-VPC", {
  cidrBlock: "10.15.0.0/16",
  subnets: [
    { type: "public" },
    { type: "private" },
    { type: "isolated", name: "db" },
    { type: "isolated", name: "redis" },
  ],
  numberOfNatGateways: 1,
  tags: {
    Name: "EKS-VPC"
  }
});
