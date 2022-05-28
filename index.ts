import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import * as awsx from "@pulumi/awsx";
import * as eks from "./eks/eks";
import * as oidc_iam from "./eks/alb";
import * as vpc from "./vpc";


const cluster = eks.cluster;
const podsubnets = vpc.podsubnets;
// const role = oidc_iam.saRole;
// const sa = oidc_iam.sa;
// const sarpa = oidc_iam.saS3Rpa;
const oidc_iam_resources = oidc_iam;
// const OpenIdConnectProvider = oidc_iam.defaultOpenIdConnectProvider;


// import { nginx } from "./nginx-ingress";

// const kubeconfig = eks.kubeconfig;
// const ingressControllerStatus = nginx;

