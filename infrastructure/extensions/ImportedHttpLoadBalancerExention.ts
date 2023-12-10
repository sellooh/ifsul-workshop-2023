import { Duration } from 'aws-cdk-lib';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as alb from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';
import { ServiceExtension, ServiceBuild, Service } from '@aws-cdk-containers/ecs-service-extensions';

export interface HttpLoadBalancerProps {
  /**
   * The number of ALB requests per target.
   */
  readonly requestsPerTarget?: number

  readonly applicationLoadBalancer: alb.IApplicationLoadBalancer

  readonly targetGroup?: alb.IApplicationTargetGroup

  readonly certificateArn?: string
}
/**
 * This extension add a public facing load balancer for sending traffic
 * to one or more replicas of the application container.
 */
export class ImportedHttpLoadBalancerExtension extends ServiceExtension {
  private readonly targetGroup?: alb.IApplicationTargetGroup;
  private readonly alb: alb.IApplicationLoadBalancer;

  constructor (props: HttpLoadBalancerProps) {
    super('load-balancer');
    this.targetGroup = props.targetGroup;
    this.alb = props.applicationLoadBalancer;
  }

  public prehook (service: Service, scope: Construct): void {
    this.parentService = service;
  }

  // Minor service configuration tweaks to work better with a load balancer
  public modifyServiceProps (props: ServiceBuild): ServiceBuild {
    return {
      ...props,

      // Give the task a little bit of grace time to start passing
      // healthchecks. Without this it is possible for a slow starting task
      // to cause the ALB to consider the task unhealthy, causing ECS to stop
      // the task before it actually has a chance to finish starting up
      healthCheckGracePeriod: Duration.minutes(1),
    };
  }

  // After the service is created add the service to the load balancer's listener
  public useService (service: ecs.Ec2Service | ecs.FargateService): void {
    if (this.targetGroup === undefined) {
      return;
    }
    this.targetGroup.addTarget(service);
    // allow security group to receive traffic from ALB
    service.connections.allowFrom(this.alb, ec2.Port.tcp(8080));
    this.parentService.targetGroup = this.targetGroup as alb.ApplicationTargetGroup;
  }
}
