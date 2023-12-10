import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as elb from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import { Container, Environment, EnvironmentCapacityType, Service, ServiceDescription } from '@aws-cdk-containers/ecs-service-extensions';
import { ImportedHttpLoadBalancerExtension } from '../extensions/ImportedHttpLoadBalancerExention';
import { MyHealthCheckExtension } from '../extensions/ContainerHealthcheckExtension';
import { Platform } from 'aws-cdk-lib/aws-ecr-assets';
import { MysqlExtension } from '../extensions/MysqlExtension';

interface ServiceStageProps {
  serviceName: string;
  stackProps?: cdk.StackProps;
}

export class ServiceStage extends cdk.Stage {
  constructor(scope: Construct, id: string, props: ServiceStageProps) {
    super(scope, id, props.stackProps);

    new ServiceStack(this, props.serviceName, {
      serviceName: props.serviceName,
      stackProps: props.stackProps,
    });
  }
}

interface ServiceStackProps {
  serviceName: string;
  stackProps?: cdk.StackProps;
}

export class ServiceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: ServiceStackProps) {
    super(scope, id, props.stackProps);

    // Import /demo/vpcId
    const vpcId = ssm.StringParameter.valueFromLookup(this, '/demo/vpcId');
    const vpc = ec2.Vpc.fromLookup(this, 'vpc', {
      vpcId
    });

    // Import /demo/clusterName
    const clusterName = ssm.StringParameter.valueFromLookup(this, '/demo/clusterName');
    const cluster = ecs.Cluster.fromClusterAttributes(this, 'cluster', {
      clusterName,
      vpc,
      securityGroups: []
    });

    // Import /demo/loadBalancerArn
    const loadBalancerArn = ssm.StringParameter.valueFromLookup(this, '/demo/loadBalancerArn');
    const applicationLoadBalancer = elb.ApplicationLoadBalancer.fromLookup(this, 'loadBalancer', {
      loadBalancerArn
    });

    // Import /demo/<branch>/targetGroupArn
    const targetGroupArn = ssm.StringParameter.valueFromLookup(this, `/demo/${props.serviceName}/targetGroupArn`);
    let targetGroup = undefined;
    if (targetGroupArn.indexOf('dummy') === -1) {
      targetGroup = elb.ApplicationTargetGroup.fromTargetGroupAttributes(this, 'targetGroup', {
        targetGroupArn
      });
    }

    const environment = Environment.fromEnvironmentAttributes(this, 'demo', {
      cluster: cluster as ecs.Cluster,
      capacityType: EnvironmentCapacityType.FARGATE
    });

    // create docker asset cdk
    const image = ecs.ContainerImage.fromAsset('..', {
      buildArgs: {
        JAVA_TARGETPLATFORM: 'linux/amd64',
      },
      platform: Platform.LINUX_AMD64,
      assetName: props.serviceName,
      target: 'cloud'
    });

    const nameDescription = new ServiceDescription();
    nameDescription.add(new Container({
      cpu: 1024,
      memoryMiB: 2048,
      trafficPort: 8080,
      image,
      environment: {
        API_PORT: '8080',
        MYSQL_ROOT_PASSWORD: process.env.MYSQL_PASSWORD ?? "changeme",
        BASE_PATH: props.serviceName,
      },
    }))
    nameDescription.add(new ImportedHttpLoadBalancerExtension({
      applicationLoadBalancer,
      targetGroup,
    }));;

    nameDescription.add(new MyHealthCheckExtension(props.serviceName, ['java', '-jar', 'app.jar'], '8080'));
    nameDescription.add(new MysqlExtension());

    const nameService = new Service(this, props.serviceName, {
      environment: environment,
      serviceDescription: nameDescription,
    });
  }
}
