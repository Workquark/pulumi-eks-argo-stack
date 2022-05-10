import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import * as awsx from "@pulumi/awsx";
import * as eks from "./eks";
// import { nginx } from "./nginx-ingress";

const kubeconfig = eks.kubeconfig;
// const ingressControllerStatus = nginx;
