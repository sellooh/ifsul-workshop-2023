import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as elb from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import { Container, Environment, Service, ServiceDescription } from '@aws-cdk-containers/ecs-service-extensions';
import { ImportedHttpLoadBalancerExtension } from '../extensions/ImportedHttpLoadBalancerExention';

export class ServiceStage extends cdk.Stage {
  constructor(scope: Construct, id: string, props?: cdk.StageProps) {
    super(scope, id, props);

    new ServiceStack(this, 'ServiceStack', {
      env: {
        account: process.env.CDK_DEFAULT_ACCOUNT,
        region: process.env.CDK_DEFAULT_REGION,
      },
    });
  }
}

export class ServiceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Import /demo/vpcId
    const vpcId = ssm.StringParameter.valueFromLookup(this, '/demo/vpcId');
    const vpc = ec2.Vpc.fromLookup(this, 'vpc', {
      vpcId
    });

    // Import /demo/clusterName
    const clusterName = ssm.StringParameter.valueFromLookup(this, '/demo/clusterName');

    // Import /demo/loadBalancerArn
    const loadBalancerArn = ssm.StringParameter.valueFromLookup(this, '/demo/loadBalancerArn');
    const applicationLoadBalancer = elb.ApplicationLoadBalancer.fromLookup(this, 'loadBalancer', {
      loadBalancerArn
    });

    const environment = new Environment(this, 'demo', {
      vpc
    });

    const nameDescription = new ServiceDescription();
    nameDescription.add(new Container({
      cpu: 1024,
      memoryMiB: 2048,
      trafficPort: 80,
      image: ecs.ContainerImage.fromRegistry('nathanpeck/name'),
      environment: {
        PORT: '80',
      },
    }))
    nameDescription.add(new ImportedHttpLoadBalancerExtension({
      applicationLoadBalancer,
    }));;

    const nameService = new Service(this, 'myservice', {
      environment: environment,
      serviceDescription: nameDescription,
    });
  }
}
