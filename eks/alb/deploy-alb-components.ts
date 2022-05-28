import * as k8s from "@pulumi/kubernetes";
import * as eks from "@pulumi/eks";
import * as pulumi from "@pulumi/pulumi";

interface albDeploymentProps {
    // deploymentLabels: pulumi.Input<{
    //     [key: string]: pulumi.Input<string>;
    // }>
    serviceAccountName: string,
    serviceAccountRoleArn: pulumi.Input<string>,
    // vpcId: pulumi.Input<string>,
    // region: string,
    // repository: string,
    // alb_chart_name: string,
    // alb_chart_version: string,
    namespace: pulumi.Input<string>,
    awsWebIdentityRoleName: string,
    cluster: eks.Cluster
}

export class DeployALBComponents extends pulumi.ComponentResource {

    public readonly ingressClass: k8s.networking.v1.IngressClass;
    public readonly serviceAccount: k8s.core.v1.ServiceAccount;

    constructor(name: string, props: albDeploymentProps, opts?: pulumi.CustomResourceOptions) {
        super("my:kubernetes:deployment", name, props, opts);

        const k8sProvider = new k8s.Provider('deployment-k8s', {
            kubeconfig: props.cluster.kubeconfig.apply(JSON.stringify),
        });

        this.ingressClass = new k8s.networking.v1.IngressClass(props.awsWebIdentityRoleName, {
            kind: "IngressClass",
            apiVersion: "networking.k8s.io/v1",
            metadata: {
                name: name,
                annotations: {
                    "ingressclass.kubernetes.io/is-default-class": "true"
                },
            },
            spec: {
                controller: "ingress.k8s.aws/alb"
            }
        }, {
            provider: k8sProvider
        })

        // Create a Service Account with the IAM role annotated to use with the Pod.
        this.serviceAccount = new k8s.core.v1.ServiceAccount(props.awsWebIdentityRoleName, {
            kind: "ServiceAccount",
            apiVersion: "v1",
            metadata: {
                name: props.serviceAccountName,
                namespace: props.namespace,
                annotations: {
                    "eks.amazonaws.com/role-arn": props.serviceAccountRoleArn
                }
            }
        }, {
            provider: k8sProvider
        })


        //*************************************************************** */
        //********************** Deploy metrics server ****************** */
        //*************************************************************** */
        const guestbook = new k8s.yaml.ConfigFile("metrics-server", {
            file: "https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml",
        });

        /**************************************************************************************************** */
        /*      Below cannot be deployed due to the fact it doesnt maintain the state constantly .
        /*      The deployment keeps changing everytime - secret and mutating webhooks for some reason.
        /*      Also IngressClassParams alb is not being deleted successfully by pulumi for some reason.
        /*      Cannot be forced delete using deleteBeforeReplace because its a child component.
        /*      Please do not try.
        /*
        /*      DEPLOY THE BELOW RESOURCES WITH ARGOCD INSTEAD.
        /**************************************************************************************************** */


        // let albIngressController = new k8s.helm.v3.Chart("aws-alb-ingress-controller", {
        //     fetchOpts: {
        //         repo: "https://aws.github.io/eks-charts"
        //     },
        //     chart: props.alb_chart_name,
        //     version: props.alb_chart_version,
        //     values: {
        //         keepTLSSecret: true,
        //         clusterName: props.cluster.eksCluster.name,
        //         serviceAccount: {
        //             name: serviceAccount.metadata.name,
        //             create: false
        //         },
        //         region: props.region,
        //         vpcId: props.vpcId,
        //         image: {
        //             repository: props.repository
        //         }
        //     },
        //     namespace: props.namespace
        // }, {
        //     provider: k8sProvider,
        //     dependsOn: [serviceAccount]
        // });

        // let nginxDeployment = new k8s.apps.v1.Deployment(name, {
        //     metadata: {
        //         name: name,
        //         labels: props.deploymentLabels
        //     },
        //     spec: {
        //         replicas: 1,
        //         selector: { matchLabels: props.deploymentLabels },
        //         template: {
        //             metadata: { labels: props.deploymentLabels },
        //             spec: {
        //                 containers: [{
        //                     name: name,
        //                     // image: awsx.ecr.buildAndPushImage("database-side-service", "./databaseside").image(),
        //                     image: "nginx:latest",
        //                     ports: [{
        //                         name: "http", containerPort: 80
        //                     }]
        //                 }]
        //             },
        //         },
        //         strategy: {
        //             type: "Recreate",
        //         },
        //     }
        // }, {
        //     deleteBeforeReplace: true,
        //     provider: k8sProvider,
        //     dependsOn: [k8sProvider, albIngressController]
        // });

        // new k8s.core.v1.Service(name, {
        //     metadata: {
        //         name: name,
        //         labels: nginxDeployment.metadata.labels
        //     },
        //     spec: {
        //         type: "NodePort",
        //         ports: [{
        //             port: 80,
        //             targetPort: "http"
        //         }],
        //         selector: props.deploymentLabels,
        //         publishNotReadyAddresses: false,
        //     }
        // }, {
        //     provider: k8sProvider,
        //     // dependsOn: [k8sProvider, albIngressController, props.cluster]
        // });


        // This is a demo ingress - 
        // let ingress = new k8s.networking.v1.Ingress(`${name}-ingress-resource`, {
        //     apiVersion: "networking.k8s.io/v1",
        //     kind: "Ingress",
        //     spec: {
        //         ingressClassName: ingressClass.metadata.name,
        //         defaultBackend: {
        //             service: {
        //                 name: name,
        //                 port: {
        //                     number: 80
        //                 }
        //             }
        //         }
        //     },
        //     metadata: {
        //         name: "ingress-nginxapp1",
        //         labels: {
        //             "app": "app1-nginx"
        //         },
        //         annotations: {
        //             "alb.ingress.kubernetes.io/load-balancer-name": "app1ingressrules",
        //             "alb.ingress.kubernetes.io/scheme": "internet-facing",
        //             //# Health Check Settings
        //             "alb.ingress.kubernetes.io/healthcheck-protocol": "HTTP",
        //             "alb.ingress.kubernetes.io/healthcheck-port": "traffic-port",
        //             "alb.ingress.kubernetes.io/healthcheck-path": "/app1/index.html",
        //             "alb.ingress.kubernetes.io/healthcheck-interval-seconds": '15',
        //             "alb.ingress.kubernetes.io/healthcheck-timeout-seconds": '5',
        //             "alb.ingress.kubernetes.io/success-codes": '200',
        //             "alb.ingress.kubernetes.io/healthy-threshold-count": '2',
        //             "alb.ingress.kubernetes.io/unhealthy-threshold-count": '2'
        //         }
        //     }
        // }, {
        //     provider: k8sProvider,
        //     dependsOn: [albIngressController]
        // })
    }
}

