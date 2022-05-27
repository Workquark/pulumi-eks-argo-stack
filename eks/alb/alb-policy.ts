import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

// import iam policy json for alb.
import iam_policy from './iam_policy.json'; // This import style requires "esModuleInterop", see "side notes"


export const alb_policy = new aws.iam.Policy("alb-policy", {
    name: "AWSLoadBalancerControllerIAMPolicy",
    path: "/",
    description: "ALB ingress policy for alb controller",
    policy: JSON.stringify(iam_policy),
});
