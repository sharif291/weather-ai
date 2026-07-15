import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REGION = process.env.AWS_REGION || 'us-east-2';
const STACK_NAME = 'TerraClimateStack';

console.log(`[Deploy] Querying Stack Outputs for ${STACK_NAME} in region ${REGION}...`);

try {
  const outputsRaw = execSync(
    `aws cloudformation describe-stacks --stack-name ${STACK_NAME} --region ${REGION} --query "Stacks[0].Outputs"`,
    { stdio: ['pipe', 'pipe', 'ignore'] }
  ).toString();

  const outputs = JSON.parse(outputsRaw);
  const bucketName = outputs.find(o => o.OutputKey === 'FrontendBucketName')?.OutputValue;

  if (!bucketName) {
    throw new Error('FrontendBucketName stack output value is missing.');
  }

  console.log(`[Deploy] Found target S3 Bucket: ${bucketName}`);

  console.log('\n[Deploy] Building static assets in frontend directory...');
  execSync('npm run build', { cwd: path.join(__dirname, '../frontend'), stdio: 'inherit' });

  console.log(`\n[Deploy] Uploading assets to S3 bucket: s3://${bucketName}...`);
  execSync(`aws s3 sync frontend/dist s3://${bucketName} --delete`, { cwd: path.join(__dirname, '..'), stdio: 'inherit' });

  console.log('\n✅ Frontend successfully deployed to AWS!');
} catch (err) {
  console.error('\n❌ Deployment failed:', err.message);
  process.exit(1);
}
