import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import { aws_acm_certificate  } from "./clientvpn-cert";
import { clientvpn_cloudwatch,clientvpn_logstream } from "./clientvpn-cloudwatch";


const clientvpn = new aws.ec2clientvpn.Endpoint("example", {
    description: "myClientVPN",
    serverCertificateArn: aws_acm_certificate.arn,
    clientCidrBlock: "10.0.0.0/16",
    authenticationOptions: [{
        type: "certificate-authentication",
        // rootCertificateChainArn: aws_acm_certificate.root_cert.arn,
    }],
    connectionLogOptions: {
        enabled: true,
        cloudwatchLogGroup: clientvpn_cloudwatch.name,
        cloudwatchLogStream: clientvpn_logstream.name,
    },
});



