import { Service, ServiceExtension } from '@aws-cdk-containers/ecs-service-extensions';
import { Duration, Stack } from 'aws-cdk-lib';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

const MYSQL_IMAGE = 'mysql:8.2.0';

/**
 * This extension adds an X-Ray daemon inside the task definition for
 * capturing application trace spans and submitting them to the AWS
 * X-Ray service.
 */
export class MysqlExtension extends ServiceExtension {
  constructor() {
    super('mysql');
  }

  public prehook(service: Service, scope: Construct) {
    this.parentService = service;
  }

  public useTaskDefinition(taskDefinition: ecs.TaskDefinition) {
    this.container = taskDefinition.addContainer('mysql', {
      image: ecs.ContainerImage.fromRegistry(MYSQL_IMAGE),
      essential: true,
      memoryReservationMiB: 256,
      environment: {
        MYSQL_DATABASE: "database",
        MYSQL_ROOT_PASSWORD: process.env.MYSQL_PASSWORD ?? "changeme",
      },
      healthCheck: {
        command: [
          'CMD-SHELL',
          'mysqladmin ping -p$MYSQL_ROOT_PASSWORD --protocol tpc',
        ],
        startPeriod: Duration.seconds(10),
        interval: Duration.seconds(5),
        timeout: Duration.seconds(2),
        retries: 10,
      },
      logging: new ecs.AwsLogDriver({ streamPrefix: 'mysql' }),
    });
  }

  public resolveContainerDependencies() {
    if (!this.container) {
      throw new Error('The container dependency hook was called before the container was created');
    }

    const app = this.parentService.serviceDescription.get('service-container');
    if (app && app.container) {
      app.container.addContainerDependencies({
        container: this.container,
        condition: ecs.ContainerDependencyCondition.HEALTHY,
      });
    }
  }
}
