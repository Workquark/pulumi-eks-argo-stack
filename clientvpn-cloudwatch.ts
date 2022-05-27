import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

export const clientvpn_cloudwatch = new aws.cloudwatch.LogGroup("yada", {
    tags: {
        Application: "clientvpn",
        Environment: "production",
    },
});

export const clientvpn_logstream = new aws.cloudwatch.LogStream("clientvpn", {logGroupName: clientvpn_cloudwatch.name});
