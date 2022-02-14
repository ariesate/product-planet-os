#!/bin/bash

set -ex

if [ -z $(which pnpm) ]; then
	npm -g i pnpm
fi

pnpm i --no-optional
pnpm run --filter 'product-planet-website' build -- --outDir='../product-planet-server/dist'