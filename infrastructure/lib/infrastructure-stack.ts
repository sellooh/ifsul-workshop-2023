import { Container, Environment, HttpLoadBalancerExtension, Service, ServiceDescription } from '@aws-cdk-containers/ecs-service-extensions';
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as elb from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as ssm from 'aws-cdk-lib/aws-ssm';

export class InfrastructureStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Import VPC
    const vpc = ec2.Vpc.fromLookup(this, 'vpc', {
      vpcId: process.env.VPC_ID,
    });

    // Create an environment to deploy a service in.
    const environment = new Environment(this, 'demo', {
      vpc
    });

    // Create the Load Balancer
    const lb = new elb.ApplicationLoadBalancer(this, 'LB', {
      vpc,
      internetFacing: true,
    });

    // Add vpc id to parameter
    const vpcId = vpc.vpcId;
    new ssm.StringParameter(this, 'vpcId', {
      parameterName: '/demo/vpcId',
      stringValue: vpcId,
    });

    // Add cluster name to parameter
    const clusterName = environment.cluster.clusterName;
    new ssm.StringParameter(this, 'clusterName', {
      parameterName: '/demo/clusterName',
      stringValue: clusterName,
    });

    // Add load balancer arn to parameter
    const loadBalancerArn = lb.loadBalancerArn;
    new ssm.StringParameter(this, 'loadBalancerArn', {
      parameterName: '/demo/loadBalancerArn',
      stringValue: loadBalancerArn,
    });
  }
}
