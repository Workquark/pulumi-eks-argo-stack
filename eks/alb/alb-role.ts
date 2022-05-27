import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

export const alb_role = new aws.iam.Role("alb-ingress-controller-role", {
    name: "ALBIngressControllerRole",
    assumeRolePolicy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [{
            Action: "sts:AssumeRole",
            Effect: "Allow",
            Sid: "",
            Principal: {
                Service: "ec2.amazonaws.com",
            },
        }],
    }),
    tags: {
        "tag-key": "tag-value",
    },
});
