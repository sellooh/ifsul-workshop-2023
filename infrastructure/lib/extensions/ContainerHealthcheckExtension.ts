import { Construct } from 'constructs';
import * as cdk from 'aws-cdk-lib';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import {
  Service,
  ServiceBuild,
  ServiceExtension,
  ContainerMutatingHook
} from '@aws-cdk-containers/ecs-service-extensions';

export class MyHealthCheckExtension extends ServiceExtension {
  private readonly cmd: string[];
  private readonly port: string;

  constructor (name: string, cmd: string[], port: string) {
    super(name);
    this.cmd = cmd;
    this.port = port;
  }

  public prehook (service: Service, scope: Construct): void {
    this.parentService = service;
  }

  public modifyTaskDefinitionProps (props: ecs.TaskDefinitionProps): ecs.TaskDefinitionProps {
    return {
      ...props,
      family: this.name,
      runtimePlatform: {
        cpuArchitecture: ecs.CpuArchitecture.X86_64
      }
    };
  }

  public modifyServiceProps (props: ServiceBuild): ServiceBuild & { serviceName: string } {
    return {
      ...props,
      serviceName: this.name
    };
  }

  public addHooks (): void {
    const container = this.parentService.serviceDescription.get('service-container') ?? null;

    if (container === null) {
      throw new Error('My HealthCheck Extension requires a container');
    }

    container.addContainerMutatingHook(new MyHealthCheckHook(this.cmd, this.port));
  }
}

export class MyHealthCheckHook extends ContainerMutatingHook {
  private readonly cmd: string[];
  private readonly port: string;

  constructor (cmd: string[], port: string) {
    super();
    this.cmd = cmd;
    this.port = port;
  }

  public mutateContainerDefinition (props: ecs.ContainerDefinitionOptions): ecs.ContainerDefinitionOptions {
    return {
      ...props,

      entryPoint: ["/bin/bash"],
      command: this.cmd,
      // healthCheck: {
      //   command: [
      //     'CMD-SHELL',
      //     `curl -f http://localhost:${this.port}/version || exit 1`
      //   ],
      //   startPeriod: cdk.Duration.seconds(10),
      //   interval: cdk.Duration.seconds(5),
      //   timeout: cdk.Duration.seconds(2),
      //   retries: 3
      // }
    };
  }
}
