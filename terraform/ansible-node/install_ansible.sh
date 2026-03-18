#!/bin/bash

apt update -y
apt install ansible -y
apt install git -y
apt install python3-pip -y

mkdir -p /home/ubuntu/ansible
chown ubuntu:ubuntu /home/ubuntu/ansible