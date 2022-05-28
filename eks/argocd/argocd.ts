//https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

import * as k8s from "@pulumi/kubernetes";
import * as eks from "@pulumi/eks";
import * as pulumi from "@pulumi/pulumi";



interface argoCDProps {
    cluster: eks.Cluster
}

export class ArgoCD extends pulumi.ComponentResource {
    constructor(name: string, props: argoCDProps, opts?: pulumi.CustomResourceOptions) {
        super("my:kubernetes:deployment:argocd", name, props, opts);

        const k8sProvider = new k8s.Provider('argocd-k8s-provider', {
            kubeconfig: props.cluster.kubeconfig.apply(JSON.stringify),
        });

        const argoCDNamespace = new k8s.core.v1.Namespace("argocd", {
            apiVersion: "v1",
            kind: "Namespace",
            metadata: {
                name: "argocd"
            }
        }, {
            provider: props.cluster.provider
        });


        const guestbook = new k8s.yaml.ConfigFile("argocd", {
            file: "https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml",
            transformations: [

                (obj: any, opts: pulumi.CustomResourceOptions) => {
                    if (obj.metadata) {
                        obj.metadata.namespace = "argocd"
                    }
                },
                // // Make every service private to the cluster, i.e., turn all services into ClusterIP instead of LoadBalancer.
                // (obj: any, opts: pulumi.CustomResourceOptions) => {
                //     if (obj.kind === "Service" && obj.apiVersion === "v1") {
                //         if (obj.spec && obj.spec.type && obj.spec.type === "LoadBalancer") {
                //             obj.spec.type = "ClusterIP";
                //         }
                //     }
                // },

                // // Set a resource alias for a previous name.
                // (obj: any, opts: pulumi.CustomResourceOptions) => {
                //     if (obj.kind === "Deployment") {
                //         opts.aliases = [{ name: "oldName" }]
                //     }
                // },

                // // Omit a resource from the Chart by transforming the specified resource definition to an empty List.
                // (obj: any, opts: pulumi.CustomResourceOptions) => {
                //     if (obj.kind === "Pod" && obj.metadata.name === "test") {
                //         obj.apiVersion = "v1"
                //         obj.kind = "List"
                //     }
                // },
            ],
        }, {
            dependsOn: [argoCDNamespace]
        });
    }
}
