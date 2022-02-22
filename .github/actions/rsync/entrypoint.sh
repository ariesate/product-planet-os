#!/bin/bash

ssh_port=${INPUT_PORT:-22}
ssh_key=$(mktemp)
echo "$INPUT_KEY" > $ssh_key
chmod 600 $ssh_key

rsync $@ -e "ssh -i $ssh_key -o StrictHostKeyChecking=no -p $ssh_port" "$GITHUB_WORKSPACE/$INPUT_LOCAL_DIR" "$INPUT_USER@$INPUT_HOST:$INPUT_REMOTE_DIR"