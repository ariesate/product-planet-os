FROM node:16 AS base

FROM base as workspace
WORKDIR /var/opt/app
RUN npm -g i pnpm
COPY .npmrc pnpm-*.yaml package*.json ./

FROM workspace as frontend
COPY packages/product-planet-website ./packages/product-planet-website
COPY packages/doc-editor ./packages/doc-editor
RUN pnpm install --filter 'product-planet-website...' && \
    pnpm run build --filter 'product-planet-website...'

FROM workspace
COPY packages/product-planet-server ./packages/product-planet-server
RUN pnpm install --prod --no-optional --filter 'product-planet-server'
WORKDIR /var/opt/app/packages/product-planet-server
COPY --from=frontend /var/opt/app/packages/product-planet-website/dist ./dist
CMD ["index.js"]
