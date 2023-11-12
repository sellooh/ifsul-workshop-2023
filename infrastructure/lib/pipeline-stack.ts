import { Container, Environment, HttpLoadBalancerExtension, Service, ServiceDescription } from '@aws-cdk-containers/ecs-service-extensions';
import * as cdk from 'aws-cdk-lib';
import { StringParameter } from 'aws-cdk-lib/aws-ssm';
import { CodePipeline, CodePipelineSource, ShellStep } from 'aws-cdk-lib/pipelines';
import { Construct } from 'constructs';
import { ServiceStack, ServiceStage } from './service-stack';
import { PolicyStatement } from 'aws-cdk-lib/aws-iam';

interface PipelineStackProps {
  branchName: string;
  stackProps: cdk.StackProps;
}

export class PipelineStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: PipelineStackProps) {
    super(scope, id, props.stackProps);

    const githubConnectionArn = StringParameter.valueForStringParameter(this, "/demo/githubConnection");

    const githubInput = CodePipelineSource.connection("sellooh/ifsul-workshop-2023", props.branchName, {
      connectionArn: githubConnectionArn,
    });

    const codebuildPolicies: PolicyStatement[] = [
      // allow read params
      new PolicyStatement({
        actions: ["ssm:GetParameter"],
        resources: [`arn:aws:ssm:${this.region}:${this.account}:*`],
      }),
      // allow ec2 describe
      new PolicyStatement({
        actions: ["ec2:Describe*"],
        resources: ["*"],
      }),
      // allow alb describ
      new PolicyStatement({
        actions: ["elasticloadbalancing:Describe*"],
        resources: ["*"],
      }),
    ];

    const codepipeline = new CodePipeline(this, "Pipeline", {
      pipelineName: "Pipeline",
      synth: new ShellStep("Synth", {
        input: githubInput,
        commands: ["cd infrastructure", "npm ci", "npm run build", "npx cdk synth"],
        primaryOutputDirectory: "infrastructure/cdk.out",
      }),
      codeBuildDefaults: {
        rolePolicy: codebuildPolicies,
      },
    });

    const deployWave = codepipeline.addWave("DeployWave");
    deployWave.addStage(new ServiceStage(this, "ServiceStage", {
      serviceName: props.branchName,
      stackProps: props.stackProps,
    }));
  }
}

