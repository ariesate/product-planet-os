#!/bin/bash

ssh_port=${INPUT_PORT:-22}
ssh_key=$(mktemp)
echo "$INPUT_KEY" > $ssh_key
chmod 600 $ssh_key

ssh -i $ssh_key -o StrictHostKeyChecking=no -p $ssh_port $INPUT_USER@$INPUT_HOST $@