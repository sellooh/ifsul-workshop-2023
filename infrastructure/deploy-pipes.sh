branches=$1
for branch in ${branches//,/ }
do
	BRANCH_NAME=$branch npx cdk deploy PipelineStack-$branch --require-approval never
done
