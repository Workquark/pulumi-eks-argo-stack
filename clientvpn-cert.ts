import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

export const aws_acm_certificate = new aws.acm.Certificate("cert", {
    domainName: "joydeep.tk",
    tags: {
        Environment: "dev",
    },
    validationMethod: "DNS",
});
