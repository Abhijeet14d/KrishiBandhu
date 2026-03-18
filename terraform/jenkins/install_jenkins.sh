#!/bin/bash

# Docker installation
sudo apt-get update -y
sudo apt-get install docker.io -y
sudo systemctl enable docker
sudo systemctl start docker

# Jenkins installation
sudo apt update -y
sudo apt install fontconfig openjdk-21-jre -y


sudo mkdir -p /etc/apt/keyrings
sudo wget -O /etc/apt/keyrings/jenkins-keyring.asc \
  https://pkg.jenkins.io/debian-stable/jenkins.io-2026.key

echo "deb [signed-by=/etc/apt/keyrings/jenkins-keyring.asc]" \
  https://pkg.jenkins.io/debian-stable binary/ | sudo tee \
  /etc/apt/sources.list.d/jenkins.list > /dev/null

sudo apt update -y
sudo apt install jenkins -y

sudo systemctl enable jenkins
sudo systemctl start jenkins


# User group permission
sudo usermod -aG docker ubuntu
sudo usermod -aG docker jenkins


sudo systemctl restart docker
sudo systemctl restart jenkins

