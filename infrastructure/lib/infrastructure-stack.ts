import { Container, Environment, HttpLoadBalancerExtension, Service, ServiceDescription } from '@aws-cdk-containers/ecs-service-extensions';
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as elb from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as ssm from 'aws-cdk-lib/aws-ssm';

export class InfrastructureStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    if (process.env.VPC_ID === undefined) {
      return;
    }
    // Import VPC
    const vpc = ec2.Vpc.fromLookup(this, 'vpc', {
      vpcId: process.env.VPC_ID,
    });

    // Create an environment to deploy a service in.
    const environment = new Environment(this, 'demo', {
      vpc,
    });

    // Create the Load Balancer
    const lb = new elb.ApplicationLoadBalancer(this, 'LB', {
      vpc,
      internetFacing: true,
    });

    // Create listener and target groups
    const listener = lb.addListener('LBListener', {
      port: 80,
      open: true,
      protocol: elb.ApplicationProtocol.HTTP,
    });

    const branches = process.env.BRANCHES?.split(',') || [];
    for(const [i, branch] of branches.entries()) {
      const emptytg = new elb.ApplicationTargetGroup(this, 'applicationTargetGroup-' + branch, {
        vpc,
        port: 8080,
        healthCheck: {
          enabled: true,
          healthyHttpCodes: '200',
          path: `/${branch}/healthcheck`,
          timeout: cdk.Duration.seconds(5),
        },
        targetGroupName: branch,
        targetType: elb.TargetType.IP,
      });
      listener.addTargetGroups('targetGroup-' + branch, {
        targetGroups: [emptytg],
        conditions: [
          elb.ListenerCondition.pathPatterns([`/${branch}/*`])
        ],
        priority: i + 1,
      });

      // Add targetGroup arn to parameter
      const targetGroupArn = emptytg.targetGroupArn;
      new ssm.StringParameter(this, 'targetGroupArn-' + branch, {
        parameterName: `/demo/${branch}/targetGroupArn`,
        stringValue: targetGroupArn,
      });
    }
    listener.addAction('DefaultAction', {
      action: elb.ListenerAction.fixedResponse(404, {
        contentType: 'text/plain',
        messageBody: 'Cannot route your request; no matching project found.',
      }),
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
