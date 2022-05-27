import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";
import { local } from "@pulumi/command";
import { cluster } from "../eks";
import { alb_policy } from "./alb-policy";

import * as k8s from "@pulumi/kubernetes";


const k8sProvider = new k8s.Provider('k8s', {
    kubeconfig: cluster.kubeconfig.apply(JSON.stringify),
});

// get existing namespace "kube-system"
const appsNamespaceName = k8s.core.v1.Namespace.get("kube-system", "kube-system", {
    provider: k8sProvider
})

// const appsNamespaceName = new k8s.core.v1.Namespace('kube-system', undefined, {
//     provider: k8sProvider
// });

let clusterOidcProviderUrl = "";
const clusterOidcProviderArn = cluster.core.oidcProvider?.arn;
const saName = 'alb-ingress-controller'
const awsWebIdentityRoleName = "AlbWebIdentityRole"
let defaultOpenIdConnectProvider: aws.iam.OpenIdConnectProvider;

// get thumbprint - 
// $ THUMBPRINT=$(echo | openssl s_client -servername oidc.eks.eu-west-1.amazonaws.com -showcerts -connect oidc.eks.eu-west-1.amazonaws.com:443 2>&- | tac | sed -n '/-----END CERTIFICATE-----/,/-----BEGIN CERTIFICATE-----/p; /-----BEGIN CERTIFICATE-----/q' | tac | openssl x509 -fingerprint -noout | sed 's/://g' | awk -F= '{print tolower($2)}')

const oidc_thumbprint = new local.Command("oidc_thumbprint", {
    create: "openssl s_client -servername oidc.eks.eu-west-1.amazonaws.com -showcerts -connect oidc.eks.eu-west-1.amazonaws.com:443 2>&- | tac | sed -n '/-----END CERTIFICATE-----/,/-----BEGIN CERTIFICATE-----/p; /-----BEGIN CERTIFICATE-----/q' | tac | openssl x509 -fingerprint -noout | sed 's/://g' | awk -F= '{print tolower($2)}'",
});

oidc_thumbprint.stdout.apply(thumbprint => {




    cluster.eksCluster.identities[0].apply(identity => {

        clusterOidcProviderUrl = identity.oidcs[0].issuer

        defaultOpenIdConnectProvider = new aws.iam.OpenIdConnectProvider("default", {
            clientIdLists: ["sts.amazonaws.com"],
            thumbprintLists: [thumbprint],
            url: clusterOidcProviderUrl,
        });

        const saAssumeRolePolicy = pulumi
            .all([clusterOidcProviderUrl, defaultOpenIdConnectProvider.arn, appsNamespaceName.metadata.name])
            .apply(([url, arn, namespace]) =>

                aws.iam.getPolicyDocument({
                    statements: [
                        {
                            actions: ['sts:AssumeRoleWithWebIdentity'],
                            conditions: [
                                {
                                    test: 'StringEquals',
                                    values: [`system:serviceaccount:${namespace}:${saName}`],
                                    variable: `${url.replace('https://', '')}:sub`,
                                },
                            ],
                            effect: 'Allow',
                            principals: [{ identifiers: [arn], type: 'Federated' }],
                        },
                    ],
                })
            );

        const saRole = new aws.iam.Role(awsWebIdentityRoleName, {
            name: awsWebIdentityRoleName,
            assumeRolePolicy: saAssumeRolePolicy.json,
        });

        const saS3Rpa = new aws.iam.RolePolicyAttachment(awsWebIdentityRoleName, {
            policyArn: alb_policy.arn,
            role: saRole,
        });

        pulumi.all([appsNamespaceName.metadata.name]).apply(([namespace]) => {

            // Create a Service Account with the IAM role annotated to use with the Pod.
            const sa = new k8s.core.v1.ServiceAccount(awsWebIdentityRoleName, {
                kind: "ServiceAccount",
                apiVersion: "v1",
                metadata: {
                    name: saName,
                    namespace: namespace,
                    annotations: {
                        "eks.amazonaws.com/role-arn": saRole.arn
                    }
                }
            }, {
                provider: k8sProvider
            })

            const ingressClass = new k8s.networking.v1.IngressClass(awsWebIdentityRoleName, {
                kind: "IngressClass",
                apiVersion: "networking.k8s.io/v1",
                metadata: {
                    name: "my-aws-ingress-class",
                    annotations: {
                        "ingressclass.kubernetes.io/is-default-class": "true"
                    },
                },
                spec: {
                    controller: "ingress.k8s.aws/alb"
                }
            }, { provider: k8sProvider })

            // This is a demo ingress - 
            const ingress = new k8s.networking.v1.Ingress("alb-ingress", {
                apiVersion: "networking.k8s.io/v1",
                kind: "Ingress",
                spec: {
                    ingressClassName: ingressClass.metadata.name,
                    defaultBackend: {
                        service: {
                            name: "app1-nginx-nodeport-service",
                            port: {
                                // name: "http",
                                number: 80
                            }
                        }
                    },
                    // rules: [
                    //     {
                    //         host: "*",
                    //         http: {
                    //             paths: [
                    //                 {
                    //                     path: "/*",
                    //                     // backend: { serviceName: "service-2048", servicePort: 80 }
                    //                     pathType: "ImplementationSpecific",
                    //                     backend: {
                    //                         service: {
                    //                             name: "app1-nginx-nodeport-service",
                    //                             port: {
                    //                                 name: "http",
                    //                                 number: 80
                    //                             }
                    //                         }
                    //                     }
                    //                 }
                    //             ]
                    //         }
                    //     }
                    // ]
                },
                metadata: {
                    name: "ingress-nginxapp1",
                    labels: {
                        "app": "app1-nginx"
                    },
                    annotations: {
                        "alb.ingress.kubernetes.io/load-balancer-name": "app1ingressrules",
                        "alb.ingress.kubernetes.io/scheme": "internet-facing",
                        //# Health Check Settings
                        "alb.ingress.kubernetes.io/healthcheck-protocol": "HTTP",
                        "alb.ingress.kubernetes.io/healthcheck-port": "traffic-port",
                        "alb.ingress.kubernetes.io/healthcheck-path": "/app1/index.html",
                        "alb.ingress.kubernetes.io/healthcheck-interval-seconds": '15',
                        "alb.ingress.kubernetes.io/healthcheck-timeout-seconds": '5',
                        "alb.ingress.kubernetes.io/success-codes": '200',
                        "alb.ingress.kubernetes.io/healthy-threshold-count": '2',
                        "alb.ingress.kubernetes.io/unhealthy-threshold-count": '2'
                    }
                }
            }, { provider: k8sProvider })
        })
    })
})

export {
    defaultOpenIdConnectProvider
};

// // Create a Service Account with the IAM role annotated to use with the Pod.
// export const sa = new k8s.core.v1.ServiceAccount(
//     saName,
//     {
//         metadata: {
//             namespace: appsNamespaceName.metadata.name,
//             name: saName,
//             annotations: {
//                 'eks.amazonaws.com/role-arn': saRole.arn,
//             },
//         },
//     },
//     {
//         provider: k8sProvider
//     });
