#!/bin/sh

aliyun oss cp $@ \
    --region "$INPUT_REGION" \
    --access-key-id "$INPUT_AK_ID" \
    --access-key-secret "$INPUT_AK_SECRET" \
    "$GITHUB_WORKSPACE/$INPUT_LOCAL_DIR" "$INPUT_ENDPOINT"