# Setup

## Infrastructure

```sh
# include the branches you wish to support from the ELB
VPC_ID=XXXX BRANCHES=main,sellooh npx cdk diff InfrastructureStack
```

## Pipelines

```sh
./deploy-pipes.sh main,sellooh
```
