data "aws_ami" "ubuntu" {
  owners      = ["099720109477"]
  most_recent = true
  filter {
    name   = "state"
    values = ["available"]
  }
  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd-gp3/*24.04-amd64*"]
  }
}


resource "aws_key_pair" "ansible_key" {
  key_name   = "terra-ansible-key"
  public_key = file("terra-key.pub")
}

resource "aws_instance" "ansible" {
  ami                         = data.aws_ami.ubuntu.id
  instance_type               = var.instance_type
  key_name                    = aws_key_pair.ansible_key.key_name
  subnet_id                   = data.terraform_remote_state.vpc.outputs.public_subnets[0]
  associate_public_ip_address = true
  user_data = file("install_ansible.sh")
  vpc_security_group_ids = [
    aws_security_group.ansible_sg.id
  ]
  tags = {
    Name = "Ansible-Node"
  }
  root_block_device {
    volume_size = 20
    volume_type = "gp3"
  }

}