import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import * as awsx from "@pulumi/awsx";
import * as eks from "./eks";
import * as oidc_iam from "./alb";
// import * as sn from "./subnets";


const cluster = eks.cluster;
// const role = oidc_iam.saRole;
// const sa = oidc_iam.sa;
// const sarpa = oidc_iam.saS3Rpa;
const oidc_iam_resources = oidc_iam;
const OpenIdConnectProvider = oidc_iam.defaultOpenIdConnectProvider;


// import { nginx } from "./nginx-ingress";

// const kubeconfig = eks.kubeconfig;
// const ingressControllerStatus = nginx;

