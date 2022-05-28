import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";
import { local } from "@pulumi/command";
import * as k8s from "@pulumi/kubernetes";

import { alb_policy } from "./alb-policy";
import { cluster } from "../eks";


// get thumbprint - 
// $ THUMBPRINT=$(echo | openssl s_client -servername oidc.eks.eu-west-1.amazonaws.com -showcerts -connect oidc.eks.eu-west-1.amazonaws.com:443 2>&- | tac | sed -n '/-----END CERTIFICATE-----/,/-----BEGIN CERTIFICATE-----/p; /-----BEGIN CERTIFICATE-----/q' | tac | openssl x509 -fingerprint -noout | sed 's/://g' | awk -F= '{print tolower($2)}')

interface awsAlbProps {

}


//***** NOTES */
/* $ THUMBPRINT=$(echo | openssl s_client -servername oidc.eks.eu-west-1.amazonaws.com -showcerts -connect oidc.eks.eu-west-1.amazonaws.com:443 2>&- | tac | sed -n '/-----END CERTIFICATE-----/,/-----BEGIN CERTIFICATE-----/p; /-----BEGIN CERTIFICATE-----/q' | tac | openssl x509 -fingerprint -noout | sed 's/://g' | awk -F= '{print tolower($2)}')

//*** */
export class OidcComponentsDeploy extends pulumi.ComponentResource {

    public saName = 'alb-ingress-controller';
    public awsWebIdentityRoleName = "AlbWebIdentityRole";
    public saRole!: aws.iam.Role;

    private defaultOpenIdConnectProvider!: aws.iam.OpenIdConnectProvider;


    getThumbPrint(thumbprint: string): string {
        return thumbprint;
    }

    constructor(name: string, props: awsAlbProps, opts?: pulumi.ComponentResourceOptions) {
        super("my:kubernetes:alb:components:oidc-components", name, props, opts);

        const oidc_thumbprint = new local.Command("oidc_thumbprint", {
            create: "openssl s_client -servername oidc.eks.eu-west-1.amazonaws.com -showcerts -connect oidc.eks.eu-west-1.amazonaws.com:443 2>&- | tac | sed -n '/-----END CERTIFICATE-----/,/-----BEGIN CERTIFICATE-----/p; /-----BEGIN CERTIFICATE-----/q' | tac | openssl x509 -fingerprint -noout | sed 's/://g' | awk -F= '{print tolower($2)}'",
        });

        oidc_thumbprint.stdout.apply(console.log)

        const k8sProvider = new k8s.Provider('k8s', {
            kubeconfig: cluster.kubeconfig.apply(JSON.stringify),
        });

        // get existing namespace "kube-system"
        const appsNamespaceName = k8s.core.v1.Namespace.get("kube-system", "kube-system", {
            provider: k8sProvider
        });



        this.defaultOpenIdConnectProvider = new aws.iam.OpenIdConnectProvider("oidc-provider", {
            clientIdLists: ["sts.amazonaws.com"],
            thumbprintLists: [oidc_thumbprint.stdout], // this gives the thumbprint
            url: cluster.eksCluster.identities[0].oidcs[0].issuer, // this gives the cluster oidc provider url
        }, {
            deleteBeforeReplace: true
        });

        const saAssumeRolePolicy = pulumi
            .all([cluster.eksCluster.identities[0].oidcs[0].issuer, this.defaultOpenIdConnectProvider.arn, appsNamespaceName.metadata.name])
            .apply(([url, arn, namespace]) =>
                aws.iam.getPolicyDocument({
                    statements: [
                        {
                            actions: ['sts:AssumeRoleWithWebIdentity'],
                            conditions: [
                                {
                                    test: 'StringEquals',
                                    values: [`system:serviceaccount:${namespace}:${this.saName}`],
                                    variable: `${url.replace('https://', '')}:sub`,
                                },
                            ],
                            effect: 'Allow',
                            principals: [{ identifiers: [arn], type: 'Federated' }],
                        },
                    ],
                })
            );

        this.saRole = new aws.iam.Role(this.awsWebIdentityRoleName, {
            name: this.awsWebIdentityRoleName,
            assumeRolePolicy: saAssumeRolePolicy.json,
        });

        // console.log(JSON.stringify(this.saRole))

        const saS3Rpa = new aws.iam.RolePolicyAttachment(this.awsWebIdentityRoleName, {
            policyArn: alb_policy.arn,
            role: this.saRole,
        });
    }
}