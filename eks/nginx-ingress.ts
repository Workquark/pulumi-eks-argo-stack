
// // import * as nginx from "@pulumi/kubernetes-ingress-nginx";
// import { kubeconfig } from "./eks";
// import * as k8s from "@pulumi/kubernetes";
// import { vpc_main } from "./vpc";
// import * as pulumi from "@pulumi/pulumi";

// const clusterProvider = new k8s.Provider("eks", {
//   kubeconfig: kubeconfig
// });

// // const tags = {
// //   "app": "ingress-nginx",
// //   "kind": "load-balancer"
// // }


// // // Install the NGINX ingress controller to our cluster. The controller
// // // consists of a Pod and a Service. Install it and configure the controller
// // // to publish the load balancer IP address on each Ingress so that
// // // applications can depend on the IP address of the load balancer if needed.
// // const ctrl = new nginx.IngressController("nginx-ingress-controller", {
// //   // helmOptions: {
// //   //   name: "ingress-nginx",
// //   //   createNamespace: true,
// //   // },

// //   controller: {
// //     podLabels: {
// //       ...tags
// //     },
// //     publishService: {
// //       enabled: true,
// //     },
// //     service: {
// //       externalTrafficPolicy: "Cluster",
// //       type: "LoadBalancer",
// //       annotations: {
// //         "service.beta.kubernetes.io/aws-load-balancer-backend-protocol": { "tcp": "string" },
// //         "service.beta.kubernetes.io/aws-load-balancer-cross-zone-load-balancing-enabled": { true: "string" },
// //         "service.beta.kubernetes.io/aws-load-balancer-type": { "nlb": "string" }
// //       },
// //     }
// //   },
// // }, {
// //   provider: clusterProvider,
// //   dependsOn: clusterProvider
// // });


// // export const controllerStatus = ctrl.status;

// const ingressNameSpace = new k8s.core.v1.Namespace("ingress-nginx", {
//   metadata: {
//     name: "ingress-nginx"
//   }
// }, {
//   provider: clusterProvider,
//   dependsOn: clusterProvider
// })

// let subnets: string[] = []

// vpc_main.privateSubnetIds.then(privateSubnetIds => {
//   privateSubnetIds.map(s => s.apply(subnet => subnets.push(subnet)))
// });


// // Deploy the NGINX ingress controller using the Helm chart.
// export const nginx = new k8s.helm.v3.Chart("nginx",
//   {
//     namespace: ingressNameSpace.metadata.name,
//     chart: "ingress-nginx",
//     version: "4.1.0",
//     fetchOpts: {
//       repo: "https://kubernetes.github.io/ingress-nginx"
//     },
//     values: {
//       controller: {
//         publishService: {
//           enabled: true
//         },
//         service: {
//           externalTrafficPolicy: "Cluster",
//           annotations: {
//             "service.beta.kubernetes.io/aws-load-balancer-backend-protocol": "tcp",
//             "service.beta.kubernetes.io/aws-load-balancer-cross-zone-load-balancing-enabled": true,
//             "service.beta.kubernetes.io/aws-load-balancer-type": "nlb",
//             "service.beta.kubernetes.io/aws-load-balancer-scheme": "internal",
//             // "service.beta.kubernetes.io/aws-load-balancer-subnets": subnets.join(",")
//           }
//         }
//       }
//     },
//     transformations: [
//       (obj: any) => {
//         // Do transformations on the YAML to set the namespace
//         if (obj.metadata) {
//           obj.metadata.namespace = ingressNameSpace.metadata.name;
//         }
//       },
//     ],
//   },
//   { providers: { kubernetes: clusterProvider } },
// );
