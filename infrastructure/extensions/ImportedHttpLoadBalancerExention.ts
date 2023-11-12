import { CfnOutput, Duration } from 'aws-cdk-lib';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as alb from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import { Construct } from 'constructs';
import { ServiceExtension, ServiceBuild, Service } from '@aws-cdk-containers/ecs-service-extensions';

export interface HttpLoadBalancerProps {
  /**
   * The number of ALB requests per target.
   */
  readonly requestsPerTarget?: number

  readonly applicationLoadBalancer: alb.IApplicationLoadBalancer

  readonly certificateArn?: string
}
/**
 * This extension add a public facing load balancer for sending traffic
 * to one or more replicas of the application container.
 */
export class ImportedHttpLoadBalancerExtension extends ServiceExtension {
  private listener!: alb.IApplicationListener;
  private readonly applicationLoadBalancer!: alb.IApplicationLoadBalancer;
  private readonly requestsPerTarget?: number;
  private readonly certificateArn: string | undefined;

  constructor (props: HttpLoadBalancerProps) {
    super('load-balancer');
    this.requestsPerTarget = props.requestsPerTarget;
    this.applicationLoadBalancer = props.applicationLoadBalancer;
    this.certificateArn = props.certificateArn;
  }

  public prehook (service: Service, scope: Construct): void {
    this.parentService = service;

    this.listener = this.applicationLoadBalancer.addListener('ApplicationLoadBalancerListener', {
      port: 8080,
      open: true,
      protocol: alb.ApplicationProtocol.HTTP,
      certificates: this.certificateArn ? [{
        certificateArn: this.certificateArn
      }] : undefined
    });
    this.listener.addAction('DefaultAction', {
      action: alb.ListenerAction.fixedResponse(404, {
        contentType: 'text/plain',
        messageBody: 'Cannot route your request; no matching project found.',
      }),
    });
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
    const targetGroup = this.listener.addTargets(this.parentService.id, {
      deregistrationDelay: Duration.seconds(10),
      port: 80,
      conditions: [
        alb.ListenerCondition.pathPatterns([`/${this.parentService.id}/*`])
      ],
      priority: 1,
      targets: [service],
      protocol: alb.ApplicationProtocol.HTTP
    });
    this.parentService.targetGroup = targetGroup;

    // if (this.requestsPerTarget) {
    //   if (!this.parentService.scalableTaskCount) {
    //     throw Error(`Auto scaling target for the service '${this.parentService.id}' hasn't been configured. Please use Service construct to configure 'minTaskCount' and 'maxTaskCount'.`);
    //   }
    //   this.parentService.scalableTaskCount.scaleOnRequestCount(`${this.parentService.id}-target-request-count-${this.requestsPerTarget}`, {
    //     requestsPerTarget: this.requestsPerTarget,
    //     targetGroup: this.parentService.targetGroup,
    //   });
    //   this.parentService.enableAutoScalingPolicy();
    // }
  }
}
