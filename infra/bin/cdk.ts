#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { TerraClimateStack } from '../lib/terraclimate-stack';

const app = new cdk.App();

new TerraClimateStack(app, 'TerraClimateStack', {
  env: { 
    account: process.env.CDK_DEFAULT_ACCOUNT, 
    region: process.env.CDK_DEFAULT_REGION || 'us-east-1' 
  },
});
