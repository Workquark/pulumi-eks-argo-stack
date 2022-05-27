import * as aws from "@pulumi/aws";
import { pulumiEKSCluster } from "./eks";
import { vpc_main } from "./vpc";

const rawAzInfo = aws.getAvailabilityZones({
    state: "available",
});
let azNames: Array<string>=[],numberOfAZs:number=0;

rawAzInfo.then(az_results=> {
    azNames = az_results.names;
    numberOfAZs = az_results.names.length;
});

// let numberOfAZs: number = azNames.length;


const  subnets = [];
for (let i = 0; i < numberOfAZs; i++) {
    let subnetAddr: number = i*32;
    let netAddr: string = "100.64.";
    
    let cidrSubnet: string = netAddr.concat(String(subnetAddr), ".0/19");

    subnets.push(new aws.ec2.Subnet(`pod-subnet-${i+1}`, {
        availabilityZone: azNames[i],
        cidrBlock: cidrSubnet,
        mapPublicIpOnLaunch: true,
        vpcId: vpc_main.id,
        tags: {
            Name: `EKS-VPC-pod-subnet-${i+1}`,
            [`kubernetes.io/cluster/${pulumiEKSCluster.eksCluster.name}`]: "shared",
        },
    }));
};

export default subnets;