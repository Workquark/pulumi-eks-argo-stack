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
                }
            ],
        }, {
            dependsOn: [argoCDNamespace]
        });
    }
}
