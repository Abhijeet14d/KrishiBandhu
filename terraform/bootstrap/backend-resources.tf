resource "aws_dynamodb_table" "state_lock" {
  name         = "my-project-state-lock-table-5559-ad"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "LockID"

  attribute {
    name = "LockID"
    type = "S"
  }

  tags = {
    Name = "state-lock-table-5559-ad"
    Environment = "production"
  }
}
resource "aws_s3_bucket" "remote_s3" {
  bucket = "my-project-remote-terraform-state-bucket-5559-ad"

  tags = {
    Name        = "RemoteTerraformStateBucket"
    Environment = "production"
  }
}