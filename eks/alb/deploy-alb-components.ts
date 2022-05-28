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
    }
}

